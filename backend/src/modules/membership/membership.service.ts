import { Injectable } from '@nestjs/common';
import { AuditService } from '../../shared/audit/audit.service';
import { isUniqueViolation } from '../../shared/db/prisma-errors';
import { PrismaService } from '../../shared/db/prisma.service';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCode } from '../../shared/errors/error-codes';
import { addMonths, membershipState } from '../../shared/membership-status';
import { MemberDto, PlanDto } from '../members/dto/member.dto';

export interface ActivationInput {
  memberId: string;
  adminId: string;
  paymentReference: string;
  amountCents: number;
  planCode?: string;
  requestId?: string;
}

export interface ActivationResult {
  member: MemberDto;
  alreadyActive: boolean;
}

@Injectable()
export class MembershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listPlans(): Promise<PlanDto[]> {
    const plans = await this.prisma.client.plan.findMany({ where: { isActive: true }, orderBy: { priceCents: 'desc' } });
    return plans.map(PlanDto.from);
  }

  /** Member picks a tier. Only allowed before activation (changes after that go through an admin). */
  async selectPlan(userId: string, planCode: string, requestId?: string): Promise<MemberDto> {
    const plan = await this.prisma.client.plan.findFirst({ where: { code: planCode, isActive: true } });
    if (!plan) throw AppError.unprocessable(ErrorCode.PLAN_NOT_FOUND, 'Unknown membership plan');

    const updated = await this.prisma.client.user.updateMany({
      where: { id: userId, status: 'INACTIVE' },
      data: { planId: plan.id },
    });
    if (updated.count === 0) {
      throw AppError.unprocessable(ErrorCode.PLAN_CHANGE_NOT_ALLOWED, 'Plan can only be chosen before activation');
    }
    await this.audit.record({
      action: 'member.plan_selected',
      actorType: 'member',
      actorId: userId,
      subjectType: 'user',
      subjectId: userId,
      requestId,
      data: { planCode: plan.code },
    });
    const user = await this.prisma.client.user.findUniqueOrThrow({ where: { id: userId }, include: { plan: true } });
    return MemberDto.from(user);
  }

  /**
   * Admin activation after off-system payment. Idempotent: activating a currently active
   * member returns its state unchanged. An expired member is renewed.
   */
  async activate(input: ActivationInput): Promise<ActivationResult> {
    const result = await this.prisma.client.$transaction(async (tx) => {
      // Lock the member row so two admins cannot activate the same member twice.
      const locked = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM users WHERE id = ${input.memberId}::uuid AND role = 'MEMBER' FOR UPDATE`;
      if (locked.length === 0) throw AppError.notFound(ErrorCode.MEMBER_NOT_FOUND, 'Member not found');

      const user = await tx.user.findUniqueOrThrow({ where: { id: input.memberId }, include: { plan: true } });
      if (membershipState(user) === 'active') {
        return { user, alreadyActive: true };
      }

      const plan = input.planCode
        ? await tx.plan.findFirst({ where: { code: input.planCode, isActive: true } })
        : user.plan;
      if (input.planCode && !plan) throw AppError.unprocessable(ErrorCode.PLAN_NOT_FOUND, 'Unknown membership plan');
      if (!plan) throw AppError.unprocessable(ErrorCode.PLAN_REQUIRED, 'Member has not chosen a plan; pass planCode');

      const now = new Date();
      const expiresAt = addMonths(now, plan.durationMonths);
      await tx.subscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          startsAt: now,
          expiresAt,
          activatedById: input.adminId,
          payment: { create: { reference: input.paymentReference, amountCents: input.amountCents } },
        },
      });
      const activated = await tx.user.update({
        where: { id: user.id },
        data: { status: 'ACTIVE', planId: plan.id, activatedAt: now, expiresAt, expiryAlertSentAt: null },
        include: { plan: true },
      });
      return { user: activated, alreadyActive: false };
    }).catch((err: unknown) => {
      if (isUniqueViolation(err, 'reference')) {
        throw AppError.conflict(ErrorCode.PAYMENT_REFERENCE_USED, 'This payment reference has already been used');
      }
      throw err;
    });

    if (!result.alreadyActive) {
      await this.audit.record({
        action: 'member.activated',
        actorType: 'admin',
        actorId: input.adminId,
        subjectType: 'user',
        subjectId: input.memberId,
        requestId: input.requestId,
        data: {
          planCode: result.user.plan?.code ?? null,
          amountCents: input.amountCents,
          paymentReference: input.paymentReference,
          expiresAt: result.user.expiresAt?.toISOString() ?? null,
        },
      });
    }
    return { member: MemberDto.from(result.user), alreadyActive: result.alreadyActive };
  }
}

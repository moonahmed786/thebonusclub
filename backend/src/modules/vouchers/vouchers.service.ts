import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import { Prisma } from '../../generated/prisma/client';
import { AuditService } from '../../shared/audit/audit.service';
import { formatCode, generateCode, hashCode } from '../../shared/crypto/codes';
import { isUniqueViolation } from '../../shared/db/prisma-errors';
import { PrismaService } from '../../shared/db/prisma.service';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCode } from '../../shared/errors/error-codes';
import { membershipState } from '../../shared/membership-status';
import { NotificationsService } from '../notifications/notifications.service';
import { isOfferLive } from '../offers/offer-rules';
import { ClaimedVoucherDto, RedemptionResultDto, VoucherDto, VoucherListDto, VoucherStatusValue } from './dto/voucher.dto';

const VOUCHER_CODE_LENGTH = 12;
const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRE_BATCH_SIZE = 500;

@Injectable()
export class VouchersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  /**
   * Claims a voucher. Checks and insert run in one transaction with the member row locked,
   * so parallel claims cannot exceed the per-offer limit.
   */
  async claim(userId: string, offerId: string, requestId?: string): Promise<ClaimedVoucherDto> {
    let attempt = 0;
    for (;;) {
      attempt += 1;
      try {
        return await this.claimOnce(userId, offerId, requestId);
      } catch (err) {
        // A code collision (~1 in 2^60) is retried with a new code.
        if (attempt < 3 && isUniqueViolation(err, 'code_hash')) continue;
        throw err;
      }
    }
  }

  private async claimOnce(userId: string, offerId: string, requestId?: string): Promise<ClaimedVoucherDto> {
    const code = generateCode(VOUCHER_CODE_LENGTH);
    const now = new Date();

    const voucher = await this.prisma.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (membershipState(user, now) !== 'active') {
        throw AppError.forbidden(ErrorCode.MEMBERSHIP_INACTIVE, 'Membership is not active');
      }

      const offer = await tx.offer.findUnique({ where: { id: offerId }, include: { partner: true } });
      if (!offer) throw AppError.notFound(ErrorCode.OFFER_NOT_FOUND, 'Offer not found');
      if (!isOfferLive(offer, now)) {
        throw AppError.unprocessable(ErrorCode.OFFER_NOT_AVAILABLE, 'This offer is not available right now');
      }

      const open = await tx.voucher.count({
        where: { userId, offerId, status: 'CLAIMED', expiresAt: { gt: now } },
      });
      if (open >= this.config.voucherClaimLimitPerOffer) {
        throw AppError.unprocessable(
          ErrorCode.VOUCHER_CLAIM_LIMIT_REACHED,
          'You already have an unused voucher for this offer',
        );
      }

      const validityDays = offer.voucherValidityDays ?? this.config.voucherDefaultValidityDays;
      let expiresAt = new Date(now.getTime() + validityDays * DAY_MS);
      if (offer.endsAt && offer.endsAt < expiresAt) expiresAt = offer.endsAt;

      return tx.voucher.create({
        data: {
          userId,
          offerId,
          partnerId: offer.partnerId,
          codeHash: hashCode(code),
          codeLast4: code.slice(-4),
          claimedAt: now,
          expiresAt,
        },
        include: { offer: true, partner: true },
      });
    });

    await this.audit.record({
      action: 'voucher.claimed',
      actorType: 'member',
      actorId: userId,
      subjectType: 'voucher',
      subjectId: voucher.id,
      requestId,
      data: { offerId, partnerId: voucher.partnerId, codeLast4: voucher.codeLast4 },
    });
    await this.notifications.sendToUser(userId, {
      kind: 'voucher_claimed',
      title: 'Voucher ready',
      body: `Your voucher for ${voucher.partner.name} is ready to use.`,
      data: { voucherId: voucher.id },
    });

    return { ...VoucherDto.from(voucher, now), code: formatCode(code) };
  }

  async listForMember(userId: string, status: VoucherStatusValue | undefined, page: number, pageSize: number): Promise<VoucherListDto> {
    const now = new Date();
    let where: Prisma.VoucherWhereInput = { userId };
    if (status === 'claimed') where = { userId, status: 'CLAIMED', expiresAt: { gt: now } };
    if (status === 'redeemed') where = { userId, status: 'REDEEMED' };
    if (status === 'expired') where = { userId, OR: [{ status: 'EXPIRED' }, { status: 'CLAIMED', expiresAt: { lte: now } }] };

    const [total, vouchers] = await this.prisma.client.$transaction([
      this.prisma.client.voucher.count({ where }),
      this.prisma.client.voucher.findMany({
        where,
        orderBy: { claimedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { offer: true, partner: true },
      }),
    ]);
    return { items: vouchers.map((v) => VoucherDto.from(v, now)), page, pageSize, total };
  }

  async getForMember(userId: string, voucherId: string): Promise<VoucherDto> {
    const voucher = await this.prisma.client.voucher.findFirst({
      where: { id: voucherId, userId },
      include: { offer: true, partner: true },
    });
    if (!voucher) throw AppError.notFound(ErrorCode.VOUCHER_NOT_FOUND, 'Voucher not found');
    return VoucherDto.from(voucher);
  }

  /**
   * Partner POS redemption. The status change is a single conditional UPDATE, so two
   * cashiers (or two taps) can never both succeed. Always checks Postgres, never a cache.
   */
  async redeem(partnerId: string, code: string, amountCents: number | undefined, requestId?: string): Promise<RedemptionResultDto> {
    const now = new Date();
    const voucher = await this.prisma.client.voucher.findUnique({
      where: { codeHash: hashCode(code) },
      include: { offer: true, user: { select: { memberId: true } } },
    });
    // A voucher for another partner is reported as not found, so codes cannot be probed.
    if (!voucher || voucher.partnerId !== partnerId) {
      throw AppError.notFound(ErrorCode.VOUCHER_NOT_FOUND, 'Voucher not found');
    }

    const updated = await this.prisma.client.voucher.updateMany({
      where: { id: voucher.id, status: 'CLAIMED', expiresAt: { gt: now } },
      data: { status: 'REDEEMED', redeemedAt: now, redemptionAmountCents: amountCents ?? null },
    });

    if (updated.count === 0) {
      const current = await this.prisma.client.voucher.findUniqueOrThrow({ where: { id: voucher.id } });
      if (current.status === 'REDEEMED') {
        throw AppError.conflict(ErrorCode.VOUCHER_ALREADY_REDEEMED, 'This voucher has already been used');
      }
      throw AppError.conflict(ErrorCode.VOUCHER_EXPIRED, 'This voucher has expired');
    }

    await this.audit.record({
      action: 'voucher.redeemed',
      actorType: 'partner',
      actorId: partnerId,
      subjectType: 'voucher',
      subjectId: voucher.id,
      requestId,
      data: { userId: voucher.userId, offerId: voucher.offerId, amountCents: amountCents ?? null },
    });
    await this.notifications.sendToUser(voucher.userId, {
      kind: 'voucher_redeemed',
      title: 'Voucher used',
      body: `Your voucher for ${voucher.offer.title} was redeemed.`,
      data: { voucherId: voucher.id },
    });

    return {
      voucherId: voucher.id,
      offerTitle: voucher.offer.title,
      memberId: voucher.user.memberId,
      redeemedAt: now.toISOString(),
    };
  }

  /** Cron: moves claimed vouchers past expiry to EXPIRED. Safe to run twice (conditional update). */
  async expireDue(): Promise<{ expired: number }> {
    const rows = await this.prisma.client.$queryRaw<Array<{ id: string; user_id: string }>>`
      UPDATE vouchers SET status = 'EXPIRED', expired_at = now()
      WHERE id IN (
        SELECT id FROM vouchers
        WHERE status = 'CLAIMED' AND expires_at <= now()
        ORDER BY expires_at
        LIMIT ${EXPIRE_BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      ) AND status = 'CLAIMED'
      RETURNING id, user_id`;

    await this.audit.recordMany(
      rows.map((r) => ({
        action: 'voucher.expired' as const,
        actorType: 'system' as const,
        actorId: null,
        subjectType: 'voucher' as const,
        subjectId: r.id,
        data: { userId: r.user_id },
      })),
    );
    return { expired: rows.length };
  }
}

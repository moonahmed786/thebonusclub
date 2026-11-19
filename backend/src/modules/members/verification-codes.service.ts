import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import { AuditService } from '../../shared/audit/audit.service';
import { formatCode, generateCode, hashCode } from '../../shared/crypto/codes';
import { PrismaService } from '../../shared/db/prisma.service';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCode } from '../../shared/errors/error-codes';
import { membershipState } from '../../shared/membership-status';
import { VerificationCodeDto, VerificationResultDto } from './dto/profile.dto';

const VERIFICATION_CODE_LENGTH = 8;

@Injectable()
export class VerificationCodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async issue(userId: string): Promise<VerificationCodeDto> {
    const user = await this.prisma.client.user.findUniqueOrThrow({ where: { id: userId } });
    if (membershipState(user) !== 'active') {
      throw AppError.forbidden(ErrorCode.MEMBERSHIP_INACTIVE, 'Membership is not active');
    }
    const code = generateCode(VERIFICATION_CODE_LENGTH);
    const expiresAt = new Date(Date.now() + this.config.verificationCodeTtlSeconds * 1000);
    await this.prisma.client.verificationCode.create({
      data: { userId, codeHash: hashCode(code), expiresAt },
    });
    return { code: formatCode(code), expiresAt: expiresAt.toISOString() };
  }

  /** Cashier check. Atomically consumes the code so it can never be used twice. */
  async verify(code: string, partnerId: string, requestId?: string): Promise<VerificationResultDto> {
    const now = new Date();
    const codeHash = hashCode(code);
    const consumed = await this.prisma.client.verificationCode.updateMany({
      where: { codeHash, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now, usedByPartnerId: partnerId },
    });
    if (consumed.count === 0) {
      throw AppError.notFound(ErrorCode.VERIFICATION_CODE_INVALID, 'Code is invalid, expired, or already used');
    }
    const record = await this.prisma.client.verificationCode.findUniqueOrThrow({
      where: { codeHash },
      include: { user: true },
    });
    await this.audit.record({
      action: 'verification_code.used',
      actorType: 'partner',
      actorId: partnerId,
      subjectType: 'verification_code',
      subjectId: record.id,
      requestId,
      data: { userId: record.userId },
    });
    return {
      memberId: record.user.memberId,
      membershipStatus: membershipState(record.user, now),
      expiresAt: record.user.expiresAt?.toISOString() ?? null,
    };
  }
}

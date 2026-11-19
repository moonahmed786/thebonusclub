import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { sha256 } from '../crypto/codes';
import { PrismaService } from '../db/prisma.service';
import { AppError } from '../errors/app-error';
import { ErrorCode } from '../errors/error-codes';

export const PARTNER_API_KEY_HEADER = 'x-partner-key';

/** Authenticates a partner's cashier/POS by its revocable API key (stored as a SHA-256 hash). */
@Injectable()
export class PartnerApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const key = req.header(PARTNER_API_KEY_HEADER);
    if (!key) throw AppError.unauthenticated(ErrorCode.INVALID_API_KEY, 'Partner API key required');

    const partner = await this.prisma.client.partner.findUnique({
      where: { apiKeyHash: sha256(key) },
      select: { id: true, name: true, isActive: true },
    });
    if (!partner || !partner.isActive) {
      throw AppError.unauthenticated(ErrorCode.INVALID_API_KEY, 'Partner API key is invalid');
    }
    req.partner = { id: partner.id, name: partner.name };
    return true;
  }
}

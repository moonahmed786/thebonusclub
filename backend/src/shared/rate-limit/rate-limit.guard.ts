import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import { PrismaService } from '../db/prisma.service';
import { AppError } from '../errors/app-error';
import { ErrorCode } from '../errors/error-codes';

export type RateLimitBucket = keyof Omit<AppConfig['rateLimit'], 'windowSeconds'>;

const RATE_LIMIT_KEY = 'rateLimitBucket';

/** Apply with `@UseGuards(RateLimitGuard)`. Must be listed after any auth guard so the user is known. */
export const RateLimit = (bucket: RateLimitBucket) => SetMetadata(RATE_LIMIT_KEY, bucket);

/** Fixed-window limiter in Postgres, keyed by user, partner, or client IP. Fails closed. */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const bucket = this.reflector.get<RateLimitBucket | undefined>(RATE_LIMIT_KEY, context.getHandler());
    if (!bucket) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const identity = req.auth?.userId ?? req.partner?.id ?? req.ip ?? 'unknown';
    const windowSeconds = this.config.rateLimit.windowSeconds;
    const window = Math.floor(Date.now() / 1000 / windowSeconds);
    const key = `rl:${bucket}:${identity}:${window}`;
    const expiresAt = new Date((window + 1) * windowSeconds * 1000);

    let count: number;
    try {
      // One atomic statement, so parallel requests cannot both read the same count.
      const rows = await this.prisma.client.$queryRaw<{ count: number }[]>`
        INSERT INTO "rate_limit_counters" ("key", "count", "expires_at")
        VALUES (${key}, 1, ${expiresAt})
        ON CONFLICT ("key") DO UPDATE SET "count" = "rate_limit_counters"."count" + 1
        RETURNING "count"`;
      count = Number(rows[0]?.count ?? 0);
    } catch {
      throw new AppError(HttpStatus.SERVICE_UNAVAILABLE, ErrorCode.SERVICE_UNAVAILABLE, 'Service temporarily unavailable');
    }

    if (count > this.config.rateLimit[bucket]) {
      throw new AppError(HttpStatus.TOO_MANY_REQUESTS, ErrorCode.RATE_LIMITED, 'Too many requests, try again shortly');
    }
    return true;
  }
}

/** Deletes counters whose window has closed. Called by the daily cron. */
export async function purgeExpiredRateLimits(prisma: PrismaService, now = new Date()): Promise<number> {
  const { count } = await prisma.client.rateLimitCounter.deleteMany({ where: { expiresAt: { lte: now } } });
  return count;
}

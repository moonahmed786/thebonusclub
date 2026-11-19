import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import { RedisService } from '../cache/redis.service';
import { AppError } from '../errors/app-error';
import { ErrorCode } from '../errors/error-codes';

export type RateLimitBucket = keyof Omit<AppConfig['rateLimit'], 'windowSeconds'>;

const RATE_LIMIT_KEY = 'rateLimitBucket';

/** Apply with `@UseGuards(RateLimitGuard)`. Must be listed after any auth guard so the user is known. */
export const RateLimit = (bucket: RateLimitBucket) => SetMetadata(RATE_LIMIT_KEY, bucket);

/** Fixed-window limiter in Redis, keyed by user, partner, or client IP. Fails closed. */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
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

    let count: number;
    try {
      const results = await this.redis.client.multi().incr(key).expire(key, windowSeconds).exec();
      count = Number(results?.[0]?.[1] ?? 0);
    } catch {
      throw new AppError(HttpStatus.SERVICE_UNAVAILABLE, ErrorCode.SERVICE_UNAVAILABLE, 'Service temporarily unavailable');
    }

    if (count > this.config.rateLimit[bucket]) {
      throw new AppError(HttpStatus.TOO_MANY_REQUESTS, ErrorCode.RATE_LIMITED, 'Too many requests, try again shortly');
    }
    return true;
  }
}

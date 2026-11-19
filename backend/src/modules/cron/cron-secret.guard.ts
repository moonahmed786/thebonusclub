import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import { AppError } from '../../shared/errors/app-error';

/** Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. */
@Injectable()
export class CronSecretGuard implements CanActivate {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const expected = Buffer.from(`Bearer ${this.config.cronSecret}`);
    const given = Buffer.from(req.header('authorization') ?? '');
    if (!this.config.cronSecret || given.length !== expected.length || !timingSafeEqual(given, expected)) {
      throw AppError.unauthenticated();
    }
    return true;
  }
}

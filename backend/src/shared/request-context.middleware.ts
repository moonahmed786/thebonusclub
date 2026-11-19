import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { AppLogger } from './logger/app-logger';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

/** Assigns a requestId (echoed in the `x-request-id` header) and logs each request on completion. */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.header('x-request-id');
    const requestId = incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    const started = process.hrtime.bigint();
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
      this.logger.info('request', {
        requestId,
        memberId: req.auth?.userId,
        partnerId: req.partner?.id,
        method: req.method,
        route: req.route?.path ?? req.path,
        status: res.statusCode,
        durationMs: Math.round(durationMs),
      });
    });
    next();
  }
}

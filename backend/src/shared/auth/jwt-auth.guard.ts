import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AppError } from '../errors/app-error';
import { ErrorCode } from '../errors/error-codes';
import { SessionStore } from './session.store';

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  role: 'MEMBER' | 'ADMIN';
}

// @Injectable() here makes TypeScript emit the constructor's parameter types; the subclasses have no
// constructor of their own, so without it Nest injects nothing and every request is rejected with 401.
@Injectable()
abstract class BaseJwtGuard implements CanActivate {
  protected abstract readonly requiredRole: 'MEMBER' | 'ADMIN';

  constructor(
    private readonly jwt: JwtService,
    private readonly sessions: SessionStore,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.header('authorization') ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw AppError.unauthenticated();

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw AppError.unauthenticated(ErrorCode.UNAUTHENTICATED, 'Access token is invalid or expired');
    }

    let alive: boolean;
    try {
      alive = await this.sessions.exists(payload.sid);
    } catch {
      // Fail closed: if we cannot confirm the session, deny.
      throw new AppError(HttpStatus.SERVICE_UNAVAILABLE, ErrorCode.SERVICE_UNAVAILABLE, 'Authentication is temporarily unavailable');
    }
    if (!alive) throw AppError.unauthenticated(ErrorCode.UNAUTHENTICATED, 'Session has ended');

    if (payload.role !== this.requiredRole) throw AppError.forbidden();

    req.auth = { userId: payload.sub, sessionId: payload.sid, role: payload.role };
    return true;
  }
}

/** Member endpoints. Admin tokens are rejected. */
@Injectable()
export class MemberAuthGuard extends BaseJwtGuard {
  protected readonly requiredRole = 'MEMBER' as const;
}

/** Admin endpoints. Member tokens are rejected with 403. */
@Injectable()
export class AdminAuthGuard extends BaseJwtGuard {
  protected readonly requiredRole = 'ADMIN' as const;
}

/** Any signed-in user (member or admin), e.g. logout. */
@Injectable()
export class AnyUserAuthGuard implements CanActivate {
  constructor(
    private readonly member: MemberAuthGuard,
    private readonly admin: AdminAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await this.member.canActivate(context);
    } catch (err) {
      if (err instanceof AppError && err.status === HttpStatus.FORBIDDEN) {
        return this.admin.canActivate(context);
      }
      throw err;
    }
  }
}

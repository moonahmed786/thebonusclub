import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthContext {
  userId: string;
  sessionId: string;
  role: 'MEMBER' | 'ADMIN';
}

export interface PartnerContext {
  id: string;
  name: string;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthContext => {
  const req = ctx.switchToHttp().getRequest<Request>();
  if (!req.auth) throw new Error('CurrentUser used on a route without an auth guard');
  return req.auth;
});

export const CurrentPartner = createParamDecorator((_data: unknown, ctx: ExecutionContext): PartnerContext => {
  const req = ctx.switchToHttp().getRequest<Request>();
  if (!req.partner) throw new Error('CurrentPartner used on a route without PartnerApiKeyGuard');
  return req.partner;
});

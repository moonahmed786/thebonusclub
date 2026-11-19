import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import { AuditService } from '../../shared/audit/audit.service';
import { AccessTokenPayload } from '../../shared/auth/jwt-auth.guard';
import { SessionStore } from '../../shared/auth/session.store';
import { randomToken, safeEqualHex, sha256 } from '../../shared/crypto/codes';
import { isUniqueViolation } from '../../shared/db/prisma-errors';
import { PrismaService } from '../../shared/db/prisma.service';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCode } from '../../shared/errors/error-codes';
import { MemberDto } from '../members/dto/member.dto';
import { AuthResponseDto, LoginDto, RegisterDto, TokensDto } from './dto/auth.dto';

const BCRYPT_COST = 12;
// Compared against when the email is unknown so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_COST);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly sessions: SessionStore,
    private readonly audit: AuditService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async register(dto: RegisterDto, requestId?: string): Promise<AuthResponseDto> {
    let planId: string | undefined;
    if (dto.planCode) {
      const plan = await this.prisma.client.plan.findFirst({ where: { code: dto.planCode, isActive: true } });
      if (!plan) throw AppError.unprocessable(ErrorCode.PLAN_NOT_FOUND, 'Unknown membership plan');
      planId = plan.id;
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
    let user;
    try {
      user = await this.prisma.client.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          address: dto.address,
          birthday: dto.birthday ? new Date(`${dto.birthday}T00:00:00Z`) : undefined,
          planId,
        },
        include: { plan: true },
      });
    } catch (err) {
      if (isUniqueViolation(err, 'email')) {
        throw AppError.conflict(ErrorCode.EMAIL_TAKEN, 'An account with this email already exists');
      }
      throw err;
    }

    await this.audit.record({
      action: 'member.registered',
      actorType: 'member',
      actorId: user.id,
      subjectType: 'user',
      subjectId: user.id,
      requestId,
    });

    const tokens = await this.startSession(user.id, 'MEMBER');
    return { tokens, member: MemberDto.from(user) };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.client.user.findUnique({ where: { email: dto.email }, include: { plan: true } });
    const ok = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) {
      throw AppError.unauthenticated(ErrorCode.INVALID_CREDENTIALS, 'Email or password is incorrect');
    }
    const tokens = await this.startSession(user.id, user.role);
    return { tokens, member: MemberDto.from(user) };
  }

  async refresh(refreshToken: string): Promise<TokensDto> {
    const [sessionId, secret] = refreshToken.split('.');
    const invalid = () => AppError.unauthenticated(ErrorCode.INVALID_REFRESH_TOKEN, 'Refresh token is invalid');
    if (!sessionId || !secret) throw invalid();

    const session = await this.sessions.get(sessionId);
    if (!session) throw invalid();

    if (!safeEqualHex(sha256(secret), session.refreshHash)) {
      // A rotated-out token was replayed: treat the session as stolen and end it.
      await this.sessions.revoke(sessionId, session.userId);
      throw invalid();
    }

    const newSecret = randomToken();
    await this.sessions.save(sessionId, { ...session, refreshHash: sha256(newSecret) });
    return this.buildTokens(session.userId, sessionId, session.role, newSecret);
  }

  async logout(sessionId: string, userId: string): Promise<void> {
    await this.sessions.revoke(sessionId, userId);
  }

  private async startSession(userId: string, role: 'MEMBER' | 'ADMIN'): Promise<TokensDto> {
    const sessionId = randomUUID();
    const secret = randomToken();
    await this.sessions.save(sessionId, { userId, role, refreshHash: sha256(secret) });
    return this.buildTokens(userId, sessionId, role, secret);
  }

  private async buildTokens(userId: string, sessionId: string, role: 'MEMBER' | 'ADMIN', secret: string): Promise<TokensDto> {
    const payload: AccessTokenPayload = { sub: userId, sid: sessionId, role };
    const accessToken = await this.jwt.signAsync(payload);
    return {
      accessToken,
      refreshToken: `${sessionId}.${secret}`,
      expiresIn: this.config.accessTokenTtlSeconds,
      role,
    };
  }
}

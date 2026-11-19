import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_CONFIG, AppConfig, loadConfig } from '../config/app-config';
import { AuditService } from './audit/audit.service';
import { AdminAuthGuard, AnyUserAuthGuard, MemberAuthGuard } from './auth/jwt-auth.guard';
import { PartnerApiKeyGuard } from './auth/partner-api-key.guard';
import { SessionStore } from './auth/session.store';
import { RedisService } from './cache/redis.service';
import { MongoService } from './db/mongo.service';
import { PrismaService } from './db/prisma.service';
import { AppLogger } from './logger/app-logger';
import { RateLimitGuard } from './rate-limit/rate-limit.guard';

const config = loadConfig();

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: config.jwtSecret,
      signOptions: { expiresIn: config.accessTokenTtlSeconds, algorithm: 'HS256' },
      verifyOptions: { algorithms: ['HS256'] },
    }),
  ],
  providers: [
    { provide: APP_CONFIG, useValue: config satisfies AppConfig },
    AppLogger,
    PrismaService,
    MongoService,
    RedisService,
    AuditService,
    SessionStore,
    MemberAuthGuard,
    AdminAuthGuard,
    AnyUserAuthGuard,
    PartnerApiKeyGuard,
    RateLimitGuard,
  ],
  exports: [
    APP_CONFIG,
    JwtModule,
    AppLogger,
    PrismaService,
    MongoService,
    RedisService,
    AuditService,
    SessionStore,
    MemberAuthGuard,
    AdminAuthGuard,
    AnyUserAuthGuard,
    PartnerApiKeyGuard,
    RateLimitGuard,
  ],
})
export class SharedModule {}

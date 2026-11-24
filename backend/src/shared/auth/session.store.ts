import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import { PrismaService } from '../db/prisma.service';

export interface SessionRecord {
  userId: string;
  role: 'MEMBER' | 'ADMIN';
  refreshHash: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Server-side sessions in Postgres. Refresh tokens are stored hashed and are revocable. */
@Injectable()
export class SessionStore {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async create(sessionId: string, record: SessionRecord): Promise<void> {
    await this.prisma.client.session.create({
      data: { id: sessionId, ...record, expiresAt: this.newExpiry() },
    });
  }

  async get(sessionId: string): Promise<SessionRecord | null> {
    // Session IDs come from client-supplied refresh tokens; a non-UUID would make Postgres throw.
    if (!UUID_RE.test(sessionId)) return null;
    const row = await this.prisma.client.session.findFirst({
      where: { id: sessionId, expiresAt: { gt: new Date() } },
      select: { userId: true, role: true, refreshHash: true },
    });
    return row;
  }

  /** Throws if Postgres is unreachable, so callers fail closed. */
  async exists(sessionId: string): Promise<boolean> {
    const count = await this.prisma.client.session.count({ where: { id: sessionId, expiresAt: { gt: new Date() } } });
    return count === 1;
  }

  /**
   * Swaps the refresh hash only if it still matches the one presented, and extends the session.
   * Returns false when another request rotated it first, so a token can be used exactly once.
   */
  async rotate(sessionId: string, currentHash: string, nextHash: string): Promise<boolean> {
    const { count } = await this.prisma.client.session.updateMany({
      where: { id: sessionId, refreshHash: currentHash, expiresAt: { gt: new Date() } },
      data: { refreshHash: nextHash, expiresAt: this.newExpiry() },
    });
    return count === 1;
  }

  async revoke(sessionId: string, userId: string): Promise<void> {
    await this.prisma.client.session.deleteMany({ where: { id: sessionId, userId } });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.client.session.deleteMany({ where: { userId } });
  }

  /** Deletes expired sessions. Called by the daily cron. */
  async purgeExpired(now = new Date()): Promise<number> {
    const { count } = await this.prisma.client.session.deleteMany({ where: { expiresAt: { lte: now } } });
    return count;
  }

  private newExpiry(): Date {
    return new Date(Date.now() + this.config.refreshTokenTtlSeconds * 1000);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import { RedisService } from '../cache/redis.service';

export interface SessionRecord {
  userId: string;
  role: 'MEMBER' | 'ADMIN';
  refreshHash: string;
}

const sessionKey = (sessionId: string) => `sess:${sessionId}`;
const userSessionsKey = (userId: string) => `user-sess:${userId}`;

/** Server-side sessions in Redis. Refresh tokens are stored hashed and are revocable. */
@Injectable()
export class SessionStore {
  constructor(
    private readonly redis: RedisService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async save(sessionId: string, record: SessionRecord): Promise<void> {
    const ttl = this.config.refreshTokenTtlSeconds;
    await this.redis.client
      .multi()
      .set(sessionKey(sessionId), JSON.stringify(record), 'EX', ttl)
      .sadd(userSessionsKey(record.userId), sessionId)
      .expire(userSessionsKey(record.userId), ttl)
      .exec();
  }

  async get(sessionId: string): Promise<SessionRecord | null> {
    const raw = await this.redis.client.get(sessionKey(sessionId));
    return raw ? (JSON.parse(raw) as SessionRecord) : null;
  }

  /** Throws if Redis is unreachable, so callers fail closed. */
  async exists(sessionId: string): Promise<boolean> {
    return (await this.redis.client.exists(sessionKey(sessionId))) === 1;
  }

  async revoke(sessionId: string, userId: string): Promise<void> {
    await this.redis.client.multi().del(sessionKey(sessionId)).srem(userSessionsKey(userId), sessionId).exec();
  }

  async revokeAllForUser(userId: string): Promise<void> {
    const ids = await this.redis.client.smembers(userSessionsKey(userId));
    const pipeline = this.redis.client.multi();
    for (const id of ids) pipeline.del(sessionKey(id));
    pipeline.del(userSessionsKey(userId));
    await pipeline.exec();
  }
}

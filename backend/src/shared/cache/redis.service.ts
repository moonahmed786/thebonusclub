import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import { AppLogger } from '../logger/app-logger';

// Upstash Redis over TCP (rediss://) in production. Cached across warm invocations.
// Everything stored here must be rebuildable from Postgres; losing it only signs users out.
const globalForRedis = globalThis as unknown as { bonusClubRedis?: Redis };

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor(@Inject(APP_CONFIG) config: AppConfig, logger: AppLogger) {
    if (!globalForRedis.bonusClubRedis) {
      const client = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
        lazyConnect: false,
      });
      // Without a listener ioredis reports "Unhandled error event"; commands still fail (auth fails closed).
      client.on('error', (err: Error) => logger.error('redis connection error', { err: err.message }));
      globalForRedis.bonusClubRedis = client;
    }
    this.client = globalForRedis.bonusClubRedis;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
    globalForRedis.bonusClubRedis = undefined;
  }
}

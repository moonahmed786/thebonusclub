import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import { APP_CONFIG, AppConfig } from '../../config/app-config';

// Singleton client reused across warm serverless invocations (connects lazily on first use).
const globalForMongo = globalThis as unknown as { bonusClubMongo?: MongoClient };

@Injectable()
export class MongoService implements OnModuleDestroy {
  private readonly client: MongoClient;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    if (!globalForMongo.bonusClubMongo) {
      globalForMongo.bonusClubMongo = new MongoClient(config.mongoUri, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 3000,
      });
    }
    this.client = globalForMongo.bonusClubMongo;
  }

  db(): Db {
    return this.client.db(this.config.mongoDb);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
    globalForMongo.bonusClubMongo = undefined;
  }
}

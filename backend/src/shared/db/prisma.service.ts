import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { APP_CONFIG, AppConfig } from '../../config/app-config';

// Cached across warm serverless invocations so each instance holds one small pool.
// DATABASE_URL must point at the pooler (Neon pooler / Supabase PgBouncer) in production.
const globalForPrisma = globalThis as unknown as { bonusClubPrisma?: PrismaClient };

@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly client: PrismaClient;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    if (!globalForPrisma.bonusClubPrisma) {
      const adapter = new PrismaPg({ connectionString: config.databaseUrl, max: 5 });
      globalForPrisma.bonusClubPrisma = new PrismaClient({ adapter });
    }
    this.client = globalForPrisma.bonusClubPrisma;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
    globalForPrisma.bonusClubPrisma = undefined;
  }
}

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';

// Idempotent: safe to run more than once.
const CATEGORIES = [
  { slug: 'fuel', name: 'Fuel', sortOrder: 1 },
  { slug: 'groceries', name: 'Groceries', sortOrder: 2 },
  { slug: 'dining', name: 'Dining', sortOrder: 3 },
  { slug: 'car-rentals', name: 'Car Rentals', sortOrder: 4 },
  { slug: 'services', name: 'Services', sortOrder: 5 },
];

async function main(): Promise<void> {
  const connectionString = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    // Prices from the PRD: Annual $99. Monthly: $20 registration + monthly fee (fee not in PRD).
    await prisma.plan.upsert({
      where: { code: 'ANNUAL' },
      create: { code: 'ANNUAL', name: 'Annual membership', priceCents: 9900, registrationFeeCents: 0, durationMonths: 12 },
      update: {},
    });

    const monthlyPriceRaw = process.env.SEED_MONTHLY_PLAN_PRICE_CENTS?.trim();
    const monthlyPrice = monthlyPriceRaw ? Number(monthlyPriceRaw) : undefined;
    if (monthlyPrice !== undefined && (!Number.isInteger(monthlyPrice) || monthlyPrice <= 0)) {
      throw new Error('SEED_MONTHLY_PLAN_PRICE_CENTS must be a whole number of cents, e.g. 999 for $9.99');
    }
    if (monthlyPrice !== undefined) {
      await prisma.plan.upsert({
        where: { code: 'MONTHLY' },
        create: {
          code: 'MONTHLY',
          name: 'Monthly membership',
          priceCents: monthlyPrice,
          registrationFeeCents: 2000,
          durationMonths: 1,
        },
        update: {},
      });
    } else {
      process.stdout.write('SEED_MONTHLY_PLAN_PRICE_CENTS not set: skipping MONTHLY plan\n');
    }

    for (const c of CATEGORIES) {
      await prisma.category.upsert({ where: { slug: c.slug }, create: c, update: { name: c.name, sortOrder: c.sortOrder } });
    }

    const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      if (adminPassword.length < 12) throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters');
      await prisma.user.upsert({
        where: { email: adminEmail },
        create: { email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 12), role: 'ADMIN', status: 'ACTIVE' },
        update: {},
      });
      process.stdout.write('Admin user ensured\n');
    }
    process.stdout.write('Seed complete\n');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});

// Vercel build entry (vercel.json buildCommand).
// Production builds apply pending Prisma migrations, then the idempotent Mongo setup and
// seed, before building, so new code never goes live against an old schema.
// Preview builds never touch the databases.
import { execSync } from 'node:child_process';

const run = (cmd) => execSync(cmd, { stdio: 'inherit', env: process.env });

if (process.env.VERCEL_ENV === 'production') {
  if (!process.env.DIRECT_DATABASE_URL) {
    throw new Error('DIRECT_DATABASE_URL (Supabase session pooler, port 5432) is required to migrate');
  }
  process.stdout.write('Production build: applying pending migrations\n');
  run('npx prisma migrate deploy');
  process.stdout.write('Production build: Mongo collections and seed data\n');
  run('npx tsx scripts/mongo-setup.ts');
  run('npx tsx prisma/seed.ts');
} else {
  process.stdout.write(`Skipping migrations (VERCEL_ENV=${process.env.VERCEL_ENV ?? 'unset'})\n`);
}

run('npm run build');

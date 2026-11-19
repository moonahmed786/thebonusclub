import { execSync } from 'node:child_process';
import { config } from 'dotenv';
import { resolve } from 'node:path';

/** Applies migrations to the test database before the e2e run. */
export default function globalSetup(): void {
  config({ path: resolve(__dirname, '..', '.env.test'), override: true });
  const url = process.env.DATABASE_URL ?? '';
  if (!/\/[a-z0-9_]+_test(\?|$)/.test(url)) {
    throw new Error('e2e tests only run against a database whose name ends in _test');
  }
  execSync('npx prisma migrate deploy', { cwd: resolve(__dirname, '..'), stdio: 'inherit', env: process.env });
}

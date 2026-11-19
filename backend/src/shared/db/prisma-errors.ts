import { Prisma } from '../../generated/prisma/client';

export function isUniqueViolation(err: unknown, field?: string): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== 'P2002') return false;
  if (!field) return true;
  return JSON.stringify(err.meta ?? {}).includes(field);
}

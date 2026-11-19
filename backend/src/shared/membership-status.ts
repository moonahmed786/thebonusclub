export type MembershipState = 'active' | 'inactive' | 'expired';

export interface MembershipFields {
  status: 'INACTIVE' | 'ACTIVE';
  expiresAt: Date | null;
}

/** The single rule for whether a member counts as active right now. */
export function membershipState(user: MembershipFields, now: Date = new Date()): MembershipState {
  if (user.status !== 'ACTIVE') return 'inactive';
  if (!user.expiresAt || user.expiresAt.getTime() <= now.getTime()) return 'expired';
  return 'active';
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

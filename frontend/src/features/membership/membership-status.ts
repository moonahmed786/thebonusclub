import type { BadgeTone } from '../../shared/components/StatusBadge';
import type { MembershipStatus } from '../../shared/api/types';

/** Badge text, tone, and icon for the server's membership status. Never guessed locally. */
export function membershipBadge(status: MembershipStatus): { label: string; tone: BadgeTone; icon: string } {
  switch (status) {
    case 'active':
      return { label: 'Active', tone: 'success', icon: '✓' };
    case 'expired':
      return { label: 'Expired', tone: 'danger', icon: '!' };
    case 'inactive':
      return { label: 'Inactive', tone: 'warning', icon: '○' };
  }
}

import type { BadgeTone } from '../../shared/components/StatusBadge';
import type { VoucherStatus } from '../../shared/api/types';

/** Labels use the server's status values exactly: Claimed, Redeemed, Expired. */
export function voucherBadge(status: VoucherStatus): { label: string; tone: BadgeTone; icon: string } {
  switch (status) {
    case 'claimed':
      return { label: 'Claimed', tone: 'success', icon: '●' };
    case 'redeemed':
      return { label: 'Redeemed', tone: 'muted', icon: '✓' };
    case 'expired':
      return { label: 'Expired', tone: 'danger', icon: '✕' };
  }
}

/** Only a claimed voucher's code can be shown as usable or copied. */
export function isCodeUsable(status: VoucherStatus): boolean {
  return status === 'claimed';
}

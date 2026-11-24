import type { BadgeTone } from '../../shared/components/StatusBadge';
import type { Voucher, VoucherStatus } from '../../shared/api/types';

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

/** Claimed vouchers first ("Ready to use"), then redeemed and expired ones ("Past"). Empty groups are left out. */
export function groupVouchers<T extends Pick<Voucher, 'status'>>(items: T[]): { title: string; data: T[] }[] {
  const ready = items.filter((v) => isCodeUsable(v.status));
  const past = items.filter((v) => !isCodeUsable(v.status));
  return [
    ...(ready.length ? [{ title: 'Ready to use', data: ready }] : []),
    ...(past.length ? [{ title: 'Past', data: past }] : []),
  ];
}

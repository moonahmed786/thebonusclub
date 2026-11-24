import { membershipBadge } from '../src/features/membership/membership-status';
import { targetFromData } from '../src/features/notifications/push';
import { filterPartnersByCategory } from '../src/features/partners/partner-filter';
import { groupVouchers, isCodeUsable, voucherBadge } from '../src/features/vouchers/voucher-status';
import type { PartnerSummary } from '../src/shared/api/types';

describe('status mapping', () => {
  it('maps membership status to label, icon, and tone', () => {
    expect(membershipBadge('active')).toEqual({ label: 'Active', tone: 'success', icon: '✓' });
    expect(membershipBadge('inactive').label).toBe('Inactive');
    expect(membershipBadge('expired').label).toBe('Expired');
  });

  it('uses the server voucher statuses exactly', () => {
    expect(voucherBadge('claimed').label).toBe('Claimed');
    expect(voucherBadge('redeemed').label).toBe('Redeemed');
    expect(voucherBadge('expired').label).toBe('Expired');
  });

  it('only treats claimed codes as usable', () => {
    expect(isCodeUsable('claimed')).toBe(true);
    expect(isCodeUsable('redeemed')).toBe(false);
    expect(isCodeUsable('expired')).toBe(false);
  });
});

describe('category filter', () => {
  const partner = (id: string, slug: string): PartnerSummary => ({
    id,
    name: id,
    category: { id: slug, slug, name: slug },
    logoUrl: null,
    liveOfferCount: 1,
  });
  const list = [partner('a', 'fuel'), partner('b', 'dining'), partner('c', 'fuel')];

  it('returns everything for "All"', () => {
    expect(filterPartnersByCategory(list, null)).toHaveLength(3);
  });

  it('filters by category slug', () => {
    expect(filterPartnersByCategory(list, 'fuel').map((p) => p.id)).toEqual(['a', 'c']);
    expect(filterPartnersByCategory(list, 'services')).toEqual([]);
  });
});

describe('notification deep links', () => {
  it('opens the voucher or card from the data payload', () => {
    expect(targetFromData({ kind: 'voucher_claimed', voucherId: 'v1' })).toEqual({ screen: 'voucher', voucherId: 'v1' });
    expect(targetFromData({ kind: 'membership_expiring', screen: 'card' })).toEqual({ screen: 'card' });
    expect(targetFromData({})).toBeNull();
    expect(targetFromData(undefined)).toBeNull();
  });
});

describe('groupVouchers', () => {
  it('puts claimed vouchers under "Ready to use" and the rest under "Past"', () => {
    const groups = groupVouchers([
      { id: 'a', status: 'redeemed' as const },
      { id: 'b', status: 'claimed' as const },
      { id: 'c', status: 'expired' as const },
    ]);
    expect(groups.map((g) => [g.title, g.data.map((v) => v.id)])).toEqual([
      ['Ready to use', ['b']],
      ['Past', ['a', 'c']],
    ]);
  });

  it('leaves out empty groups', () => {
    expect(groupVouchers([{ status: 'claimed' as const }]).map((g) => g.title)).toEqual(['Ready to use']);
    expect(groupVouchers([])).toEqual([]);
  });
});

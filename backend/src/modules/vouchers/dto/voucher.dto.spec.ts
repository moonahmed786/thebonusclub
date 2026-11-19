import { VoucherDto } from './voucher.dto';

describe('VoucherDto status', () => {
  const now = new Date('2026-06-15T12:00:00Z');
  const voucher = {
    id: 'v1',
    userId: 'u1',
    offerId: 'o1',
    partnerId: 'p1',
    codeHash: 'h',
    codeLast4: 'ABCD',
    status: 'CLAIMED' as const,
    claimedAt: new Date('2026-06-01T00:00:00Z'),
    expiresAt: new Date('2026-06-20T00:00:00Z'),
    redeemedAt: null,
    redemptionAmountCents: null,
    expiredAt: null,
    offer: { title: 'Offer' },
    partner: { name: 'Partner' },
  } as unknown as Parameters<typeof VoucherDto.from>[0];

  it('reports claimed vouchers as claimed before expiry', () => {
    expect(VoucherDto.from(voucher, now).status).toBe('claimed');
  });

  it('reports claimed vouchers past expiry as expired even before the cron runs', () => {
    expect(VoucherDto.from({ ...voucher, expiresAt: now }, now).status).toBe('expired');
  });

  it('never exposes the code hash', () => {
    expect(JSON.stringify(VoucherDto.from(voucher, now))).not.toContain('codeHash');
  });
});

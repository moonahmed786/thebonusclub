import { addMonths, membershipState } from './membership-status';

describe('membershipState', () => {
  const now = new Date('2026-06-15T12:00:00Z');

  it('is inactive until an admin activates', () => {
    expect(membershipState({ status: 'INACTIVE', expiresAt: null }, now)).toBe('inactive');
  });

  it('is active before expiry', () => {
    expect(membershipState({ status: 'ACTIVE', expiresAt: new Date('2026-07-01T00:00:00Z') }, now)).toBe('active');
  });

  it('is expired at or after expiry', () => {
    expect(membershipState({ status: 'ACTIVE', expiresAt: now }, now)).toBe('expired');
    expect(membershipState({ status: 'ACTIVE', expiresAt: null }, now)).toBe('expired');
  });
});

describe('addMonths', () => {
  it('adds a year', () => {
    expect(addMonths(new Date('2026-03-10T08:00:00Z'), 12).toISOString()).toBe('2027-03-10T08:00:00.000Z');
  });

  it('clamps to the end of shorter months', () => {
    expect(addMonths(new Date('2026-01-31T00:00:00Z'), 1).toISOString()).toBe('2026-02-28T00:00:00.000Z');
  });
});

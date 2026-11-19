import { isOfferLive } from './offer-rules';

describe('isOfferLive', () => {
  const now = new Date('2026-06-15T12:00:00Z');
  const base = {
    isPaused: false,
    startsAt: new Date('2026-06-01T00:00:00Z'),
    endsAt: null as Date | null,
    partner: { isActive: true },
  };

  it('is live inside its window', () => {
    expect(isOfferLive(base, now)).toBe(true);
  });

  it('is not live when paused, not started, ended, or partner inactive', () => {
    expect(isOfferLive({ ...base, isPaused: true }, now)).toBe(false);
    expect(isOfferLive({ ...base, startsAt: new Date('2026-07-01T00:00:00Z') }, now)).toBe(false);
    expect(isOfferLive({ ...base, endsAt: now }, now)).toBe(false);
    expect(isOfferLive({ ...base, partner: { isActive: false } }, now)).toBe(false);
  });
});

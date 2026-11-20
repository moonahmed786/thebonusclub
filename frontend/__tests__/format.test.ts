import { formatBirthday, formatDate, formatMoney, isValidBirthday } from '../src/shared/utils/format';

describe('format utils', () => {
  it('formats prices from cents', () => {
    expect(formatMoney(9900, 'USD', 'en-US')).toBe('$99.00');
    expect(formatMoney(2000, 'USD', 'en-US')).toBe('$20.00');
  });

  it('formats UTC dates and handles missing values', () => {
    expect(formatDate('2027-03-10T08:00:00.000Z', 'en-US')).toContain('2027');
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
  });

  it('never shifts a birthday across time zones', () => {
    expect(formatBirthday('1990-01-01', 'en-US')).toBe('January 1, 1990');
  });

  it('validates birthdays as real, past, YYYY-MM-DD dates', () => {
    const today = new Date('2026-06-01T00:00:00Z');
    expect(isValidBirthday('1990-04-12', today)).toBe(true);
    expect(isValidBirthday('1990-02-30', today)).toBe(false);
    expect(isValidBirthday('12/04/1990', today)).toBe(false);
    expect(isValidBirthday('2030-01-01', today)).toBe(false);
  });
});

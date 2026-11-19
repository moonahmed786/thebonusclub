import { CODE_ALPHABET, formatCode, generateCode, hashCode, normalizeCode } from './codes';

describe('voucher/verification codes', () => {
  it('generates codes of the requested length from the safe alphabet', () => {
    const code = generateCode(12);
    expect(code).toHaveLength(12);
    for (const ch of code) expect(CODE_ALPHABET).toContain(ch);
  });

  it('does not repeat across many draws', () => {
    const codes = new Set(Array.from({ length: 10_000 }, () => generateCode(12)));
    expect(codes.size).toBe(10_000);
  });

  it('formats in groups of four', () => {
    expect(formatCode('ABCDEFGHJKLM')).toBe('ABCD-EFGH-JKLM');
  });

  it('hashes the same regardless of case, spaces, or dashes', () => {
    expect(normalizeCode(' abcd-efgh ')).toBe('ABCDEFGH');
    expect(hashCode('abcd-efgh-jklm')).toBe(hashCode('ABCDEFGHJKLM'));
    expect(hashCode('ABCDEFGHJKLM')).not.toBe(hashCode('ABCDEFGHJKLN'));
  });
});

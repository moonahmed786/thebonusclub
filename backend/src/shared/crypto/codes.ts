import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

// No 0/O or 1/I, so codes are easy to read aloud and type at a till.
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Cryptographically secure random code from CODE_ALPHABET. Never use Math.random for codes. */
export function generateCode(length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return out;
}

/** Groups a code as XXXX-XXXX-XXXX for display. */
export function formatCode(code: string): string {
  return code.match(/.{1,4}/g)?.join('-') ?? code;
}

/** Uppercases and strips separators so "abcd-efgh" and "ABCDEFGH" hash the same. */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, '');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function hashCode(input: string): string {
  return sha256(normalizeCode(input));
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
}

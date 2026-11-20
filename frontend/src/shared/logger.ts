/* eslint-disable no-console -- this module is the single place allowed to write to the console */
type Fields = Record<string, unknown>;

// Never log these, even by accident: personal data, tokens, and voucher/verification codes.
const REDACTED = new Set([
  'email',
  'password',
  'firstName',
  'lastName',
  'name',
  'phone',
  'address',
  'birthday',
  'accessToken',
  'refreshToken',
  'token',
  'fcmToken',
  'code',
]);

export function redact(fields: Fields): Fields {
  const out: Fields = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = REDACTED.has(key) ? '[redacted]' : value;
  }
  return out;
}

export const logger = {
  info(message: string, fields: Fields = {}): void {
    if (__DEV__) console.info(message, redact(fields));
  },
  warn(message: string, fields: Fields = {}): void {
    console.warn(message, redact(fields));
  },
  error(message: string, fields: Fields = {}): void {
    console.error(message, redact(fields));
  },
};

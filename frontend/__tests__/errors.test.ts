import { ApiError, ERROR_MESSAGES, NETWORK_ERROR_MESSAGE, toApiError, userMessageFor } from '../src/shared/api/errors';

describe('error messages', () => {
  it('maps a documented code to its user message', () => {
    const err = toApiError(409, { error: { code: 'VOUCHER_ALREADY_REDEEMED', message: 'raw server text', requestId: 'r1' } });
    expect(err.code).toBe('VOUCHER_ALREADY_REDEEMED');
    expect(err.requestId).toBe('r1');
    expect(userMessageFor(err)).toBe('This voucher has already been used.');
  });

  it('never shows raw server text for unknown codes', () => {
    const err = toApiError(500, { error: { code: 'SOMETHING_NEW', message: 'stack trace here' } });
    expect(userMessageFor(err)).toBe(ERROR_MESSAGES.INTERNAL_ERROR);
    expect(userMessageFor(err)).not.toContain('stack');
  });

  it('has a message for network failures and non-API errors', () => {
    expect(userMessageFor(new ApiError(0, 'NETWORK_ERROR'))).toBe(NETWORK_ERROR_MESSAGE);
    expect(userMessageFor(new Error('boom'))).toBe(ERROR_MESSAGES.INTERNAL_ERROR);
  });

  it('has a non-empty message for every documented code', () => {
    for (const message of Object.values(ERROR_MESSAGES)) expect(message.length).toBeGreaterThan(5);
  });
});

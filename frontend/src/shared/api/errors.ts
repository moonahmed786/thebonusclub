import type { ErrorCode } from './types';

/** User-facing text for every documented error code. Raw server text is never shown. */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_FAILED: 'Some details look wrong. Please check the form and try again.',
  UNAUTHENTICATED: 'Please sign in again.',
  INVALID_CREDENTIALS: 'Email or password is incorrect.',
  INVALID_REFRESH_TOKEN: 'Your session has ended. Please sign in again.',
  INVALID_API_KEY: 'This action is not available in the app.',
  FORBIDDEN: 'You are not allowed to do that.',
  MEMBERSHIP_INACTIVE: 'Your membership is not active yet, so this is not available.',
  NOT_FOUND: 'We could not find that.',
  MEMBER_NOT_FOUND: 'We could not find your membership.',
  PARTNER_NOT_FOUND: 'This partner is no longer available.',
  OFFER_NOT_FOUND: 'This offer is no longer available.',
  VOUCHER_NOT_FOUND: 'We could not find this voucher.',
  PLAN_NOT_FOUND: 'That membership plan is not available.',
  CATEGORY_NOT_FOUND: 'That category is not available.',
  EMAIL_TAKEN: 'An account with this email already exists. Try signing in.',
  PAYMENT_REFERENCE_USED: 'This payment has already been used.',
  VOUCHER_ALREADY_REDEEMED: 'This voucher has already been used.',
  VOUCHER_EXPIRED: 'This voucher has expired.',
  VOUCHER_CLAIM_LIMIT_REACHED: 'You already have an unused voucher for this offer. Use it first.',
  OFFER_NOT_AVAILABLE: 'This offer is not available right now.',
  PLAN_REQUIRED: 'Please choose a membership plan first.',
  PLAN_CHANGE_NOT_ALLOWED: 'Your plan can no longer be changed in the app.',
  VERIFICATION_CODE_INVALID: 'This code is not valid any more. Get a new one.',
  RATE_LIMITED: 'Too many attempts. Please wait a minute and try again.',
  SERVICE_UNAVAILABLE: 'The service is busy. Please try again shortly.',
  INTERNAL_ERROR: 'Something went wrong on our side. Please try again.',
};

export const NETWORK_ERROR_MESSAGE = 'No connection. Check your internet and try again.';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode | 'NETWORK_ERROR' | 'UNKNOWN',
    readonly requestId?: string,
  ) {
    super(code);
    this.name = 'ApiError';
  }

  get userMessage(): string {
    return userMessageFor(this);
  }
}

function isKnownCode(code: unknown): code is ErrorCode {
  return typeof code === 'string' && code in ERROR_MESSAGES;
}

/** Builds an ApiError from a parsed error body (`{ error: { code, requestId } }`). */
export function toApiError(status: number, body: unknown): ApiError {
  const error = (body as { error?: { code?: unknown; requestId?: unknown } } | undefined)?.error;
  const code = isKnownCode(error?.code) ? error.code : 'UNKNOWN';
  const requestId = typeof error?.requestId === 'string' ? error.requestId : undefined;
  return new ApiError(status, code, requestId);
}

export function userMessageFor(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'NETWORK_ERROR') return NETWORK_ERROR_MESSAGE;
    if (isKnownCode(err.code)) return ERROR_MESSAGES[err.code];
  }
  return ERROR_MESSAGES.INTERNAL_ERROR;
}

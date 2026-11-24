import createClient from 'openapi-fetch';
import { config } from '../../config/env';
import { ApiError, toApiError } from './errors';
import type { paths } from './schema';
import { sessionStore } from './session';

const AUTH_PATHS = ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/refresh'];

let refreshInFlight: Promise<boolean> | null = null;

/** Exchanges the refresh token once. Concurrent 401s share the same refresh call. */
async function refreshSession(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    const session = await sessionStore.load();
    if (!session) return false;
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      if (!res.ok) {
        // Refresh failed: sign out. The UI goes to the login screen; we never loop.
        if (res.status === 401 || res.status === 400) await sessionStore.clear();
        return false;
      }
      const tokens = (await res.json()) as { accessToken: string; refreshToken: string };
      await sessionStore.set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/** Adds the bearer token and retries once after a refresh when the access token has expired. */
export async function authFetch(request: Request): Promise<Response> {
  const isAuthCall = AUTH_PATHS.some((p) => new URL(request.url).pathname === p);
  const retry = request.clone();
  const session = await sessionStore.load();
  if (session && !isAuthCall) request.headers.set('Authorization', `Bearer ${session.accessToken}`);

  let response: Response;
  try {
    response = await fetch(request);
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR');
  }
  if (response.status !== 401 || isAuthCall || !session) return response;

  const refreshed = await refreshSession();
  const next = sessionStore.peek();
  if (!refreshed || !next) return response;
  retry.headers.set('Authorization', `Bearer ${next.accessToken}`);
  try {
    return await fetch(retry);
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR');
  }
}

export const api = createClient<paths>({ baseUrl: config.apiBaseUrl, fetch: authFetch });

/** Turns an openapi-fetch result into data or a thrown ApiError. */
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.error !== undefined || !result.response.ok) {
    throw toApiError(result.response.status, result.error);
  }
  return result.data as T;
}

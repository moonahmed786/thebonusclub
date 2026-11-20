import { api, unwrap } from '../../shared/api/client';
import { sessionStore } from '../../shared/api/session';
import type { AuthResponse, Member, RegisterInput } from '../../shared/api/types';

async function startSession(res: AuthResponse): Promise<Member> {
  await sessionStore.set({ accessToken: res.tokens.accessToken, refreshToken: res.tokens.refreshToken });
  return res.member;
}

export async function login(email: string, password: string): Promise<Member> {
  const res = unwrap(await api.POST('/api/v1/auth/login', { body: { email, password } }));
  if (res.tokens.role !== 'MEMBER') {
    // Admin accounts use the admin tools, not the member app. End that session without storing it.
    await api
      .POST('/api/v1/auth/logout', { headers: { Authorization: `Bearer ${res.tokens.accessToken}` } })
      .catch(() => undefined);
    throw new Error('ADMIN_ACCOUNT');
  }
  return startSession(res);
}

export async function register(input: RegisterInput): Promise<Member> {
  return startSession(unwrap(await api.POST('/api/v1/auth/register', { body: input })));
}

/** Best effort: revoke the server session. Local sign-out happens regardless. */
export async function logoutRemote(): Promise<void> {
  try {
    await api.POST('/api/v1/auth/logout');
  } catch {
    // Offline or already expired: the local session is cleared anyway.
  }
}

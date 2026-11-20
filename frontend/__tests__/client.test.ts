import { authFetch } from '../src/shared/api/client';
import { sessionStore } from '../src/shared/api/session';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('authFetch', () => {
  const realFetch = globalThis.fetch;
  afterEach(async () => {
    globalThis.fetch = realFetch;
    await sessionStore.clear();
  });

  it('adds the bearer token', async () => {
    await sessionStore.set({ accessToken: 'a1', refreshToken: 'r1' });
    const fetchMock = jest.fn(async (_req: Request) => json(200, { ok: true }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await authFetch(new Request('https://api.test/api/v1/members/me'));
    expect(fetchMock.mock.calls[0][0].headers.get('Authorization')).toBe('Bearer a1');
  });

  it('refreshes once on 401 and retries with the new token', async () => {
    await sessionStore.set({ accessToken: 'old', refreshToken: 'r1' });
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(json(401, { error: { code: 'UNAUTHENTICATED' } }))
      .mockResolvedValueOnce(json(200, { accessToken: 'new', refreshToken: 'r2', expiresIn: 900, role: 'MEMBER' }))
      .mockResolvedValueOnce(json(200, { ok: true }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const res = await authFetch(new Request('https://api.test/api/v1/members/me'));
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect((fetchMock.mock.calls[2][0] as Request).headers.get('Authorization')).toBe('Bearer new');
    expect(sessionStore.peek()).toEqual({ accessToken: 'new', refreshToken: 'r2' });
  });

  it('signs out when the refresh fails, without looping', async () => {
    await sessionStore.set({ accessToken: 'old', refreshToken: 'r1' });
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(json(401, { error: { code: 'UNAUTHENTICATED' } }))
      .mockResolvedValueOnce(json(401, { error: { code: 'INVALID_REFRESH_TOKEN' } }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const res = await authFetch(new Request('https://api.test/api/v1/members/me'));
    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sessionStore.peek()).toBeNull();
  });

  it('does not attach tokens to login', async () => {
    await sessionStore.set({ accessToken: 'a1', refreshToken: 'r1' });
    const fetchMock = jest.fn(async (_req: Request) => json(401, { error: { code: 'INVALID_CREDENTIALS' } }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const res = await authFetch(new Request('https://api.test/api/v1/auth/login', { method: 'POST' }));
    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0].headers.get('Authorization')).toBeNull();
  });
});

import { deleteSecure, readSecure, SecureKeys, writeSecure } from '../storage/secure-store';

export interface Session {
  accessToken: string;
  refreshToken: string;
}

type Listener = (session: Session | null) => void;

let current: Session | null | undefined;
const listeners = new Set<Listener>();

/** In-memory copy of the session, backed by the secure store. */
export const sessionStore = {
  async load(): Promise<Session | null> {
    if (current === undefined) current = await readSecure<Session>(SecureKeys.session);
    return current;
  },

  peek(): Session | null {
    return current ?? null;
  },

  async set(session: Session): Promise<void> {
    current = session;
    await writeSecure(SecureKeys.session, session);
    listeners.forEach((l) => l(session));
  },

  async clear(): Promise<void> {
    current = null;
    await deleteSecure(SecureKeys.session);
    listeners.forEach((l) => l(null));
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

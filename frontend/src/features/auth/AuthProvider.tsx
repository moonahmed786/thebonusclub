import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { sessionStore } from '../../shared/api/session';
import type { RegisterInput } from '../../shared/api/types';
import { logger } from '../../shared/logger';
import { queryKeys } from '../../shared/queryClient';
import { clearAllSecure } from '../../shared/storage/secure-store';
import { unregisterDevice } from '../notifications/push';
import * as authApi from './auth-api';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    sessionStore
      .load()
      .then((s) => setStatus(s ? 'signedIn' : 'signedOut'))
      .catch(() => setStatus('signedOut'));
    // A failed refresh clears the session; follow it to the login screen.
    return sessionStore.subscribe((s) => setStatus(s ? 'signedIn' : 'signedOut'));
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const member = await authApi.login(email, password);
      queryClient.setQueryData(queryKeys.member, member);
    },
    [queryClient],
  );

  const signUp = useCallback(
    async (input: RegisterInput) => {
      const member = await authApi.register(input);
      queryClient.setQueryData(queryKeys.member, member);
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    try {
      await unregisterDevice();
      await authApi.logoutRemote();
    } finally {
      // Clear tokens, cached card, stored voucher codes, and all cached server data.
      await clearAllSecure().catch((err: unknown) => logger.warn('secure clear failed', { err: String(err) }));
      await sessionStore.clear();
      queryClient.clear();
    }
  }, [queryClient]);

  const value = useMemo(() => ({ status, signIn, signUp, signOut }), [status, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

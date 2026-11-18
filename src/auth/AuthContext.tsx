import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, refreshSession, setAccessToken, setSessionExpiredHandler } from '../api/client';
import type { AuthResponse, User } from '../api/types';

interface AuthState {
  user: User | null;
  /** True while we check the refresh cookie on first load */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On page load, try to restore the session from the refresh cookie.
  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
    refreshSession()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const start = useCallback((data: AuthResponse) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      setUser,
      login: async (email, password) =>
        start(await api<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } })),
      register: async (name, email, password) =>
        start(
          await api<AuthResponse>('/auth/register', { method: 'POST', body: { name, email, password } }),
        ),
      logout: async () => {
        await api('/auth/logout', { method: 'POST' }).catch(() => {});
        setAccessToken(null);
        setUser(null);
      },
    }),
    [user, loading, start],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

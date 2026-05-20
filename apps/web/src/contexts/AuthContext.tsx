'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { apiLogin, apiLogout, apiGetMe, apiRefresh, apiUpdateProfile, type Me, type ProfileUpdate } from '../lib/api';

const ACCESS_TOKEN_KEY = 'ha_access_token';
const REFRESH_TOKEN_KEY = 'ha_refresh_token';

interface AuthCtx {
  user: Me | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  setTokens: async () => {},
  updateProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async (accessToken: string) => {
    try {
      const me = await apiGetMe(accessToken);
      setUser(me);
    } catch {
      // Token geçersizse temizle
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!accessToken || !refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        await loadUser(accessToken);
      } catch {
        // Access token süresi dolmuşsa refresh dene
        try {
          const tokens = await apiRefresh(refreshToken);
          localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
          await loadUser(tokens.accessToken);
        } catch {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void init();
  }, [loadUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await apiLogin(email, password);
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      await loadUser(tokens.accessToken);
    },
    [loadUser],
  );

  const logout = useCallback(async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) ?? '';
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) ?? '';
    try {
      await apiLogout(accessToken, refreshToken);
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setUser(null);
    }
  }, []);

  const setTokens = useCallback(
    async (accessToken: string, refreshToken: string) => {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      await loadUser(accessToken);
    },
    [loadUser],
  );

  const updateProfile = useCallback(async (data: ProfileUpdate) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) ?? '';
    const updated = await apiUpdateProfile(data, accessToken);
    setUser((prev) => prev ? { ...prev, profile: { ...prev.profile, ...updated } as Me['profile'] } : prev);
  }, []);

  return (
    <Ctx.Provider value={{ user, isLoading, login, logout, setTokens, updateProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { mutfakApi, type Me, type ProfileUpdate } from '../lib/api';

const ACCESS_KEY = 'mutfak_access';
const REFRESH_KEY = 'mutfak_refresh';

// Üyelik tipleri Mutfak'a erişebilir
const ALLOWED_TIERS = new Set([
  'haritailesi_genc',
  'new_graduate_member',
  'individual_member',
  'corporate_member',
]);

interface AuthCtx {
  user: Me | null;
  token: string;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  token: '',
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  uploadAvatar: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const clearTokens = useCallback(() => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setUser(null);
    setToken('');
  }, []);

  const loadUser = useCallback(
    async (accessToken: string): Promise<boolean> => {
      try {
        const me = await mutfakApi.getMe(accessToken);
        if (!ALLOWED_TIERS.has(me.membershipTier) || me.status !== 'active') {
          clearTokens();
          return false;
        }
        setUser(me);
        return true;
      } catch {
        return false;
      }
    },
    [clearTokens],
  );

  useEffect(() => {
    const init = async () => {
      const access = localStorage.getItem(ACCESS_KEY);
      const refresh = localStorage.getItem(REFRESH_KEY);

      if (!access || !refresh) {
        setIsLoading(false);
        return;
      }

      const ok = await loadUser(access);
      if (ok) {
        setToken(access);
      } else {
        try {
          const tokens = await mutfakApi.refresh(refresh);
          localStorage.setItem(ACCESS_KEY, tokens.accessToken);
          localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
          const refreshed = await loadUser(tokens.accessToken);
          if (refreshed) setToken(tokens.accessToken);
        } catch {
          clearTokens();
        }
      }
      setIsLoading(false);
    };

    void init();
  }, [loadUser, clearTokens]);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await mutfakApi.login(email, password);
      localStorage.setItem(ACCESS_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
      const ok = await loadUser(tokens.accessToken);
      if (!ok) {
        clearTokens();
        throw new Error('Hesabınız Mutfak\'a erişim için onaylı değil.');
      }
      setToken(tokens.accessToken);
    },
    [loadUser, clearTokens],
  );

  const logout = useCallback(async () => {
    const access = localStorage.getItem(ACCESS_KEY) ?? '';
    const refresh = localStorage.getItem(REFRESH_KEY) ?? '';
    try {
      await mutfakApi.logout(access, refresh);
    } finally {
      clearTokens();
    }
  }, [clearTokens]);

  const updateProfile = useCallback(async (data: ProfileUpdate) => {
    const access = localStorage.getItem(ACCESS_KEY) ?? token;
    const updated = await mutfakApi.updateProfile(data, access);
    setUser((prev) => prev ? { ...prev, profile: { ...prev.profile, ...updated } as Me['profile'] } : prev);
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    const access = localStorage.getItem(ACCESS_KEY) ?? token;
    const { avatarUrl } = await mutfakApi.uploadAvatar(file, access);
    setUser((prev) =>
      prev ? { ...prev, profile: prev.profile ? { ...prev.profile, avatarUrl } : null } : prev,
    );
  }, []);

  return (
    <Ctx.Provider value={{ user, token, isLoading, login, logout, updateProfile, uploadAvatar }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

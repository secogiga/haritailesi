'use client';

import {
  createContext, useCallback, useContext,
  useEffect, useRef, useState, type ReactNode,
} from 'react';
import { LS_LEVEL_ACTIONS } from '@/lib/rehber';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export interface SahneUser {
  id: string;
  email: string;
  membershipTier: string;
  completedActionIds: string[];
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
    city: string | null;
    profession: string | null;
  } | null;
}

interface SahneAuthCtx {
  user: SahneUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  recordAction: (actionId: string) => Promise<void>;
}

const Ctx = createContext<SahneAuthCtx>({
  user: null,
  isLoading: true,
  logout: async () => {},
  recordAction: async () => {},
});

// ── Internal fetch helper (always sends cookies) ──────────────────────────────

async function cookieFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1${path}`, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
    if (!res.ok) return null;
    if (res.status === 204) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SahneAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SahneUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Ref ile user'ı takip et — recordAction'ın deps'e bağımlı olmaması için
  const userRef = useRef<SahneUser | null>(null);
  useEffect(() => { userRef.current = user; }, [user]);

  const fetchMe = useCallback(async (): Promise<boolean> => {
    const me = await cookieFetch<SahneUser>('/users/me');
    if (me) {
      setUser({ ...me, completedActionIds: me.completedActionIds ?? [] });
      return true;
    }
    return false;
  }, []);

  // localStorage'daki aksiyonları sunucuyla senkronize et, sonra temizle
  const syncLocalStorageActions = useCallback(async () => {
    try {
      const raw = localStorage.getItem(LS_LEVEL_ACTIONS);
      if (!raw) return;
      const localIds: string[] = JSON.parse(raw);
      if (localIds.length === 0) return;

      const result = await cookieFetch<{ completedActionIds: string[] }>('/users/me/actions/sync', {
        method: 'POST',
        body: JSON.stringify({ actionIds: localIds }),
      });

      if (result) {
        setUser(prev => prev ? { ...prev, completedActionIds: result.completedActionIds } : prev);
        localStorage.removeItem(LS_LEVEL_ACTIONS);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const init = async () => {
      const ok = await fetchMe();
      if (!ok) {
        const refreshed = await cookieFetch('/auth/refresh', { method: 'POST', body: '{}' });
        if (refreshed) await fetchMe();
      } else {
        // Login olduktan sonra localStorage'ı senkronize et
        void syncLocalStorageActions();
      }
      setIsLoading(false);
    };
    void init();
  }, [fetchMe, syncLocalStorageActions]);

  const logout = useCallback(async () => {
    await cookieFetch('/auth/logout', { method: 'POST', body: '{}' });
    setUser(null);
  }, []);

  // Stable ref — usePageAction'ın bağımlılık dizisine eklenebilir, user değişiminde yeniden oluşmaz
  const recordAction = useCallback(async (actionId: string) => {
    const currentUser = userRef.current;

    if (!currentUser) {
      // Anonymous: localStorage'a yaz
      try {
        const raw = localStorage.getItem(LS_LEVEL_ACTIONS);
        const current: string[] = raw ? JSON.parse(raw) : [];
        if (!current.includes(actionId)) {
          localStorage.setItem(LS_LEVEL_ACTIONS, JSON.stringify([...current, actionId]));
        }
      } catch { /* ignore */ }
      return;
    }

    // Optimistic update
    setUser(prev => {
      if (!prev) return prev;
      if (prev.completedActionIds.includes(actionId)) return prev;
      return { ...prev, completedActionIds: [...prev.completedActionIds, actionId] };
    });

    // keepalive: true — harici link tıklamasında sayfa terk edilse bile istek tamamlanır
    const result = await cookieFetch<{ completedActionIds: string[] }>('/users/me/actions', {
      method: 'POST',
      body: JSON.stringify({ actionId }),
      keepalive: true,
    });
    if (result) {
      setUser(prev => prev ? { ...prev, completedActionIds: result.completedActionIds } : prev);
    }
  }, []); // userRef sayesinde deps boş — stable referans garantili

  return (
    <Ctx.Provider value={{ user, isLoading, logout, recordAction }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSahneAuth = () => useContext(Ctx);

// ── Fire-and-forget event tracker (cookie-based, no token needed) ─────────────

export function sahneTrack(
  category: string,
  action: string,
  metadata?: Record<string, unknown>,
): void {
  cookieFetch('/users/me/events/batch', {
    method: 'POST',
    body: JSON.stringify({ events: [{ category, action, ...(metadata ? { metadata } : {}) }] }),
  }).catch(() => undefined);
}

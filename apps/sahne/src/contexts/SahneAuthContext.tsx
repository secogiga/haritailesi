'use client';

import {
  createContext, useCallback, useContext,
  useEffect, useState, type ReactNode,
} from 'react';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export interface SahneUser {
  id: string;
  email: string;
  membershipTier: string;
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
}

const Ctx = createContext<SahneAuthCtx>({
  user: null,
  isLoading: true,
  logout: async () => {},
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

  const fetchMe = useCallback(async (): Promise<boolean> => {
    const me = await cookieFetch<SahneUser>('/users/me');
    if (me) { setUser(me); return true; }
    return false;
  }, []);

  useEffect(() => {
    const init = async () => {
      const ok = await fetchMe();
      if (!ok) {
        // Try refreshing — API reads hi_refresh cookie automatically
        const refreshed = await cookieFetch('/auth/refresh', { method: 'POST', body: '{}' });
        if (refreshed) await fetchMe();
      }
      setIsLoading(false);
    };
    void init();
  }, [fetchMe]);

  const logout = useCallback(async () => {
    await cookieFetch('/auth/logout', { method: 'POST', body: '{}' });
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, isLoading, logout }}>
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

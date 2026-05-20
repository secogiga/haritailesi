'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface AdminModeCtx {
  isAdmin: boolean;
  token: string | null;
  exit: () => void;
}

const Ctx = createContext<AdminModeCtx>({ isAdmin: false, token: null, exit: () => {} });

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    const match = /[#&]ha-token=([^&]+)/.exec(hash);
    if (match?.[1]) {
      const t = decodeURIComponent(match[1]);
      sessionStorage.setItem('ha_admin_token', t);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setToken(t);
    } else {
      const stored = sessionStorage.getItem('ha_admin_token');
      if (stored) setToken(stored);
    }
  }, []);

  useEffect(() => {
    if (token) document.body.classList.add('admin-mode-active');
    else document.body.classList.remove('admin-mode-active');
  }, [token]);

  function exit() {
    sessionStorage.removeItem('ha_admin_token');
    setToken(null);
  }

  return <Ctx.Provider value={{ isAdmin: !!token, token, exit }}>{children}</Ctx.Provider>;
}

export const useAdminMode = () => useContext(Ctx);

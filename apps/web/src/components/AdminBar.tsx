'use client';

import { useAdminMode } from '@/contexts/AdminMode';

const ADMIN_URL = process.env['NEXT_PUBLIC_ADMIN_URL'] ?? 'http://localhost:3004';

export function AdminBar() {
  const { isAdmin, exit } = useAdminMode();
  if (!isAdmin) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-10 bg-[#1a3347] text-white flex items-center justify-between px-4 text-sm shadow-md">
      <div className="flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span className="font-semibold">Admin Modu</span>
        <span className="text-white/50 hidden sm:inline">— Bölümlerin üzerine gelin ve kalem ikonuna tıklayın</span>
      </div>
      <div className="flex items-center gap-4">
        <a
          href={ADMIN_URL}
          target="_blank"
          rel="noreferrer"
          className="text-white/70 hover:text-white transition-colors text-xs font-medium"
        >
          Admin Panele Dön ↗
        </a>
        <button
          onClick={exit}
          className="text-white/60 hover:text-white transition-colors text-xs"
        >
          Modu Kapat
        </button>
      </div>
    </div>
  );
}

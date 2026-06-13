'use client';

import { useAdminMode } from '@/contexts/AdminMode';

export function AdminToolbar() {
  const { isAdmin, exit } = useAdminMode();
  if (!isAdmin) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex items-center gap-2">
      <div className="flex items-center gap-2 bg-[#26496b] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl border border-white/20">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
        <span>Düzenleme Modu</span>
      </div>
      <button
        onClick={exit}
        className="bg-white text-[#26496b] text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        Çıkış
      </button>
    </div>
  );
}

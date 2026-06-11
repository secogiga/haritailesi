'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSahneAuth } from '@/contexts/SahneAuthContext';
import {
  ALL_ACTIONS,
  LEVEL_CONFIG,
  calculateLevel,
  loadLevelActions,
  getNextSuggestedAction,
  canAccess,
  type RehberAction,
} from '@/lib/rehber';

const IDLE_MS = 25_000;

// Page-contextual quick suggestions (2 links per page)
const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

const PAGE_HINTS: Record<string, { label: string; href: string; external?: boolean }[]> = {
  '/':             [{ label: 'Etkinliklere Bak', href: '/etkinlikler' }, { label: 'Mentör Bul', href: '/mentorluk' }],
  '/etkinlikler':  [{ label: 'Mentör Bul', href: '/mentorluk' }, { label: 'Soru & Cevap', href: '/soru-cevap' }],
  '/mentorluk':    [{ label: 'Etkinliklere Bak', href: '/etkinlikler' }, { label: 'Üyeleri Keşfet', href: '/uyeler' }],
  '/uyeler':       [{ label: 'Mentör Bul', href: '/mentorluk' }, { label: 'Mutfak\'ta Bağlan', href: MUTFAK_URL, external: true }],
  '/projeler':     [{ label: 'Soru & Cevap', href: '/soru-cevap' }, { label: 'Mentör Bul', href: '/mentorluk' }],
  '/soru-cevap':   [{ label: 'Projeler', href: '/projeler' }, { label: 'Etkinliklere Bak', href: '/etkinlikler' }],
  '/egitim':       [{ label: 'Mentör Bul', href: '/mentorluk' }, { label: 'Soru & Cevap', href: '/soru-cevap' }],
  '/ilanlar':      [{ label: 'Üyeleri Keşfet', href: '/uyeler' }, { label: 'Mentör Bul', href: '/mentorluk' }],
  '/genc':         [{ label: 'Mentör Bul', href: '/mentorluk' }, { label: 'Etkinliklere Bak', href: '/etkinlikler' }],
};

export function FloatingGuide() {
  const [mounted, setMounted]       = useState(false);
  const [open, setOpen]             = useState(false);
  const [idlePulse, setIdlePulse]   = useState(false);
  const [localIds, setLocalIds]     = useState<string[]>([]);
  const idleTimer                   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pathname = usePathname();
  const router   = useRouter();
  const { user, recordAction } = useSahneAuth();

  useEffect(() => {
    setMounted(true);
    setLocalIds(loadLevelActions());
  }, []);

  const doneIds = user ? user.completedActionIds : localIds;

  // Close panel on page change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Idle detection
  const resetIdle = useCallback(() => {
    setIdlePulse(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      setIdlePulse(true);
    }, IDLE_MS);
  }, []);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'touchstart', 'click'] as const;
    events.forEach(e => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [resetIdle]);

  useEffect(() => { if (open) setIdlePulse(false); }, [open]);

  if (!mounted) return null;

  const tier        = user?.membershipTier ?? null;
  const level       = calculateLevel(doneIds);
  const lvl         = LEVEL_CONFIG[level];
  const nextAction  = getNextSuggestedAction(doneIds, tier, level);
  const hints       = PAGE_HINTS[pathname] ?? PAGE_HINTS['/']!;
  const canGoBack   = typeof window !== 'undefined' && window.history.length > 1;

  const markDone = (id: string) => {
    if (!user) setLocalIds(prev => prev.includes(id) ? prev : [...prev, id]);
    void recordAction(id);
    setOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">

      {/* ── Panel ── */}
      {open && (
        <div className="w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-guide-in">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#26496b]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#66aca9] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <circle cx="12" cy="12" r="10" />
                <path d="M16.5 7.5 L13.2 13.2 L7.5 16.5 L10.8 10.8 Z" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="1.2" fill="#26496b" />
              </svg>
              <span className="text-xs font-semibold text-white">Yolculuğa Başla</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white text-xl leading-none">×</button>
          </div>

          <div className="p-3 space-y-2">

            {/* Next suggested action — main card */}
            {nextAction && (
              <div className="rounded-xl border border-[#26496b]/15 bg-[#26496b]/5 p-3">
                <p className="text-[10px] font-semibold text-[#26496b]/50 uppercase tracking-widest mb-2">
                  Sıradaki Adımın
                </p>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-xl">{nextAction.icon}</span>
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{nextAction.label}</p>
                </div>
                <div className="flex gap-2">
                  {nextAction.external ? (
                    <a
                      href={nextAction.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => markDone(nextAction.id)}
                      className="flex-1 text-center text-xs font-semibold text-white bg-[#26496b] py-2 rounded-lg hover:bg-[#1e3a56] transition-colors"
                    >
                      Git →
                    </a>
                  ) : (
                    <Link
                      href={nextAction.href}
                      onClick={() => markDone(nextAction.id)}
                      className="flex-1 text-center text-xs font-semibold text-white bg-[#26496b] py-2 rounded-lg hover:bg-[#1e3a56] transition-colors"
                    >
                      Git →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Divider + page hints */}
            <div className="pt-1 pb-0.5 px-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Bu sayfada</p>
            </div>

            {hints.map(h =>
              h.external ? (
                <a
                  key={h.href}
                  href={h.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm w-5 text-center text-gray-400">→</span>
                  <span className="text-xs font-medium text-gray-600">{h.label}</span>
                </a>
              ) : (
                <Link
                  key={h.href}
                  href={h.href}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm w-5 text-center text-gray-400">→</span>
                  <span className="text-xs font-medium text-gray-600">{h.label}</span>
                </Link>
              )
            )}

            {/* Back button */}
            {canGoBack && (
              <button
                onClick={() => { router.back(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-sm w-5 text-center text-gray-400">←</span>
                <span className="text-xs font-medium text-gray-500">Geri Dön</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Idle bubble ── */}
      {idlePulse && !open && nextAction && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-white border border-gray-200 shadow-lg rounded-full px-3.5 py-2 text-xs font-medium text-gray-700 hover:border-[#66aca9] transition-all animate-guide-in"
        >
          <span>{nextAction.icon}</span>
          <span className="max-w-[140px] truncate">{nextAction.label}</span>
          <span className="text-gray-400">→</span>
        </button>
      )}

      {/* ── FAB ── */}
      <button
        onClick={() => { setOpen(v => !v); setIdlePulse(false); }}
        title="Yolunu Bul"
        className={`relative w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all ${
          open
            ? 'bg-gray-600 text-white'
            : `bg-[#26496b] text-white hover:bg-[#1e3a56] hover:scale-105 ${idlePulse ? 'animate-fab-pulse' : ''}`
        }`}
      >
        {/* Level dot */}
        {!open && (
          <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${lvl.dot}`} />
        )}
        {open ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <circle cx="12" cy="12" r="10" />
            <path d="M16.5 7.5 L13.2 13.2 L7.5 16.5 L10.8 10.8 Z" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.2" fill="#26496b" />
          </svg>
        )}
      </button>

      <style>{`
        @keyframes guide-in {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-guide-in { animation: guide-in 0.18s ease-out; }
        @keyframes fab-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(38,73,107,0.45); }
          60%       { box-shadow: 0 0 0 10px rgba(38,73,107,0); }
        }
        .animate-fab-pulse { animation: fab-pulse 1.8s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

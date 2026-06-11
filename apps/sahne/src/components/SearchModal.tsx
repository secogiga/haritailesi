'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { cms, type SearchResult } from '@/lib/api';

const TYPE_LABELS: Record<string, string> = {
  kongre: 'Kongre', networking: 'Networking', odul: 'Ödül',
  webinar: 'Webinar', calistay: 'Çalıştay', sempozyum: 'Sempozyum', diger: 'Etkinlik',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif', completed: 'Tamamlandı', archived: 'Arşiv',
};

const IcoCalendar = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IcoDoc = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IcoCompass = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="2" />
    <path strokeLinecap="round" d="M12 3v6M12 15v6M3 12h6M15 12h6" />
  </svg>
);

const IcoChevron = () => (
  <svg className="w-4 h-4 text-gray-300 dark:text-slate-600 shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
    fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const QUICK_LINKS = [
  {
    label: 'Etkinlikler', href: '/etkinlikler',
    icon: <IcoCalendar />,
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    fg: 'text-violet-600 dark:text-violet-400',
  },
  {
    label: 'Projeler', href: '/projeler',
    icon: <IcoDoc />,
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    fg: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    label: 'Çözüm Arıyorum', href: '/haritailesipusula',
    icon: <IcoCompass />,
    bg: 'bg-[#26496b]/[0.07] dark:bg-[#66aca9]/10',
    fg: 'text-[#26496b] dark:text-[#66aca9]',
  },
];

interface Props { onClose: () => void }

export function SearchModal({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults(null); return; }
    setLoading(true);
    const data = await cms.search(q.trim());
    setResults(data);
    setLoading(false);
  }, []);

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { void doSearch(q); }, 300);
  }

  const total = (results?.events.length ?? 0) + (results?.projects.length ?? 0);
  const isEmpty = query.trim().length < 2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-5 py-4">
          {loading ? (
            <svg className="animate-spin w-5 h-5 text-[#26496b] dark:text-[#66aca9] shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-400 dark:text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={onInput}
            placeholder="Site içinde ara…"
            className="flex-1 bg-transparent text-base text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults(null); inputRef.current?.focus(); }}
              className="text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 transition-colors p-0.5"
              aria-label="Temizle"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <kbd className="text-xs font-mono text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded px-1.5 py-0.5 ml-1">
            Esc
          </kbd>
        </div>

        <div className="border-t border-gray-100 dark:border-slate-800" />

        {/* Empty state — quick links */}
        {isEmpty && (
          <div className="px-4 py-3">
            <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
              Hızlı Erişim
            </p>
            <div className="space-y-0.5">
              {QUICK_LINKS.map(({ label, href, icon, bg, fg }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg} ${fg}`}>
                    {icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-slate-100 transition-colors">
                    {label}
                  </span>
                  <IcoChevron />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {results && total === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Sonuç bulunamadı</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
              &ldquo;{query}&rdquo; için eşleşme yok
            </p>
          </div>
        )}

        {/* Results */}
        {results && total > 0 && (
          <div className="max-h-[55vh] overflow-y-auto py-2">
            {results.events.length > 0 && (
              <div>
                <p className="px-5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                  Etkinlikler
                </p>
                {results.events.map((e) => (
                  <Link
                    key={e.id}
                    href={`/etkinlikler/${e.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                      <IcoCalendar />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{e.title}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">
                        {TYPE_LABELS[e.type] ?? e.type} ·{' '}
                        {new Date(e.dateStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <IcoChevron />
                  </Link>
                ))}
              </div>
            )}
            {results.projects.length > 0 && (
              <div>
                <p className="px-5 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                  Projeler
                </p>
                {results.projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projeler/${p.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <IcoDoc />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{p.title}</p>
                      {p.summary && (
                        <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
                          {STATUS_LABELS[p.status] ?? p.status} · {p.summary}
                        </p>
                      )}
                    </div>
                    <IcoChevron />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-slate-800 px-5 py-2.5 flex items-center gap-4">
          <span className="text-[11px] text-gray-400 dark:text-slate-500 flex items-center gap-1.5">
            <kbd className="font-mono bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded px-1 py-0.5 text-[10px]">↵</kbd>
            Git
          </span>
          <span className="text-[11px] text-gray-400 dark:text-slate-500 flex items-center gap-1.5">
            <kbd className="font-mono bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded px-1 py-0.5 text-[10px]">Esc</kbd>
            Kapat
          </span>
          <span className="ml-auto text-[11px] text-gray-300 dark:text-slate-600 tracking-wide">haritailesi</span>
        </div>
      </div>
    </div>
  );
}

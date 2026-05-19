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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-800">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={onInput}
            placeholder="Etkinlik veya proje ara…"
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
          {loading && (
            <svg className="animate-spin w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          <button onClick={onClose} className="text-xs text-gray-400 dark:text-slate-500 border border-gray-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono hover:bg-gray-50 dark:hover:bg-slate-800">
            Esc
          </button>
        </div>

        {/* Results */}
        {results && total === 0 && (
          <div className="px-4 py-10 text-center text-sm text-gray-400 dark:text-slate-500">
            Sonuç bulunamadı.
          </div>
        )}

        {results && total > 0 && (
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800">
            {results.events.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">Etkinlikler</p>
                {results.events.map((e) => (
                  <Link
                    key={e.id}
                    href={`/etkinlikler/${e.slug}`}
                    onClick={onClose}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{e.title}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">
                        {TYPE_LABELS[e.type] ?? e.type} ·{' '}
                        {new Date(e.dateStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {results.projects.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">Projeler</p>
                {results.projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projeler/${p.slug}`}
                    onClick={onClose}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{p.title}</p>
                      {p.summary && (
                        <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
                          {STATUS_LABELS[p.status] ?? p.status} · {p.summary}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {!results && query.trim().length < 2 && (
          <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-slate-500">
            En az 2 karakter girin
          </div>
        )}
      </div>
    </div>
  );
}

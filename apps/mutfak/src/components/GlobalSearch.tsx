'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mutfakApi, type SearchResult } from '@/lib/api';
import { useToken } from '@/hooks/useToken';
import { useDebounce } from '@/hooks/useDebounce';
import { Avatar } from '@/components/Avatar';

const HISTORY_KEY = 'mutfak_search_history';
const MAX_HISTORY = 5;

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

function saveToHistory(q: string) {
  const trimmed = q.trim();
  if (!trimmed) return;
  const prev = loadHistory().filter((h) => h !== trimmed);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([trimmed, ...prev].slice(0, MAX_HISTORY)));
}

type Tab = 'posts' | 'members';

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-[#26496b]/10 text-[#26496b] font-semibold not-italic rounded px-0.5">{part}</mark>
          : part,
      )}
    </>
  );
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('posts');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const debouncedQuery = useDebounce(query, 300);
  const token = useToken();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults(null);
  }, []);

  // Load history when modal opens
  useEffect(() => {
    if (open) setHistory(loadHistory());
  }, [open]);

  function handleResultClick(fn: () => void) {
    saveToHistory(query);
    setHistory(loadHistory());
    fn();
    close();
  }

  function removeHistory(item: string) {
    const next = history.filter((h) => h !== item);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') close();
    }
    function handleOpen() { setOpen(true); }
    document.addEventListener('keydown', handleKey);
    document.addEventListener('haritailesi:search:open', handleOpen);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('haritailesi:search:open', handleOpen);
    };
  }, [close]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!debouncedQuery.trim() || !token) {
      setResults(null);
      return;
    }
    setLoading(true);
    mutfakApi
      .search(debouncedQuery.trim(), token)
      .then(setResults)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [debouncedQuery, token]);

  if (!open) return null;

  const posts = results?.posts ?? [];
  const members = results?.members ?? [];

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-16 px-4" role="dialog" aria-modal="true" aria-label="Arama">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Gönderi veya üye ara..."
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded font-mono">Esc</kbd>
        </div>

        {/* Tabs */}
        {query.trim() && (
          <div className="flex border-b border-gray-100">
            {(['posts', 'members'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === t ? 'text-[#26496b] border-b-2 border-[#26496b]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t === 'posts' ? `Gönderiler (${posts.length})` : `Üyeler (${members.length})`}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {!query.trim() && history.length === 0 && (
            <p className="px-4 py-8 text-sm text-center text-gray-400">Aramak için yazmaya başlayın</p>
          )}
          {!query.trim() && history.length > 0 && (
            <div className="py-2">
              <div className="flex items-center justify-between px-4 py-1.5">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Son aramalar</p>
                <button onClick={clearHistory} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Temizle</button>
              </div>
              {history.map((h) => (
                <div key={h} className="flex items-center gap-2 px-4 hover:bg-gray-50 transition-colors group">
                  <button
                    className="flex-1 flex items-center gap-2 py-2.5 text-left"
                    onClick={() => setQuery(h)}
                  >
                    <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-700">{h}</span>
                  </button>
                  <button
                    onClick={() => removeHistory(h)}
                    className="p-1 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label={`${h} aramasını kaldır`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          {loading && (
            <p className="px-4 py-6 text-sm text-center text-gray-400">Aranıyor...</p>
          )}
          {!loading && query.trim() && results && (
            <>
              {tab === 'posts' && (
                <div className="divide-y divide-gray-50">
                  {posts.length === 0 && (
                    <p className="px-4 py-6 text-sm text-center text-gray-400">Gönderi bulunamadı.</p>
                  )}
                  {posts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleResultClick(() => router.push(`/akis/${p.id}`))}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        <Highlight text={p.title ?? p.body.slice(0, 80)} query={debouncedQuery} />
                      </p>
                      {p.title && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                          <Highlight text={p.body.slice(0, 80)} query={debouncedQuery} />
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{p.displayName}</p>
                    </button>
                  ))}
                </div>
              )}
              {tab === 'members' && (
                <div className="divide-y divide-gray-50">
                  {members.length === 0 && (
                    <p className="px-4 py-6 text-sm text-center text-gray-400">Üye bulunamadı.</p>
                  )}
                  {members.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleResultClick(() => router.push(`/uyeler/${m.id}`))}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                    >
                      <Avatar name={m.displayName} src={m.avatarUrl} size={36} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          <Highlight text={m.displayName} query={debouncedQuery} />
                        </p>
                        {m.profession && (
                          <p className="text-xs text-gray-500">
                            <Highlight text={m.profession} query={debouncedQuery} />
                          </p>
                        )}
                        {m.city && <p className="text-xs text-gray-400">{m.city}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { useSahneAuth } from '@/contexts/SahneAuthContext';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'http://localhost:3003';

const FIELD_OPTIONS: {
  value: string; label: string; emoji: string; desc: string;
  dot: string; iconBg: string; iconText: string; bar: string;
} [] = [
  { value: 'cbs',                   label: 'CBS / GIS',          emoji: '🗺️', desc: 'Coğrafi bilgi sistemleri ve uzamsal analiz',      dot: 'bg-sky-500',     iconBg: 'bg-sky-100',     iconText: 'text-sky-600',     bar: 'from-sky-400 to-blue-500'      },
  { value: 'fotogrametri',          label: 'Fotogrametri',        emoji: '📷', desc: 'Hava ve yer fotoğraflarından ölçüm',              dot: 'bg-violet-500',  iconBg: 'bg-violet-100',  iconText: 'text-violet-600',  bar: 'from-violet-400 to-purple-500' },
  { value: 'kadastro',              label: 'Kadastro',            emoji: '📋', desc: 'Tapu, parsel ve arazi sınır işlemleri',           dot: 'bg-amber-500',   iconBg: 'bg-amber-100',   iconText: 'text-amber-600',   bar: 'from-amber-400 to-orange-500'  },
  { value: 'uzaktan_algilama',      label: 'Uzaktan Algılama',    emoji: '🛰️', desc: 'Uydu görüntüleri ve insansız hava araçları',     dot: 'bg-emerald-500', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', bar: 'from-emerald-400 to-teal-500'  },
  { value: 'klasik_haritacilik',    label: 'Klasik Haritacılık',  emoji: '🧭', desc: 'Geleneksel ölçme ve harita üretimi',              dot: 'bg-orange-500',  iconBg: 'bg-orange-100',  iconText: 'text-orange-600',  bar: 'from-orange-400 to-red-500'    },
  { value: 'gayrimenkul_degerleme', label: 'Gayrimenkul',         emoji: '🏠', desc: 'Değerleme, ekspertiz ve danışmanlık',             dot: 'bg-rose-500',    iconBg: 'bg-rose-100',    iconText: 'text-rose-600',    bar: 'from-rose-400 to-pink-500'     },
  { value: 'yazilim',               label: 'Yazılım',             emoji: '💻', desc: 'GIS yazılımları ve programlama',                  dot: 'bg-indigo-500',  iconBg: 'bg-indigo-100',  iconText: 'text-indigo-600',  bar: 'from-indigo-400 to-blue-600'   },
  { value: 'kariyer',               label: 'Kariyer',             emoji: '🎯', desc: 'Sınavlar, iş ilanları ve mesleki gelişim',        dot: 'bg-teal-500',    iconBg: 'bg-teal-100',    iconText: 'text-teal-600',    bar: 'from-teal-400 to-cyan-500'     },
  { value: 'genel',                 label: 'Genel',               emoji: '📚', desc: 'Sektöre genel bakış, gündem ve kaynaklar',        dot: 'bg-gray-400',    iconBg: 'bg-gray-100',    iconText: 'text-gray-600',    bar: 'from-gray-400 to-gray-500'     },
];

// ─── LibrarySearchInput ───────────────────────────────────────────────────────

interface SearchSuggestion {
  type: 'term' | 'guide' | 'document' | 'regulation';
  id: string;
  slug: string | null;
  title: string;
}

const TYPE_META: Record<SearchSuggestion['type'], { label: string; icon: string; href: (slug: string) => string }> = {
  term:       { label: 'Terim',    icon: '🏷️', href: (s) => `/kutuphane/sozluk/${s}` },
  guide:      { label: 'Rehber',   icon: '📖', href: (s) => `/kutuphane/rehberler/${s}` },
  document:   { label: 'Doküman',  icon: '📄', href: (s) => `/kutuphane/dokumanlar/${s}` },
  regulation: { label: 'Mevzuat',  icon: '⚖️', href: (s) => `/kutuphane/mevzuat/${s}` },
};

interface StatItem { value: string; label: string; }

export function LibrarySearchInput({ stats }: { stats?: StatItem[] }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.trim().length < 2) { setSuggestions([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/v1/library/autocomplete?q=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const data = await res.json() as { terms: { id: string; slug: string | null; term: string }[]; guides: { id: string; slug: string | null; title: string }[]; documents: { id: string; title: string }[]; regulations: { id: string; slug: string | null; title: string; shortTitle: string | null }[] };
        const items: SearchSuggestion[] = [
          ...data.terms.slice(0, 3).map(t => ({ type: 'term' as const, id: t.id, slug: t.slug, title: t.term })),
          ...data.guides.slice(0, 2).map(g => ({ type: 'guide' as const, id: g.id, slug: g.slug, title: g.title })),
          ...data.regulations.slice(0, 2).map(r => ({ type: 'regulation' as const, id: r.id, slug: r.slug, title: r.shortTitle ?? r.title })),
          ...data.documents.slice(0, 1).map(d => ({ type: 'document' as const, id: d.id, slug: d.id, title: d.title })),
        ];
        setSuggestions(items);
        setOpen(items.length > 0);
        setActive(-1);
      } catch { /* ignore */ }
    }, 220);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, -1)); }
    else if (e.key === 'Escape') { setOpen(false); setActive(-1); }
    else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      const s = suggestions[active];
      if (s?.slug) window.location.href = TYPE_META[s.type].href(s.slug);
    }
  };

  return (
    <div ref={wrapRef} className="max-w-[440px]">
      <div className="relative flex gap-2">
      <div className="relative flex-1">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-white/25 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0118 0z" />
        </svg>
        <input
          type="search" value={query} autoComplete="off"
          placeholder="Terim, rehber, mevzuat veya doküman ara…"
          className="w-full pl-10 pr-4 py-3 bg-white/[0.07] border border-white/10 rounded-[10px] text-sm text-white placeholder-white/25 focus:outline-none focus:bg-white/10 transition-all"
          onChange={e => { setQuery(e.target.value); fetchSuggestions(e.target.value); }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
        />

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-white/10 overflow-hidden z-50"
            style={{ background: 'rgba(8,18,34,0.96)', backdropFilter: 'blur(20px)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
            {suggestions.map((s, i) => {
              const meta = TYPE_META[s.type];
              const href = s.slug ? meta.href(s.slug) : `/kutuphane/arama?q=${encodeURIComponent(s.title)}`;
              return (
                <a key={s.id} href={href}
                  onMouseEnter={() => setActive(i)}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${i === active ? 'bg-white/10' : 'hover:bg-white/[0.06]'}`}>
                  <span className="text-base shrink-0">{meta.icon}</span>
                  <span className="flex-1 text-sm text-white/90 truncate">{s.title}</span>
                  <span className="text-[10px] text-white/30 font-semibold uppercase tracking-wide shrink-0">{meta.label}</span>
                </a>
              );
            })}
            <a href={`/kutuphane/arama?q=${encodeURIComponent(query)}`}
              className="flex items-center gap-2 px-4 py-2.5 border-t border-white/[0.06] text-xs text-amber-400 hover:bg-white/[0.04] transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0118 0z" />
              </svg>
              &quot;{query}&quot; için tüm sonuçları gör
            </a>
          </div>
        )}
      </div>
      <a href={`/kutuphane/arama?q=${encodeURIComponent(query)}`}
        className="px-5 py-3 bg-amber-400 border border-amber-400 rounded-[10px] text-sm text-[#0b1829] font-bold shrink-0 flex items-center">
        Ara
      </a>
      </div>

      {stats && stats.length > 0 && (
        <div className={`flex gap-2 pt-6 border-t border-white/10 mt-6 transition-all duration-200 ${open ? 'opacity-0 pointer-events-none -translate-y-1' : 'opacity-100 translate-y-0'}`}>
          {stats.map((s) => (
            <div key={s.label}
              className="flex flex-col items-center gap-1 px-3.5 py-2.5 rounded-[10px] bg-black/25 border border-white/[0.06]"
              style={{ boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.45), inset 0 1px 2px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.06)' }}>
              <span className="text-[18px] font-black text-white leading-none">{s.value}</span>
              <span className="text-[8.5px] text-white/30 font-bold uppercase tracking-[0.10em] whitespace-nowrap text-center">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookmarkItem { id: string; title: string; slug: string }
interface Bookmarks {
  guides: BookmarkItem[];
  terms: BookmarkItem[];
  regulations: BookmarkItem[];
}

type BookmarkType = 'guides' | 'terms' | 'regulations';

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiGetPrefs(): Promise<{ fieldPref: string | null; bookmarks: Bookmarks } | null> {
  try {
    const res = await fetch(`${API}/api/v1/library/me/prefs`, { credentials: 'include' });
    if (!res.ok) return null;
    return res.json() as Promise<{ fieldPref: string | null; bookmarks: Bookmarks }>;
  } catch { return null; }
}

async function apiPutPrefs(patch: { fieldPref?: string | null; bookmarks?: Bookmarks }) {
  try {
    await fetch(`${API}/api/v1/library/me/prefs`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  } catch { /* ignore */ }
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

const LS_BOOKMARKS = 'hi_bookmarks';
const LS_FIELD_PREF = 'hi_field_pref';

function lsGetBookmarks(): Bookmarks {
  try {
    const raw = localStorage.getItem(LS_BOOKMARKS);
    if (!raw) return { guides: [], terms: [], regulations: [] };
    return JSON.parse(raw) as Bookmarks;
  } catch { return { guides: [], terms: [], regulations: [] }; }
}

function lsSetBookmarks(b: Bookmarks) {
  try { localStorage.setItem(LS_BOOKMARKS, JSON.stringify(b)); } catch { /* ignore */ }
}

function lsGetField(): string | null {
  try { return localStorage.getItem(LS_FIELD_PREF); } catch { return null; }
}

function lsSetField(f: string) {
  try { localStorage.setItem(LS_FIELD_PREF, f); } catch { /* ignore */ }
}

// ─── Sync hook: login sonrası localStorage → API ─────────────────────────────

export function useLibraryPrefs() {
  const { user, isLoading } = useSahneAuth();
  const [fieldPref, setFieldPrefState] = useState<string | null>(null);
  const [bookmarks, setBookmarksState] = useState<Bookmarks>({ guides: [], terms: [], regulations: [] });
  const [mounted, setMounted] = useState(false);
  const synced = useRef(false);

  // Mount: localStorage'dan oku
  useEffect(() => {
    setMounted(true);
    setFieldPrefState(lsGetField());
    setBookmarksState(lsGetBookmarks());
  }, []);

  // Login durumu değişince senkronize et
  useEffect(() => {
    if (!mounted || isLoading) return;

    if (!user) { synced.current = false; return; }
    if (synced.current) return;
    synced.current = true;

    const doSync = async () => {
      const serverPrefs = await apiGetPrefs();
      if (!serverPrefs) return;

      // Sunucu varsa öncelikli; localStorage'daki bookmarks sunucuya birleştir
      const lsB = lsGetBookmarks();
      const merged: Bookmarks = {
        guides: mergeItems(serverPrefs.bookmarks.guides ?? [], lsB.guides),
        terms: mergeItems(serverPrefs.bookmarks.terms ?? [], lsB.terms),
        regulations: mergeItems(serverPrefs.bookmarks.regulations ?? [], lsB.regulations),
      };
      const mergedField = serverPrefs.fieldPref ?? lsGetField();

      // Sunucuya merged kaydet
      await apiPutPrefs({ fieldPref: mergedField, bookmarks: merged });

      // State ve LS güncelle
      setFieldPrefState(mergedField);
      setBookmarksState(merged);
      if (mergedField) lsSetField(mergedField);
      lsSetBookmarks(merged);
    };

    void doSync();
  }, [user, isLoading, mounted]);

  const setFieldPref = useCallback(async (f: string) => {
    lsSetField(f);
    setFieldPrefState(f);
    if (user) await apiPutPrefs({ fieldPref: f });
  }, [user]);

  const toggleBookmark = useCallback(async (type: BookmarkType, item: BookmarkItem) => {
    setBookmarksState(prev => {
      const exists = prev[type].some(x => x.id === item.id);
      const next: Bookmarks = {
        ...prev,
        [type]: exists ? prev[type].filter(x => x.id !== item.id) : [...prev[type], item],
      };
      lsSetBookmarks(next);
      if (user) void apiPutPrefs({ bookmarks: next });
      return next;
    });
  }, [user]);

  const isBookmarked = useCallback((type: BookmarkType, id: string) => {
    return bookmarks[type].some(x => x.id === id);
  }, [bookmarks]);

  return { fieldPref, bookmarks, mounted, setFieldPref, toggleBookmark, isBookmarked };
}

function mergeItems(server: BookmarkItem[], local: BookmarkItem[]): BookmarkItem[] {
  const map = new Map<string, BookmarkItem>();
  for (const item of [...server, ...local]) map.set(item.id, item);
  return Array.from(map.values());
}

// ─── PersonalizedSection ─────────────────────────────────────────────────────

interface PersonalizedTerm { id: string; slug: string | null; term: string; definition: string }
interface PersonalizedGuide { id: string; slug: string; title: string; summary: string; type: string }

export function PersonalizedSection() {
  const { fieldPref: field, mounted, setFieldPref } = useLibraryPrefs();
  const [picking, setPicking] = useState(false);
  const [terms, setTerms] = useState<PersonalizedTerm[]>([]);
  const [guides, setGuides] = useState<PersonalizedGuide[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPersonalized = useCallback(async (f: string) => {
    setLoading(true);
    try {
      const [tr, gr] = await Promise.all([
        fetch(`${API}/api/v1/library/terms?field=${f}&limit=4`).then(r => r.json()),
        fetch(`${API}/api/v1/library/guides?field=${f}&limit=3`).then(r => r.json()),
      ]);
      setTerms(Array.isArray(tr) ? tr.slice(0, 4) : []);
      setGuides(Array.isArray(gr) ? gr.slice(0, 3) : []);
    } catch {
      setTerms([]); setGuides([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (field) void fetchPersonalized(field);
  }, [field, fetchPersonalized]);

  if (!mounted) return null;

  const fieldLabel = FIELD_OPTIONS.find(o => o.value === field)?.label ?? field;

  const handlePickField = async (v: string) => {
    await setFieldPref(v);
    setPicking(false);
  };

  if (!field || picking) {
    return (
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Başlık */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-4">
          <div>
            <p className="font-black text-gray-900 text-base leading-tight">Mesleğin Hangi Alanına İlgi Duyuyorsun?</p>
            <p className="text-[13px] text-gray-400 mt-0.5">Seni özel terim, rehber ve mevzuata yönlendirelim.</p>
          </div>
          {picking && (
            <button onClick={() => setPicking(false)} className="text-xs text-gray-400 hover:text-gray-700 transition-colors font-semibold border border-gray-200 hover:border-gray-400 rounded-lg px-3 py-1.5 shrink-0">
              ← İptal
            </button>
          )}
        </div>

        {/* Alan seçici grid */}
        <div className="p-5 grid grid-cols-3 gap-3">
          {FIELD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => void handlePickField(opt.value)}
              className="group relative flex flex-col gap-3 p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 text-left transition-all duration-200 overflow-hidden"
            >
              {/* Renkli ikon kutusu */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${opt.iconBg} group-hover:scale-105 transition-transform duration-200`}>
                {opt.emoji}
              </div>
              {/* Etiket + açıklama */}
              <div>
                <p className={`text-[13px] font-black text-gray-800 leading-snug group-hover:${opt.iconText.replace('text-', 'text-')} transition-colors`}>{opt.label}</p>
                <p className="text-[11px] text-gray-400 leading-snug mt-0.5 line-clamp-2">{opt.desc}</p>
              </div>
              {/* Hover alt çizgi */}
              <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${opt.bar} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
            </button>
          ))}
        </div>
      </section>
    );
  }

  const hasContent = terms.length > 0 || guides.length > 0;

  const activeField = FIELD_OPTIONS.find(o => o.value === field);

  return (
    <section className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${activeField?.iconBg ?? 'bg-gray-100'}`}>
            {activeField?.emoji ?? '📚'}
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider leading-none mb-0.5">Meslek Alanın</p>
            <p className="text-sm font-black text-gray-900 leading-none">{fieldLabel}</p>
          </div>
        </div>
        <button
          onClick={() => setPicking(true)}
          className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors border border-gray-200 hover:border-gray-400 rounded-lg px-2.5 py-1.5 font-medium"
        >
          Değiştir
        </button>
      </div>

      <div className="p-4">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        )}

        {!loading && !hasContent && (
          <p className="text-sm text-gray-400 text-center py-4">Bu alan için henüz içerik eklenmemiş.</p>
        )}

        {!loading && hasContent && (
          <div className="space-y-4">
            {terms.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Terimler</p>
                <div className="space-y-0.5">
                  {terms.map(t => (
                    <Link key={t.id} href={t.slug ? `/kutuphane/sozluk/${t.slug}` : '/kutuphane/sozluk'}
                      className="flex items-start gap-3 group p-2.5 rounded-xl hover:bg-violet-50 transition-colors">
                      <span className="text-lg leading-none mt-0.5 shrink-0">📘</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-violet-700 transition-colors">{t.term}</p>
                        <p className="text-xs text-gray-400 line-clamp-1 leading-relaxed">{t.definition}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href={`/kutuphane/sozluk?field=${field}`} className="block mt-1.5 text-xs text-violet-600 hover:text-violet-800 font-semibold px-2.5">
                  Tüm terimleri gör →
                </Link>
              </div>
            )}

            {guides.length > 0 && (
              <div className={terms.length > 0 ? 'pt-3 border-t border-gray-100' : ''}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Rehberler</p>
                <div className="space-y-0.5">
                  {guides.map(g => (
                    <Link key={g.id} href={`/kutuphane/rehberler/${g.slug}`}
                      className="flex items-start gap-3 group p-2.5 rounded-xl hover:bg-emerald-50 transition-colors">
                      <span className="text-lg leading-none mt-0.5 shrink-0">📗</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">{g.title}</p>
                        <p className="text-xs text-gray-400 line-clamp-1 leading-relaxed">{g.summary}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href={`/kutuphane/rehberler?field=${field}`} className="block mt-1.5 text-xs text-emerald-600 hover:text-emerald-800 font-semibold px-2.5">
                  Tüm rehberleri gör →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── SavedSection ─────────────────────────────────────────────────────────────

export function SavedSection() {
  const { bookmarks, mounted } = useLibraryPrefs();

  if (!mounted) return null;

  const total = bookmarks.guides.length + bookmarks.terms.length + bookmarks.regulations.length;
  if (total === 0) return null;

  return (
    <section className="mt-8 bg-amber-50 rounded-2xl border border-amber-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">Kaydettiklerim</p>
          <p className="text-xs text-amber-700">{total} kayıtlı içerik</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {bookmarks.guides.map(g => (
          <Link key={g.id} href={`/kutuphane/rehberler/${g.slug}`}
            className="flex items-center gap-2.5 group p-2 rounded-xl hover:bg-amber-100 transition-colors">
            <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center shrink-0">
              <span className="text-[9px] font-black text-emerald-600">R</span>
            </div>
            <p className="text-sm font-medium text-gray-800 group-hover:text-amber-800 transition-colors line-clamp-1">{g.title}</p>
          </Link>
        ))}
        {bookmarks.terms.map(t => (
          <Link key={t.id} href={`/kutuphane/sozluk/${t.slug}`}
            className="flex items-center gap-2.5 group p-2 rounded-xl hover:bg-amber-100 transition-colors">
            <div className="w-5 h-5 rounded bg-violet-100 flex items-center justify-center shrink-0">
              <span className="text-[9px] font-black text-violet-600">T</span>
            </div>
            <p className="text-sm font-medium text-gray-800 group-hover:text-amber-800 transition-colors line-clamp-1">{t.title}</p>
          </Link>
        ))}
        {bookmarks.regulations.map(r => (
          <Link key={r.id} href={`/kutuphane/mevzuat/${r.slug}`}
            className="flex items-center gap-2.5 group p-2 rounded-xl hover:bg-amber-100 transition-colors">
            <div className="w-5 h-5 rounded bg-rose-100 flex items-center justify-center shrink-0">
              <span className="text-[9px] font-black text-rose-600">M</span>
            </div>
            <p className="text-sm font-medium text-gray-800 group-hover:text-amber-800 transition-colors line-clamp-1">{r.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── BookmarkButton ───────────────────────────────────────────────────────────

interface BookmarkButtonProps {
  type: BookmarkType;
  id: string;
  title: string;
  slug: string;
  className?: string;
}

export function BookmarkButton({ type, id, title, slug, className }: BookmarkButtonProps) {
  const { mounted, isBookmarked, toggleBookmark } = useLibraryPrefs();

  if (!mounted) return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-400 text-sm ${className ?? ''}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      Kaydet
    </div>
  );

  const saved = isBookmarked(type, id);

  return (
    <button
      onClick={() => void toggleBookmark(type, { id, title, slug })}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
        saved
          ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
          : 'bg-white border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50'
      } ${className ?? ''}`}
    >
      <svg className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      {saved ? 'Kaydedildi' : 'Kaydet'}
    </button>
  );
}

// ─── FollowButton (mevzuat takip) ────────────────────────────────────────────

interface FollowButtonProps {
  regulationSlug: string;
  className?: string;
}

export function FollowButton({ regulationSlug, className }: FollowButtonProps) {
  const { user, isLoading } = useSahneAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user || isLoading) return;
    void fetch(`${API}/api/v1/library/me/follows`, { credentials: 'include' })
      .then(r => r.ok ? r.json() as Promise<{ follows: string[] }> : null)
      .then(data => { if (data) setFollowing(data.follows.includes(regulationSlug)); })
      .catch(() => {});
  }, [user, isLoading, regulationSlug]);

  if (!mounted || isLoading) return null;

  if (!user) {
    return (
      <a
        href={`${MUTFAK_URL}/giris`}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-medium hover:bg-rose-100 transition-colors ${className ?? ''}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Takibe Almak için Giriş Yap
      </a>
    );
  }

  const toggle = async () => {
    setLoading(true);
    try {
      const method = following ? 'DELETE' : 'POST';
      const res = await fetch(`${API}/api/v1/library/regulations/${regulationSlug}/follow`, {
        method, credentials: 'include',
      });
      if (res.ok) setFollowing(f => !f);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  return (
    <button
      onClick={() => void toggle()}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-60 ${
        following
          ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
          : 'bg-white border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50'
      } ${className ?? ''}`}
    >
      <svg className="w-4 h-4" fill={following ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {following ? 'Takiptesiniz' : 'Takibe Al'}
    </button>
  );
}

// ─── CommentSection ──────────────────────────────────────────────────────────

interface Comment {
  id: string;
  body: string;
  is_pinned: boolean;
  parent_id: string | null;
  created_at: string;
  user: { id: string; display_name: string };
}

interface CommentSectionProps {
  contentType: 'term' | 'guide' | 'regulation' | 'document';
  contentId: string;
  hideHeader?: boolean;
}

export function CommentSection({ contentType, contentId, hideHeader }: CommentSectionProps) {
  const { user, isLoading } = useSahneAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`${API}/api/v1/library/comments?contentType=${contentType}&contentId=${contentId}`);
      if (res.ok) setComments(await res.json() as Comment[]);
    } catch { /* ignore */ } finally { setLoadingComments(false); }
  }, [contentType, contentId]);

  useEffect(() => { void loadComments(); }, [loadComments]);

  const submit = async () => {
    const trimmed = body.trim();
    if (trimmed.length < 3) { setError('En az 3 karakter yazın.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/v1/library/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, contentId, body: trimmed }),
      });
      if (res.ok) { setBody(''); await loadComments(); }
      else setError('Yorum gönderilemedi.');
    } catch { setError('Bağlantı hatası.'); } finally { setSubmitting(false); }
  };

  const deleteComment = async (id: string) => {
    try {
      await fetch(`${API}/api/v1/library/comments/${id}`, { method: 'DELETE', credentials: 'include' });
      setComments(prev => prev.filter(c => c.id !== id));
    } catch { /* ignore */ }
  };

  const pinned = comments.filter(c => c.is_pinned);
  const regular = comments.filter(c => !c.is_pinned);
  const sorted = [...pinned, ...regular];

  const displayComments = sorted;

  return (
    <div className="bg-white rounded-2xl border border-[#e9eaec] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
      {!hideHeader && (
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-[30px] h-[30px] rounded-lg bg-[#0b1829] flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-[13px] font-black text-[#0b1829]">Yorumlar</h3>
              {displayComments.length > 0 && (
                <span className="text-[11px] font-semibold text-gray-400">{displayComments.length}</span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Topluluk üyelerinin yorumları</p>
          </div>
          {!isLoading && !user && (
            <a href={`${MUTFAK_URL}/giris`}
              className="inline-flex items-center gap-2 text-[12px] font-bold text-white hover:opacity-90 rounded-xl px-4 py-2 transition-all shrink-0"
              style={{ background: '#0b1829' }}
            >
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Yorum Yap
            </a>
          )}
        </div>
      )}

      {loadingComments && (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loadingComments && displayComments.length === 0 && (
        <div className="text-center py-5">
          <p className="text-sm text-gray-400">Henüz yorum yok. İlk yorumu siz yapın!</p>
        </div>
      )}

      {!loadingComments && displayComments.length > 0 && (
        <div className="space-y-0 mb-5 divide-y divide-[#f0f1f3]">
          {displayComments.map((c, idx) => {
            const initials = c.user.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const AVATAR_COLORS = [
              { bg: '#0b1829', text: '#F59E0B' },
              { bg: '#1a3a5c', text: '#fff' },
              { bg: '#1e3a5f', text: '#60a5fa' },
              { bg: '#3b0764', text: '#e879f9' },
            ];
            const ac = AVATAR_COLORS[idx % AVATAR_COLORS.length]!;
            return (
              <div key={c.id} className={`py-4 ${idx === 0 ? 'pt-1' : ''}`}>
                <div className="flex gap-3">
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: ac.bg, color: ac.text, fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, letterSpacing: '0.02em' }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#0b1829]">{c.user.display_name}</span>
                        {c.is_pinned && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">Sabitlendi</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-gray-400">
                          {new Date(c.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </span>
                        {user?.id === c.user.id && (
                          <button onClick={() => void deleteComment(c.id)}
                            className="text-gray-300 hover:text-rose-400 transition-colors text-xs" title="Sil">
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[13px] text-gray-600 leading-[1.65]">{c.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {user && (
        <div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={3}
            placeholder="Görüşünüzü paylaşın…"
            className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-3 resize-none focus:outline-none focus:border-[#26496b]/50 placeholder-gray-400"
            maxLength={2000}
          />
          {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-gray-300">{body.length}/2000</span>
            <button
              onClick={() => void submit()}
              disabled={submitting || body.trim().length < 3}
              className="px-4 py-1.5 bg-[#26496b] text-white text-xs font-semibold rounded-lg hover:bg-[#1a3350] disabled:opacity-40 transition-colors"
            >
              {submitting ? 'Gönderiliyor…' : 'Yorum Yap'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ReadingListButton ────────────────────────────────────────────────────────

interface ReadingListButtonProps {
  contentType: 'term' | 'guide' | 'regulation' | 'document';
  contentId: string;
  title: string;
  slug: string;
  className?: string;
}

export function ReadingListButton({ contentType, contentId, title, slug, className }: ReadingListButtonProps) {
  const { user, isLoading } = useSahneAuth();
  const [inList, setInList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user || isLoading) return;
    void fetch(`${API}/api/v1/library/me/reading-list`, { credentials: 'include' })
      .then(r => r.ok ? r.json() as Promise<{ content_type: string; content_id: string }[]> : null)
      .then(data => {
        if (data) setInList(data.some(i => i.content_type === contentType && i.content_id === contentId));
      })
      .catch(() => {});
  }, [user, isLoading, contentType, contentId]);

  if (!mounted || isLoading || !user) return null;

  const toggle = async () => {
    setLoading(true);
    try {
      if (inList) {
        const res = await fetch(`${API}/api/v1/library/me/reading-list/${contentType}/${contentId}`, {
          method: 'DELETE', credentials: 'include',
        });
        if (res.ok) setInList(false);
      } else {
        const res = await fetch(`${API}/api/v1/library/me/reading-list`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType, contentId, title, slug }),
        });
        if (res.ok) setInList(true);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  return (
    <button
      onClick={() => void toggle()}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-50 ${
        inList
          ? 'bg-sky-50 border-sky-300 text-sky-700 hover:bg-sky-100'
          : 'bg-white border-gray-200 text-gray-600 hover:border-sky-300 hover:text-sky-700 hover:bg-sky-50'
      } ${className ?? ''}`}
    >
      <svg className="w-4 h-4" fill={inList ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      {inList ? 'Listede' : 'Okuma Listesine Ekle'}
    </button>
  );
}

// ─── ProgressButton ──────────────────────────────────────────────────────────

interface ProgressButtonProps {
  contentType: 'term' | 'guide' | 'regulation' | 'document';
  contentId: string;
  className?: string;
}

export function ProgressButton({ contentType, contentId, className }: ProgressButtonProps) {
  const { user, isLoading } = useSahneAuth();
  const [learned, setLearned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user || isLoading) return;
    void fetch(`${API}/api/v1/library/me/progress?contentType=${contentType}&contentId=${contentId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() as Promise<{ learned: boolean }> : null)
      .then(data => { if (data) setLearned(data.learned); })
      .catch(() => {});
  }, [user, isLoading, contentType, contentId]);

  if (!mounted || isLoading || !user) return null;

  const toggle = async () => {
    setLoading(true);
    try {
      if (learned) {
        const res = await fetch(`${API}/api/v1/library/me/progress/${contentType}/${contentId}`, {
          method: 'DELETE', credentials: 'include',
        });
        if (res.ok) setLearned(false);
      } else {
        const res = await fetch(`${API}/api/v1/library/me/progress`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType, contentId }),
        });
        if (res.ok) setLearned(true);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  return (
    <button
      onClick={() => void toggle()}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-50 ${
        learned
          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
          : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50'
      } ${className ?? ''}`}
    >
      <svg className="w-4 h-4" fill={learned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {learned ? 'Öğrenildi' : 'Öğrendim'}
    </button>
  );
}

// ─── SuggestionModal ──────────────────────────────────────────────────────────

interface SuggestionModalProps {
  contentType: 'term' | 'guide' | 'regulation' | 'document';
  contentId: string;
  className?: string;
}

export function SuggestionButton({ contentType, contentId, className }: SuggestionModalProps) {
  const { user, isLoading } = useSahneAuth();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  if (isLoading || !user) return null;

  const submit = async () => {
    const trimmed = body.trim();
    if (trimmed.length < 10) { setError('En az 10 karakter yazın.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/v1/library/suggestions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, contentId, body: trimmed }),
      });
      if (res.ok) { setSent(true); setBody(''); setTimeout(() => { setOpen(false); setSent(false); }, 2000); }
      else setError('Gönderilemedi, lütfen tekrar deneyin.');
    } catch { setError('Bağlantı hatası.'); } finally { setSubmitting(false); }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition-all ${className ?? ''}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Düzenleme Öner
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">Düzenleme Öner</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {sent ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-800">Öneriniz alındı!</p>
                <p className="text-xs text-gray-400 mt-1">Ekibimiz inceleyecek, teşekkürler.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-3">Bu içerikte hata, eksik veya güncel olmayan bilgi mi var? Açıklayın.</p>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={5}
                  placeholder="Önerinizi buraya yazın… (en az 10, en fazla 3000 karakter)"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-3 resize-none focus:outline-none focus:border-violet-400 placeholder-gray-400"
                  maxLength={3000}
                />
                {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[11px] text-gray-300">{body.length}/3000</span>
                  <div className="flex gap-2">
                    <button onClick={() => setOpen(false)} className="px-4 py-1.5 text-gray-500 text-xs font-medium hover:text-gray-700 transition-colors">
                      İptal
                    </button>
                    <button
                      onClick={() => void submit()}
                      disabled={submitting || body.trim().length < 10}
                      className="px-4 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-40 transition-colors"
                    >
                      {submitting ? 'Gönderiliyor…' : 'Gönder'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── ExamQuestionsSection ─────────────────────────────────────────────────────

export interface ExamQuestion {
  id: string; questionText: string;
  optionA: string; optionB: string; optionC: string; optionD: string; optionE: string | null;
  correctOption: string; explanation: string | null;
  difficulty: string; source: string | null;
  categoryName: string; categorySlug: string; examType: string;
}

const DIFF_LABELS: Record<string, string> = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };
const DIFF_COLORS: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
};
const EXAM_TYPE_LABELS: Record<string, string> = {
  kpss: 'KPSS', uzmanlik: 'Uzmanlık', deger: 'Değerleme', cbs: 'CBS', diger: 'Diğer',
};

function ExamQuestionCard({ q }: { q: ExamQuestion }) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;
  const options = [
    { key: 'a', text: q.optionA },
    { key: 'b', text: q.optionB },
    { key: 'c', text: q.optionC },
    { key: 'd', text: q.optionD },
    ...(q.optionE ? [{ key: 'e', text: q.optionE }] : []),
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${DIFF_COLORS[q.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>
          {DIFF_LABELS[q.difficulty] ?? q.difficulty}
        </span>
        <span className="text-[10px] font-bold bg-[#26496b]/10 text-[#26496b] px-2 py-0.5 rounded-md">
          {EXAM_TYPE_LABELS[q.examType] ?? q.examType}
        </span>
        <span className="text-[10px] text-gray-400">{q.categoryName}</span>
        {q.source && <span className="text-[10px] text-gray-400">· {q.source}</span>}
      </div>
      <p className="text-sm font-medium text-gray-800 mb-3 leading-relaxed">{q.questionText}</p>
      <div className="space-y-1.5">
        {options.map(opt => {
          const isCorrect = opt.key === q.correctOption;
          const isSelected = selected === opt.key;
          let cls = 'border-gray-200 text-gray-700 hover:border-[#26496b]/40';
          if (answered) {
            if (isCorrect) cls = 'border-emerald-400 bg-emerald-50 text-emerald-800 font-semibold';
            else if (isSelected) cls = 'border-red-300 bg-red-50 text-red-700';
            else cls = 'border-gray-100 text-gray-400';
          }
          return (
            <button key={opt.key} onClick={() => !answered && setSelected(opt.key)} disabled={answered}
              className={`w-full text-left flex items-start gap-2.5 border rounded-lg px-3 py-2 text-sm transition-all ${cls} disabled:cursor-default`}>
              <span className="shrink-0 w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold mt-0.5">
                {opt.key.toUpperCase()}
              </span>
              <span className="flex-1 leading-snug">{opt.text}</span>
              {answered && isCorrect && (
                <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      {answered && q.explanation && (
        <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
          <p className="text-xs font-bold text-blue-700 mb-1">Açıklama</p>
          <p className="text-xs text-blue-800 leading-relaxed">{q.explanation}</p>
        </div>
      )}
      {answered && (
        <button onClick={() => setSelected(null)} className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
          Tekrar dene
        </button>
      )}
    </div>
  );
}

export function ExamQuestionsSection({ questions }: { questions: ExamQuestion[] }) {
  return (
    <div className="bg-[#26496b]/5 border border-[#26496b]/15 rounded-2xl p-6 mt-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-[#26496b]/10 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-[#26496b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-[#26496b]">Bu Terimle İlgili Sınav Soruları</h2>
        <span className="text-xs bg-[#26496b]/10 text-[#26496b] font-bold px-2 py-0.5 rounded-full">{questions.length}</span>
      </div>
      <div className="space-y-4">
        {questions.map(q => <ExamQuestionCard key={q.id} q={q} />)}
      </div>
    </div>
  );
}

// ─── HelpfulButton ────────────────────────────────────────────────────────────

export function HelpfulButton({ slug }: { slug: string }) {
  const [state, setState] = useState<'idle' | 'yes' | 'no'>('idle');
  const [mounted, setMounted] = useState(false);
  const storageKey = `hi_helpful_${slug}`;

  useEffect(() => {
    setMounted(true);
    try {
      const v = localStorage.getItem(storageKey);
      if (v === 'yes') setState('yes');
      else if (v === 'no') setState('no');
    } catch { /* ignore */ }
  }, [storageKey]);

  const vote = (v: 'yes' | 'no') => {
    try {
      if (state === v) { localStorage.removeItem(storageKey); setState('idle'); }
      else { localStorage.setItem(storageKey, v); setState(v); }
    } catch { /* ignore */ }
  };

  if (!mounted) return null;

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8e9ec', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 0' }}>
        <p style={{ fontSize: 11, fontWeight: 900, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Bu Rehber Yardımcı Oldu mu?</p>
      </div>
      <div style={{ padding: '0 16px 14px' }}>
        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>Görüşlerinizi bizimle paylaşın.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => vote('yes')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 12px', borderRadius: 10, border: `1px solid ${state === 'yes' ? '#86efac' : '#e5e7eb'}`,
              background: state === 'yes' ? '#f0fdf4' : '#fff',
              color: state === 'yes' ? '#15803d' : '#374151',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            👍 Evet
          </button>
          <button
            onClick={() => vote('no')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 12px', borderRadius: 10, border: `1px solid ${state === 'no' ? '#fca5a5' : '#e5e7eb'}`,
              background: state === 'no' ? '#fff1f2' : '#fff',
              color: state === 'no' ? '#b91c1c' : '#374151',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            👎 Hayır
          </button>
        </div>
        {state !== 'idle' && (
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
            {state === 'yes' ? 'Geri bildiriminiz için teşekkürler!' : 'Geliştirilmesi için not aldık.'}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── ContextualAICard ─────────────────────────────────────────────────────────

interface ContextualAICardProps {
  contentType: 'term' | 'guide' | 'regulation';
  title: string;
  slug: string;
}

const CONTEXTUAL_QUESTIONS: Record<string, string[]> = {
  term: [
    'Bu terimi basit bir örnekle açıkla',
    'Bu terimin pratikte kullanımı nasıldır?',
    'Bu terimle sıklıkla karıştırılan kavramlar nelerdir?',
  ],
  guide: [
    'Bu rehberin önemli noktalarını özetle',
    'Bu konuda hangi araçlar kullanılır?',
    'Bu alanda kariyer yapmak için ne gerekir?',
  ],
  regulation: [
    'Bu mevzuatın pratikte etkisi nedir?',
    'Bu düzenlemeye kimler uymak zorunda?',
    'Bu mevzuatta son değişiklikler neler?',
  ],
};

const TYPE_LABEL: Record<string, string> = {
  term: 'terim', guide: 'rehber', regulation: 'mevzuat',
};

export function ContextualAICard({ contentType, title, slug }: ContextualAICardProps) {
  const questions = CONTEXTUAL_QUESTIONS[contentType] ?? [];
  const aiUrl = (q: string) =>
    `/kutuphane/ai?question=${encodeURIComponent(q + ' (' + title + ')') }&title=${encodeURIComponent(title)}&type=${contentType}&slug=${encodeURIComponent(slug)}`;

  return (
    <div className="bg-gradient-to-br from-[#26496b]/5 to-[#26496b]/10 rounded-2xl border border-[#26496b]/15 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-[#26496b]/15 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-[#26496b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <p className="text-xs font-bold text-[#26496b]">Bu {TYPE_LABEL[contentType] ?? 'içerik'} hakkında AI&apos;ya sor</p>
      </div>
      <div className="space-y-1.5 mb-3">
        {questions.map(q => (
          <a
            key={q}
            href={aiUrl(q)}
            className="flex items-center gap-2 text-xs text-[#26496b]/80 bg-white/70 border border-[#26496b]/10 rounded-xl px-3 py-2 hover:bg-white hover:border-[#26496b]/30 hover:text-[#26496b] transition-all"
          >
            <svg className="w-3 h-3 shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {q}
          </a>
        ))}
      </div>
      <a
        href={`/kutuphane/ai?title=${encodeURIComponent(title)}&type=${contentType}&slug=${encodeURIComponent(slug)}`}
        className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#26496b] bg-white border border-[#26496b]/20 rounded-xl py-2 hover:bg-[#26496b] hover:text-white hover:border-[#26496b] transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Kendi soruyu sor →
      </a>
    </div>
  );
}

// ─── RelatedEventsCard ────────────────────────────────────────────────────────

interface RelatedEvent { id: string; slug: string; title: string; dateStart: string; type: string }

export function RelatedEventsCard({ fields }: { fields?: string[] }) {
  const [events, setEvents] = useState<RelatedEvent[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    void fetch(`${API}/api/v1/cms/events?limit=4`)
      .then(r => r.ok ? r.json() as Promise<RelatedEvent[]> : [])
      .then(all => {
        const now = Date.now();
        const upcoming = (Array.isArray(all) ? all : [])
          .filter(e => new Date(e.dateStart).getTime() > now)
          .slice(0, 3);
        setEvents(upcoming);
      })
      .catch(() => {});
  }, []);

  if (!mounted || events.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-xs font-bold text-gray-700">Yaklaşan Etkinlikler</p>
      </div>
      <div className="space-y-2">
        {events.map(ev => {
          const d = new Date(ev.dateStart);
          const day = d.getDate();
          const month = d.toLocaleDateString('tr-TR', { month: 'short' });
          return (
            <a
              key={ev.id}
              href={`/etkinlikler/${ev.slug}`}
              className="flex items-center gap-2.5 group hover:bg-sky-50 rounded-xl p-2 -mx-2 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-sky-100 flex flex-col items-center justify-center shrink-0 leading-none">
                <span className="text-[9px] font-bold text-sky-600 uppercase">{month}</span>
                <span className="text-sm font-black text-sky-800">{day}</span>
              </div>
              <p className="text-xs font-medium text-gray-700 group-hover:text-sky-700 transition-colors line-clamp-2 leading-snug">
                {ev.title}
              </p>
            </a>
          );
        })}
      </div>
      <a href="/etkinlikler" className="block mt-3 text-center text-xs text-sky-600 font-semibold hover:underline">
        Tüm etkinlikler →
      </a>
    </div>
  );
}

// ─── AuthorCard ───────────────────────────────────────────────────────────────

interface AuthorProfile {
  id: string; displayName: string | null; avatarUrl: string | null;
  bio: string | null; city: string | null; profession: string | null;
}

export function AuthorCard({ guideSlug }: { guideSlug: string }) {
  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    void fetch(`${API}/api/v1/library/guides/${guideSlug}/author`)
      .then(r => r.ok ? r.json() as Promise<AuthorProfile> : null)
      .then(data => { if (data) setAuthor(data); })
      .catch(() => {});
  }, [guideSlug]);

  if (!mounted || !author) return null;

  const initials = (author.displayName ?? '?')
    .split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Yazar</p>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#26496b]/10 flex items-center justify-center shrink-0 overflow-hidden">
          {author.avatarUrl
            ? <img src={author.avatarUrl} alt={author.displayName ?? ''} className="w-full h-full object-cover" />
            : <span className="text-sm font-bold text-[#26496b]">{initials}</span>
          }
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{author.displayName ?? 'Yazar'}</p>
          {author.profession && <p className="text-xs text-gray-400">{author.profession}</p>}
          {author.city && !author.profession && <p className="text-xs text-gray-400">{author.city}</p>}
        </div>
      </div>
      {author.bio && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{author.bio}</p>
      )}
    </div>
  );
}

// ─── PathProgressButton ───────────────────────────────────────────────────────

interface PathProgressButtonProps {
  pathSlug: string;
  stepIndex: number;
  completedSteps: number[];
  onToggle: (stepIndex: number, done: boolean) => void;
}

export function PathProgressButton({ pathSlug, stepIndex, completedSteps, onToggle }: PathProgressButtonProps) {
  const { user } = useSahneAuth();
  const [loading, setLoading] = useState(false);
  const done = completedSteps.includes(stepIndex);

  if (!user) return null;

  const toggle = async () => {
    setLoading(true);
    try {
      const method = done ? 'DELETE' : 'POST';
      const res = await fetch(`${API}/api/v1/library/me/path-progress/${pathSlug}/${stepIndex}`, {
        method,
        credentials: 'include',
      });
      if (res.ok) onToggle(stepIndex, !done);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  return (
    <button
      onClick={() => void toggle()}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-50 ${
        done
          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
          : 'bg-white border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50'
      }`}
    >
      <svg className="w-3.5 h-3.5" fill={done ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {done ? 'Tamamlandı' : 'Tamamla'}
    </button>
  );
}

// ─── SourceLevelBadge (#7 İçerik Güven Skoru) ────────────────────────────────

const SOURCE_LEVEL_CONFIG: Record<string, { label: string; cls: string; icon: string }> = {
  resmi:    { label: 'Resmi Kaynak',    cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: '🏛️' },
  akademik: { label: 'Akademik',        cls: 'bg-blue-100 text-blue-800 border-blue-200',          icon: '🎓' },
  uzman:    { label: 'Uzman İncelemesi',cls: 'bg-violet-100 text-violet-800 border-violet-200',    icon: '✅' },
  topluluk: { label: 'Topluluk',        cls: 'bg-amber-100 text-amber-800 border-amber-200',       icon: '👥' },
};

export function SourceLevelBadge({ sourceLevel }: { sourceLevel: string | null | undefined }) {
  if (!sourceLevel) return null;
  const cfg = SOURCE_LEVEL_CONFIG[sourceLevel];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ─── LevelBadge (#1 Seviye Sistemi) ──────────────────────────────────────────

const LEVEL_CONFIG: Record<string, { label: string; cls: string }> = {
  beginner:     { label: 'Başlangıç', cls: 'bg-sky-100 text-sky-700' },
  intermediate: { label: 'Orta',      cls: 'bg-orange-100 text-orange-700' },
  advanced:     { label: 'İleri',     cls: 'bg-rose-100 text-rose-700' },
};

export function LevelBadge({ level }: { level: string | null | undefined }) {
  if (!level) return null;
  const cfg = LEVEL_CONFIG[level];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── PrerequisitesCard (#1 Önkoşullar) ───────────────────────────────────────

interface Prerequisite { termSlug: string; termTitle: string }

export function PrerequisitesCard({ prerequisites }: { prerequisites?: Prerequisite[] }) {
  if (!prerequisites?.length) return null;
  return (
    <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 mb-4">
      <p className="text-xs font-bold text-sky-700 mb-2">Önce Bunları Öğren</p>
      <div className="flex flex-wrap gap-2">
        {prerequisites.map(p => (
          <a
            key={p.termSlug}
            href={`/kutuphane/sozluk/${p.termSlug}`}
            className="text-xs font-medium text-sky-800 bg-white border border-sky-200 rounded-lg px-2.5 py-1 hover:border-sky-400 hover:bg-sky-100 transition-colors"
          >
            {p.termTitle} →
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── ContributorsCard (#6 Uzman Katkı) ───────────────────────────────────────

interface Contributor { name: string; role?: string; userId?: string }

export function ContributorsCard({ contributors }: { contributors?: Contributor[] }) {
  if (!contributors?.length) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Katkıda Bulunanlar</p>
      <div className="space-y-2">
        {contributors.map((c, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-violet-700">
                {c.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">{c.name}</p>
              {c.role && <p className="text-[10px] text-gray-400">{c.role}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── UserBadgesCard (#5 Rozet Sistemi) ───────────────────────────────────────

interface Badge { badgeType: string; awardedAt: string }

const BADGE_DEFS: Record<string, { label: string; emoji: string; desc: string }> = {
  library_reader_10:    { emoji: '📖', label: '10 İçerik',        desc: '10 kütüphane içeriği incelendi' },
  library_reader_50:    { emoji: '📚', label: '50 İçerik',        desc: '50 kütüphane içeriği incelendi' },
  library_reader_100:   { emoji: '🏆', label: '100 İçerik',       desc: '100 kütüphane içeriği incelendi' },
  exam_first_attempt:   { emoji: '🎯', label: 'İlk Sınav',        desc: 'İlk sınav denemesi tamamlandı' },
};

export function UserBadgesCard() {
  const { user, isLoading } = useSahneAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user || isLoading) return;
    void fetch(`${API}/api/v1/library/me/badges`, { credentials: 'include' })
      .then(r => r.ok ? r.json() as Promise<Badge[]> : [])
      .then(data => setBadges(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [user, isLoading]);

  if (!mounted || isLoading || !user || badges.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
      <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">Rozetlerim</p>
      <div className="flex flex-wrap gap-2">
        {badges.map(b => {
          const def = BADGE_DEFS[b.badgeType];
          if (!def) return null;
          return (
            <div key={b.badgeType} title={def.desc}
              className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1.5">
              <span className="text-base">{def.emoji}</span>
              <span className="text-[10px] font-bold text-amber-800">{def.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── KnowledgeGraphCard (#4 Bilgi Haritası) ──────────────────────────────────

interface GraphData {
  center: { id: string; slug: string | null; term: string; fields: string[] };
  relatedTerms: { id: string; slug: string | null; term: string; fields: string[] }[];
  relatedRegulations: { id: string; slug: string; title: string; short_title: string | null; type: string }[];
}

export function KnowledgeGraphCard({ termSlug }: { termSlug: string }) {
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    void fetch(`${API}/api/v1/library/terms/slug/${encodeURIComponent(termSlug)}/graph`)
      .then(r => r.ok ? r.json() as Promise<GraphData> : null)
      .then(data => { if (data) setGraph(data); })
      .catch(() => {});
  }, [termSlug]);

  if (!mounted || !graph) return null;
  if (graph.relatedTerms.length === 0 && graph.relatedRegulations.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bilgi Haritası</p>
      {graph.relatedTerms.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold text-violet-500 mb-1.5">İlgili Terimler</p>
          <div className="flex flex-wrap gap-1.5">
            {graph.relatedTerms.map(t => (
              <a key={t.id} href={`/kutuphane/sozluk/${t.slug ?? ''}`}
                className="text-[11px] font-medium text-violet-700 bg-violet-50 border border-violet-100 rounded-lg px-2 py-0.5 hover:bg-violet-100 hover:border-violet-300 transition-colors">
                {t.term}
              </a>
            ))}
          </div>
        </div>
      )}
      {graph.relatedRegulations.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-rose-500 mb-1.5">İlgili Mevzuat</p>
          <div className="flex flex-wrap gap-1.5">
            {graph.relatedRegulations.map(r => (
              <a key={r.id} href={`/kutuphane/mevzuat/${r.slug}`}
                className="text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-2 py-0.5 hover:bg-rose-100 hover:border-rose-300 transition-colors">
                {r.short_title ?? r.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ExamAuthGate (#3 Üyelik Gaiting) ────────────────────────────────────────

export function ExamAuthGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useSahneAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted || isLoading) return <>{children}</>;

  if (!user) {
    return (
      <div className="bg-gradient-to-br from-[#0c1a2e] to-[#26496b] rounded-2xl p-6 text-white text-center mt-8">
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <p className="text-sm font-bold mb-1">Sınava girmek için üye olun</p>
        <p className="text-xs text-white/70 mb-4">Sonuçlarınız kayıt altına alınır, gelişiminizi takip edin.</p>
        <a href="/uye-ol" className="block text-xs font-bold text-[#26496b] bg-white rounded-xl px-4 py-2 hover:bg-white/90 transition-colors mb-2">
          Ücretsiz Üye Ol →
        </a>
        <a href={`${MUTFAK_URL}/giris`} className="block text-xs text-white/60 hover:text-white/90 transition-colors">
          Zaten üyeyim, giriş yap
        </a>
      </div>
    );
  }

  return <>{children}</>;
}

// ─── MembershipCTACard ────────────────────────────────────────────────────────

export function MembershipCTACard() {
  const { user, isLoading } = useSahneAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted || isLoading) return null;

  if (user) {
    return (
      <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
        <p className="text-xs font-bold text-emerald-800 mb-2">Topluluğa Taşı</p>
        <p className="text-xs text-emerald-700 mb-3 leading-relaxed">Bu içeriği Mutfak&apos;ta paylaş, tartış, geliştir.</p>
        <a
          href={MUTFAK_URL}
          className="block text-center text-xs font-semibold text-emerald-700 bg-white border border-emerald-200 rounded-xl px-3 py-2 hover:bg-emerald-700 hover:text-white hover:border-emerald-700 transition-colors"
        >
          Mutfak&apos;a Git →
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#0c1a2e] to-[#26496b] rounded-2xl p-5 text-white">
      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center mb-3">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <p className="text-sm font-bold mb-1">Topluluğa Katıl</p>
      <ul className="text-xs text-white/70 space-y-0.5 mb-4">
        <li>✓ Kaydettiklerin her cihazda senkronize</li>
        <li>✓ Soru sor, tartışmalara katıl</li>
        <li>✓ Sınav simülasyonu ve ilerleme takibi</li>
      </ul>
      <a
        href="/uye-ol"
        className="block text-center text-xs font-bold text-[#26496b] bg-white rounded-xl px-3 py-2 hover:bg-white/90 transition-colors"
      >
        Ücretsiz Üye Ol →
      </a>
      <a href={`${MUTFAK_URL}/giris`} className="block text-center text-[10px] text-white/50 mt-2 hover:text-white/80 transition-colors">
        Zaten üyeyim, giriş yap
      </a>
    </div>
  );
}

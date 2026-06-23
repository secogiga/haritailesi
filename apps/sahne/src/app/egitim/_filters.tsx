'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import type { Training, LeaderboardEntry } from '@/lib/api';
import { EgitimGonderCTA } from '@/components/EgitimGonder';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

// ─── Renk haritaları ──────────────────────────────────────────────────────────

const LEVEL_PILL: Record<string, string> = {
  'Başlangıç': 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20',
  'Temel':     'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/20',
  'Orta':      'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20',
  'İleri':     'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/20',
};

const LEVEL_GRADIENT: Record<string, string> = {
  'Başlangıç': 'from-emerald-600 to-teal-500',
  'Temel':     'from-sky-600 to-blue-500',
  'Orta':      'from-amber-600 to-orange-500',
  'İleri':     'from-rose-600 to-pink-500',
};

function getLevelPill(level: string | null) {
  if (!level) return 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20';
  for (const [k, v] of Object.entries(LEVEL_PILL)) { if (level.includes(k)) return v; }
  return 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20';
}

function getLevelGrad(level: string | null) {
  if (!level) return 'from-slate-600 to-slate-500';
  for (const [k, v] of Object.entries(LEVEL_GRADIENT)) { if (level.includes(k)) return v; }
  return 'from-slate-600 to-slate-500';
}

// ─── Konu kategorileri (başlık + etiket + açıklamadan türetilir) ────────────────

const CATEGORIES: { key: string; kw: string[] }[] = [
  { key: 'Drone & Fotogrametri', kw: ['drone', 'iha', 'fotogrametri', 'nokta bulutu', 'lidar', 'metashape', 'uçuş', 'hava'] },
  { key: 'CBS / GIS', kw: ['cbs', 'gis', 'qgis', 'arcgis', 'mekansal', 'coğrafi bilgi', 'görselleştirme'] },
  { key: 'Geodezi & Koordinat', kw: ['geodezi', 'jeodezi', 'koordinat', 'itrf', 'utm', 'datum', 'gauss', 'projeksiyon', 'gnss', 'gps'] },
  { key: 'Kadastro & Tapu', kw: ['kadastro', 'tapu', 'parsel', 'mülkiyet', 'imar'] },
  { key: 'Ölçme & Arazi', kw: ['ölçme', 'arazi', 'total station', 'nivelman', 'aplikasyon'] },
  { key: 'Yazılım & Programlama', kw: ['python', 'yazılım', 'programlama', 'autocad', 'netcad', 'sql', 'kod'] },
];

function getCategory(c: Training): string {
  const hay = `${c.title} ${(c.tags ?? []).join(' ')} ${c.description ?? ''}`.toLocaleLowerCase('tr');
  for (const cat of CATEGORIES) if (cat.kw.some((k) => hay.includes(k))) return cat.key;
  return 'Diğer';
}

function parsePrice(p: string | null): number {
  if (!p) return 0;
  const n = parseInt(p.replace(/[^\d]/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
}

// Kapak görseli: '/...' veya 'http' ise doğrudan (public), değilse API media
function coverSrc(key: string): string {
  return key.startsWith('/') || key.startsWith('http')
    ? key
    : `${API_URL}/api/v1/media?key=${encodeURIComponent(key)}`;
}

// ─── Kurs Kartı ───────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: Training }) {
  const grad = getLevelGrad(course.level);
  const pill = getLevelPill(course.level);
  const isNew = course.startDate && new Date(course.startDate) > new Date();
  const daysUntil = isNew
    ? Math.ceil((new Date(course.startDate!).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <Link
      href={`/egitim/${course.slug}`}
      className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-[#26496b]/8 hover:-translate-y-1 transition-all duration-300"
    >
      <div className={`relative h-36 bg-gradient-to-br ${grad} overflow-hidden shrink-0`}>
        {course.coverImageKey ? (
          <>
            <img
              src={coverSrc(course.coverImageKey)}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 opacity-20">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
              <circle cx="80" cy="20" r="50" fill="white" />
              <circle cx="10" cy="85" r="35" fill="white" />
            </svg>
          </div>
        )}
        {course.certificateThreshold != null && (
          <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
            <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-[10px] font-bold text-gray-700 dark:text-slate-200">Sertifika</span>
          </div>
        )}
        {course.level && (
          <div className="absolute bottom-3 left-3">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${pill}`}>
              {course.level}
            </span>
          </div>
        )}
        {daysUntil !== null && daysUntil >= 0 && daysUntil <= 14 && (
          <div className="absolute bottom-3 right-3 bg-violet-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            {daysUntil === 0 ? 'Bugün!' : `${daysUntil}g sonra`}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4">
        {course.format && (
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#66aca9] dark:text-teal-400 mb-1.5">
            {course.format}
          </span>
        )}
        <h3 className="text-[15px] font-bold text-gray-900 dark:text-slate-100 leading-snug mb-2.5 group-hover:text-[#26496b] dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {course.title}
        </h3>
        {course.instructor && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#26496b] to-[#66aca9] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
              {course.instructor[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-gray-500 dark:text-slate-400 truncate">{course.instructor}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-slate-800 mt-auto">
          <div>
            {course.price ? (
              <div>
                <span className="text-sm font-black text-gray-900 dark:text-slate-100">{course.price}</span>
                {course.memberPrice && <div className="text-[10px] text-emerald-500 font-semibold">Üye: {course.memberPrice}</div>}
              </div>
            ) : (
              <div>
                <span className="text-sm font-black text-emerald-500">Ücretsiz</span>
                <div className="text-[10px] text-gray-400 dark:text-slate-500">üyeye özel</div>
              </div>
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-[#26496b]/8 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-[#26496b] dark:group-hover:bg-blue-600 transition-colors">
            <svg className="w-4 h-4 text-[#26496b] dark:text-blue-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Lider Tablosu ────────────────────────────────────────────────────────────

function LeaderboardSection({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Lider Tablosu</h3>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-slate-800">
        {entries.slice(0, 8).map((entry) => {
          const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;
          return (
            <div key={entry.userId} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
              <span className="text-xs font-black w-5 text-center shrink-0 tabular-nums text-gray-300 dark:text-slate-600">
                {medal ?? entry.rank}
              </span>
              {entry.avatarUrl ? (
                <img src={entry.avatarUrl} alt={entry.displayName ?? ''} className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-gray-100 dark:ring-slate-700" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#26496b] to-[#66aca9] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {(entry.displayName ?? '?')[0]?.toUpperCase()}
                </div>
              )}
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 truncate flex-1">{entry.displayName ?? 'Üye'}</p>
              <div className="text-right shrink-0">
                <span className="text-xs font-black text-[#26496b] dark:text-blue-400">{entry.completedCount}</span>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 ml-1">eğitim</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Ana Filtre Bileşeni ──────────────────────────────────────────────────────

type PriceFilter = 'all' | 'free' | 'paid';
type FormatFilter = 'all' | 'Online' | 'Yüz Yüze' | 'Hibrit';
type SortKey = 'onerilen' | 'populer' | 'yeni' | 'ucuz' | 'pahali';

const SORT_LABELS: Record<SortKey, string> = {
  onerilen: 'Önerilen',
  populer: 'En Popüler',
  yeni: 'En Yeni',
  ucuz: 'Fiyat: Artan',
  pahali: 'Fiyat: Azalan',
};

const PAGE_SIZE = 4;

export function CourseFilters({ courses, leaderboard }: { courses: Training[]; leaderboard: LeaderboardEntry[] }) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('onerilen');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const levels = [...new Set(courses.map(c => c.level).filter(Boolean))] as string[];
  const formats = [...new Set(courses.map(c => c.format).filter(Boolean))] as string[];

  // Konu kategorileri (mevcut + adet)
  const categories = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of courses) { const k = getCategory(c); m.set(k, (m.get(k) ?? 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [courses]);

  const filtered = useMemo(() => {
    const q = query.toLocaleLowerCase('tr');
    return courses.filter(c => {
      if (q && !`${c.title} ${c.description ?? ''} ${c.instructor ?? ''}`.toLocaleLowerCase('tr').includes(q)) return false;
      if (categoryFilter && getCategory(c) !== categoryFilter) return false;
      if (levelFilter && !c.level?.includes(levelFilter)) return false;
      if (priceFilter === 'free' && c.price) return false;
      if (priceFilter === 'paid' && !c.price) return false;
      if (formatFilter !== 'all' && c.format !== formatFilter) return false;
      if (tagFilter && !(c.tags ?? []).includes(tagFilter)) return false;
      return true;
    });
  }, [courses, query, categoryFilter, levelFilter, priceFilter, formatFilter, tagFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case 'populer': arr.sort((a, b) => b.enrollmentCount - a.enrollmentCount); break;
      case 'yeni': arr.sort((a, b) => new Date(b.startDate ?? 0).getTime() - new Date(a.startDate ?? 0).getTime()); break;
      case 'ucuz': arr.sort((a, b) => parsePrice(a.price) - parsePrice(b.price)); break;
      case 'pahali': arr.sort((a, b) => parsePrice(b.price) - parsePrice(a.price)); break;
    }
    return arr;
  }, [filtered, sortBy]);

  const activeCount = [query, categoryFilter, levelFilter, tagFilter,
    priceFilter !== 'all' ? '1' : '', formatFilter !== 'all' ? '1' : ''].filter(Boolean).length;
  const hasFilter = activeCount > 0;
  const showFeatured = activeCount === 0 && sortBy === 'onerilen';

  const featured = showFeatured ? sorted[0] : null;
  const list = showFeatured ? sorted.slice(1) : sorted;
  const visibleList = list.slice(0, visible);

  // Filtre/sıralama değişince başa sar
  useEffect(() => { setVisible(PAGE_SIZE); }, [query, categoryFilter, levelFilter, priceFilter, formatFilter, tagFilter, sortBy]);

  function clearAll() {
    setQuery(''); setCategoryFilter(''); setLevelFilter('');
    setPriceFilter('all'); setFormatFilter('all'); setTagFilter(''); setSortBy('onerilen');
  }

  const hasLeaderboard = leaderboard.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      {/* ── Filtre çubuğu (sticky, kompakt) ── */}
      <div className="sticky top-[68px] z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-100 dark:border-slate-800 rounded-2xl px-3 py-2.5 mb-6 shadow-sm space-y-2.5">
        {/* Üst satır: arama + sıralama + Filtreler */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 min-w-0">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Eğitim ara…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors cursor-pointer">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Sıralama */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortKey)}
            className="shrink-0 text-sm font-medium border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 cursor-pointer max-w-[120px] sm:max-w-none"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
              <option key={k} value={k}>{SORT_LABELS[k]}</option>
            ))}
          </select>

          {/* Filtreler (gelişmiş) toggle */}
          {(() => {
            const adv = [levelFilter, tagFilter, priceFilter !== 'all' ? '1' : '', formatFilter !== 'all' ? '1' : ''].filter(Boolean).length;
            return (
              <button
                onClick={() => setShowAdvanced(s => !s)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border transition-all ${
                  showAdvanced || adv > 0
                    ? 'bg-[#26496b] text-white border-[#26496b]'
                    : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-gray-300'
                }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 10h12M10 16h4" />
                </svg>
                <span className="hidden sm:inline">Filtreler</span>
                {adv > 0 && <span className="ml-0.5 text-[10px] font-bold bg-white text-[#26496b] rounded-full w-4 h-4 flex items-center justify-center">{adv}</span>}
              </button>
            );
          })()}
        </div>

        {/* Kategori şeridi — tek sıra, yatay kaydırma */}
        {categories.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setCategoryFilter('')}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${
                categoryFilter === ''
                  ? 'bg-[#26496b] text-white border-[#26496b] shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-gray-300'
              }`}>
              Tüm Konular
            </button>
            {categories.map(([cat, n]) => (
              <button key={cat}
                onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)}
                className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-[#26496b] text-white border-[#26496b] shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-gray-300'
                }`}>
                {cat} <span className="opacity-60">{n}</span>
              </button>
            ))}
          </div>
        )}

        {/* Gelişmiş filtreler — sadece açıkken */}
        {showAdvanced && (
          <div className="flex flex-wrap gap-2.5 items-center pt-2.5 border-t border-gray-100 dark:border-slate-800">
            {levels.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {['', ...levels].map(lvl => (
                  <button key={lvl}
                    onClick={() => setLevelFilter(lvl)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                      levelFilter === lvl
                        ? 'bg-[#66aca9] text-white border-[#66aca9] shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-gray-300'
                    }`}>
                    {lvl || 'Tüm Seviyeler'}
                  </button>
                ))}
              </div>
            )}
            {formats.length > 1 && (
              <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
                {(['all', ...formats] as const).map(f => (
                  <button key={f}
                    onClick={() => setFormatFilter(f as FormatFilter)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      formatFilter === f
                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
                    }`}>
                    {f === 'all' ? 'Tümü' : f}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
              {([['all', 'Tümü'], ['free', 'Ücretsiz'], ['paid', 'Ücretli']] as const).map(([val, label]) => (
                <button key={val}
                  onClick={() => setPriceFilter(val)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    priceFilter === val
                      ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Sonuç sayısı + aktif filtreler + temizle ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-sm text-gray-500 dark:text-slate-400">
          <span className="font-bold text-gray-800 dark:text-slate-200">{filtered.length}</span> eğitim
          {hasFilter && <span className="text-gray-400 dark:text-slate-500"> · {activeCount} filtre aktif</span>}
        </p>
        <div className="flex items-center gap-2">
          {tagFilter && (
            <button onClick={() => setTagFilter('')}
              className="inline-flex items-center gap-1 text-xs font-semibold bg-[#26496b]/10 text-[#26496b] dark:text-blue-400 px-2.5 py-1 rounded-full hover:bg-[#26496b]/20 transition-colors">
              #{tagFilter}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
          {hasFilter && (
            <button onClick={clearAll}
              className="text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-[#26496b] dark:hover:text-blue-400 transition-colors">
              Filtreleri temizle
            </button>
          )}
        </div>
      </div>

      {/* ── Sonuçlar ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Sonuç bulunamadı</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">Farklı bir arama veya filtre deneyin.</p>
          {hasFilter && (
            <button onClick={clearAll} className="text-xs font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] px-4 py-2 rounded-xl transition-colors">
              Filtreleri temizle
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {/* Öne çıkan (sadece filtre yokken) */}
          {featured && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-[#26496b] to-[#66aca9] rounded-full" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">Öne Çıkan</h2>
              </div>
              <Link href={`/egitim/${featured.slug}`}
                className="group relative flex flex-col md:flex-row bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-[#26496b]/10 transition-all duration-300">
                <div className={`relative md:w-80 lg:w-96 shrink-0 min-h-[220px] bg-gradient-to-br ${getLevelGrad(featured.level)} overflow-hidden`}>
                  {featured.coverImageKey ? (
                    <>
                      <img src={coverSrc(featured.coverImageKey)} alt={featured.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 opacity-20">
                      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                        <circle cx="80" cy="20" r="50" fill="white" /><circle cx="10" cy="85" r="35" fill="white" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/95 dark:bg-slate-900/90 text-[#26496b] dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">Öne Çıkan</div>
                  {featured.level && <div className="absolute bottom-4 left-4"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${getLevelPill(featured.level)}`}>{featured.level}</span></div>}
                </div>
                <div className="flex flex-col flex-1 p-7 lg:p-8">
                  <h2 className="text-xl lg:text-2xl font-black text-gray-900 dark:text-slate-100 leading-tight mb-3 group-hover:text-[#26496b] dark:group-hover:text-blue-400 transition-colors">{featured.title}</h2>
                  {featured.description && <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-5 line-clamp-2 flex-1">{featured.description}</p>}
                  {featured.instructor && (
                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#26496b] to-[#66aca9] flex items-center justify-center text-white text-xs font-bold shrink-0">{featured.instructor[0]?.toUpperCase()}</div>
                      <span className="text-sm text-gray-600 dark:text-slate-400">{featured.instructor}{featured.instructorTitle && <span className="text-gray-400 dark:text-slate-500"> · {featured.instructorTitle}</span>}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-5 border-t border-gray-100 dark:border-slate-800 mt-auto">
                    <div>
                      {featured.price ? <span className="text-lg font-black text-gray-900 dark:text-slate-100">{featured.price}</span>
                        : <span className="text-lg font-black text-emerald-500">Ücretsiz</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-[#26496b] dark:text-blue-400 group-hover:gap-3 transition-all">
                      Eğitime Git <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Grid (+ Sidebar varsa) */}
          {list.length > 0 && (
            <div className={hasLeaderboard ? 'grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-10' : ''}>
              <div className={`${hasLeaderboard ? 'lg:col-span-3' : ''} space-y-5`}>
                {showFeatured && (
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-[#26496b] to-[#66aca9] rounded-full" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">
                      Tüm Eğitimler <span className="text-gray-300 dark:text-slate-600 font-normal normal-case tracking-normal">{courses.length} eğitim</span>
                    </h2>
                  </div>
                )}
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-5 ${hasLeaderboard ? 'xl:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-4'}`}>
                  {visibleList.map(c => <CourseCard key={c.id} course={c} />)}
                </div>

                {/* Daha fazla yükle */}
                {visible < list.length && (
                  <div className="flex flex-col items-center gap-2 pt-4">
                    <button onClick={() => setVisible(v => v + PAGE_SIZE)}
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#26496b] dark:text-blue-400 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-[#26496b] hover:shadow-sm transition-all">
                      Daha Fazla Yükle
                      <span className="text-xs text-gray-400">(+{list.length - visible})</span>
                    </button>
                    <span className="text-[11px] text-gray-400 dark:text-slate-500">{Math.min(visible, list.length)} / {list.length} gösteriliyor</span>
                  </div>
                )}
              </div>
              {hasLeaderboard && (
                <div className="lg:col-span-1 space-y-5">
                  <LeaderboardSection entries={leaderboard} />
                </div>
              )}
            </div>
          )}

          {/* Eğitim gönder CTA */}
          <EgitimGonderCTA />
        </div>
      )}
    </div>
  );
}

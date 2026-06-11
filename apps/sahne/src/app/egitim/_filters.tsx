'use client';

import { useState, useMemo } from 'react';
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

// ─── Kurs Kartı ───────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: Training }) {
  const tags: string[] = Array.isArray(course.tags) ? course.tags : [];
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
      <div className={`relative h-44 bg-gradient-to-br ${grad} overflow-hidden shrink-0`}>
        {course.coverImageKey ? (
          <>
            <img
              src={`${API_URL}/api/v1/media?key=${encodeURIComponent(course.coverImageKey)}`}
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

      <div className="flex flex-col flex-1 p-5">
        {course.format && (
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#66aca9] dark:text-teal-400 mb-2">
            {course.format}
          </span>
        )}
        <h3 className="text-[15px] font-bold text-gray-900 dark:text-slate-100 leading-snug mb-3 group-hover:text-[#26496b] dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4 flex-1">
            {course.description}
          </p>
        )}
        {course.instructor && (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#26496b] to-[#66aca9] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
              {course.instructor[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-gray-500 dark:text-slate-400 truncate">{course.instructor}</span>
          </div>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{tag}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-800 mt-auto">
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
                <span className="text-[10px] text-gray-400 dark:text-slate-500 ml-1">kurs</span>
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

export function CourseFilters({ courses, leaderboard }: { courses: Training[]; leaderboard: LeaderboardEntry[] }) {
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');

  const levels = [...new Set(courses.map(c => c.level).filter(Boolean))] as string[];
  const formats = [...new Set(courses.map(c => c.format).filter(Boolean))] as string[];

  const filtered = useMemo(() => {
    return courses.filter(c => {
      if (query && !c.title.toLowerCase().includes(query.toLowerCase()) &&
          !c.description?.toLowerCase().includes(query.toLowerCase()) &&
          !c.instructor?.toLowerCase().includes(query.toLowerCase())) return false;
      if (levelFilter && !c.level?.includes(levelFilter)) return false;
      if (priceFilter === 'free' && c.price) return false;
      if (priceFilter === 'paid' && !c.price) return false;
      if (formatFilter !== 'all' && c.format !== formatFilter) return false;
      return true;
    });
  }, [courses, query, levelFilter, priceFilter, formatFilter]);

  const hasFilter = query || levelFilter || priceFilter !== 'all' || formatFilter !== 'all';
  const featured = !hasFilter ? filtered[0] : null;
  const rest = !hasFilter ? filtered.slice(1) : filtered;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      {/* ── Filtre çubuğu ── */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 mb-10 shadow-sm flex flex-wrap gap-3 items-center">
        {/* Arama */}
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Eğitim ara."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
          />
          {hasFilter && (
            <button
              onClick={() => { setQuery(''); setLevelFilter(''); setPriceFilter('all'); setFormatFilter('all'); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors cursor-pointer">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Seviye */}
        {levels.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {['', ...levels].map(lvl => (
              <button key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  levelFilter === lvl
                    ? 'bg-[#26496b] text-white border-[#26496b] shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-gray-300'
                }`}>
                {lvl || 'Tüm Seviyeler'}
              </button>
            ))}
          </div>
        )}

        {/* Format */}
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

        {/* Fiyat */}
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

      {/* ── Sonuçlar ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Sonuç bulunamadı</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">Farklı bir arama veya filtre deneyin.</p>
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
                      <img src={`${API_URL}/api/v1/media?key=${encodeURIComponent(featured.coverImageKey)}`} alt={featured.title}
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
                      Kursa Git <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Grid + Sidebar */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-10">
              <div className="lg:col-span-3 space-y-5">
                {!hasFilter && (
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-[#26496b] to-[#66aca9] rounded-full" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">
                      Tüm Kurslar <span className="text-gray-300 dark:text-slate-600 font-normal normal-case tracking-normal">{courses.length} kurs</span>
                    </h2>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {rest.map(c => <CourseCard key={c.id} course={c} />)}
                </div>
              </div>
              <div className="lg:col-span-1 space-y-5">
                <LeaderboardSection entries={leaderboard} />
              </div>
            </div>
          )}

          {/* Eğitim gönder CTA */}
          <EgitimGonderCTA />

          {/* Filtre aktifken leaderboard aşağıda */}
          {hasFilter && leaderboard.length > 0 && (
            <div className="max-w-sm">
              <LeaderboardSection entries={leaderboard} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

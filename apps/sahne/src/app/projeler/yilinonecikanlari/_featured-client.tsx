'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CmsProject } from '@/lib/api';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
function mediaUrl(key: string) {
  return `${API_URL}/api/v1/media?key=${encodeURIComponent(key)}`;
}
function resolveKey(key: string): string {
  if (key.startsWith('/')) return encodeURI(key);
  if (key.startsWith('covers/')) return mediaUrl(key);
  return `/projects/${key}`;
}
function coverOf(p: CmsProject): string | null {
  if (p.coverImageKey) return resolveKey(p.coverImageKey);
  if (p.imageKeys?.[0]) return resolveKey(p.imageKeys[0]);
  return null;
}
function shortTitle(p: CmsProject) {
  return p.title.includes(' — ') ? p.title.split(' — ').slice(1).join(' — ') : p.title;
}

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

const RANK_STYLES = [
  { badge: 'bg-amber-500 text-white', label: '1. BİRİNCİ', border: 'border-amber-400/40' },
  { badge: 'bg-blue-500 text-white', label: '2. İKİNCİ', border: 'border-blue-400/40' },
  { badge: 'bg-orange-500 text-white', label: '3. ÜÇÜNCÜ', border: 'border-orange-400/40' },
];

// ── Aylık Kazananlar ────────────────────────────────────────────────────────

export function MonthlyWinners({ projects }: { projects: CmsProject[] }) {
  // En son ödüllü aya varsayılan olarak git
  const awardedMonths = Array.from(new Set(projects.map(p => p.awardCohortMonth).filter(Boolean))) as number[];
  const lastAwardMonth = awardedMonths.length > 0 ? Math.max(...awardedMonths) : new Date().getMonth() + 1;
  const [activeMonth, setActiveMonth] = useState(lastAwardMonth - 1); // 0-indexed

  function getMonthProjects(monthIdx: number): CmsProject[] {
    const cohortMonth = monthIdx + 1; // 1-indexed
    return projects
      .filter(p => p.awardCohortMonth === cohortMonth && p.awardRank != null)
      .sort((a, b) => (a.awardRank ?? 99) - (b.awardRank ?? 99))
      .slice(0, 3);
  }

  const monthProjects = getMonthProjects(activeMonth);

  return (
    <section className="py-14 bg-white dark:bg-[#0a1422]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Başlık */}
        <div className="flex items-center gap-3 mb-8">
          <svg className="w-5 h-5 text-[#26496b] dark:text-[#66aca9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 className="text-xl font-black text-gray-900 dark:text-slate-100">Aylık Kazananlar</h2>
        </div>

        {/* Ay tab'ları */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-2 mb-8">
          {MONTHS.map((m, i) => {
            const hasData = awardedMonths.includes(i + 1);
            return (
              <button
                key={i}
                onClick={() => setActiveMonth(i)}
                disabled={!hasData}
                className={`shrink-0 text-xs font-semibold px-4 py-2 rounded-full transition-all ${
                  activeMonth === i
                    ? 'bg-[#238179] text-white shadow-sm'
                    : hasData
                      ? 'text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-[#238179]/10 hover:text-[#238179]'
                      : 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                {m}
                {hasData && activeMonth !== i && (
                  <span className="ml-1 inline-block w-1 h-1 rounded-full bg-[#238179] align-middle" />
                )}
              </button>
            );
          })}
        </div>

        {/* 3 Proje */}
        {monthProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {monthProjects.map((p, i) => {
              const cover = coverOf(p);
              const style = RANK_STYLES[i]!;
              return (
                <Link key={p.id} href={`/projeler/${p.slug}`}
                  className={`group relative flex flex-col bg-[#0c1824] rounded-2xl border ${style.border} overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200`}>
                  {/* Kapak */}
                  <div className="relative h-44 overflow-hidden bg-slate-800">
                    {cover
                      ? <img src={cover} alt={shortTitle(p)} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                      : <div className={`h-full bg-gradient-to-br ${p.accentGradient ?? 'from-[#26496b] to-[#66aca9]'} opacity-30`} />
                    }
                    {/* Rank badge */}
                    <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full ${style.badge}`}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      {style.label}
                    </span>
                  </div>
                  {/* İçerik */}
                  <div className="p-4 flex flex-col gap-2.5 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[9px] font-bold shrink-0"
                        style={{ backgroundColor: p.authorAvatarColor ?? '#26496b' }}>
                        {p.authorInitials ?? p.authorName?.slice(0, 2).toUpperCase() ?? '?'}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{p.authorName}</p>
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-[#66aca9] transition-colors">
                      {shortTitle(p)}
                    </h3>
                    <div className="flex items-center gap-4 mt-auto pt-1 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {p.viewCount}
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        0
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 dark:text-slate-500 text-sm">
            Bu ay için henüz proje seçilmedi.
          </div>
        )}

        {/* Alt buton */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setActiveMonth((activeMonth + 1) % 12)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#26496b] dark:text-[#66aca9] border border-[#26496b]/20 dark:border-[#66aca9]/30 px-5 py-2.5 rounded-full hover:bg-[#26496b]/5 transition-colors"
          >
            Tüm Ayları Görüntüle →
          </button>
        </div>
      </div>
    </section>
  );
}

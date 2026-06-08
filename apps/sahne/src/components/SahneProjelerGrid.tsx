'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { CmsProject } from '@/lib/api';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

function mediaUrl(key: string) {
  return `${API_URL}/api/v1/media?key=${encodeURIComponent(key)}`;
}

function coverOf(p: CmsProject): string | null {
  if (p.coverImageKey) {
    if (p.coverImageKey.startsWith('covers/')) return mediaUrl(p.coverImageKey);
    return `/projects/${p.coverImageKey}`;
  }
  if (p.imageKeys?.[0]) return mediaUrl(p.imageKeys[0]);
  return null;
}

const MATURITY_LABELS: Record<string, string> = {
  idea: 'Fikir', prototype: 'Prototip', testing: 'Test',
  active: 'Aktif', commercial: 'Ticari Ürün',
};

const MATURITY_COLORS: Record<string, string> = {
  idea: 'bg-slate-100 text-slate-500',
  prototype: 'bg-blue-100 text-blue-600',
  testing: 'bg-yellow-100 text-yellow-600',
  active: 'bg-emerald-100 text-emerald-600',
  commercial: 'bg-purple-100 text-purple-600',
};

export function SahneProjelerGrid({ projects: allProjects }: { projects: CmsProject[] }) {
  const [featuredId, setFeaturedId] = useState<string>(allProjects[0]?.id ?? '');

  const featured = allProjects.find((p) => p.id === featuredId) ?? allProjects[0];
  const others = allProjects.filter((p) => p.id !== featuredId);

  useEffect(() => {
    if (allProjects.length > 0 && !allProjects.find((p) => p.id === featuredId)) {
      setFeaturedId(allProjects[0]!.id);
    }
  }, [allProjects]); // eslint-disable-line

  if (!featured) return null;

  const accent = featured.accentGradient ?? 'from-[#26496b] to-[#66aca9]';
  const heroSrc = coverOf(featured) ?? (featured.imageKeys?.[0] ? mediaUrl(featured.imageKeys[0]) : null);
  const dominantViews = Math.max(featured.viewCount, featured.linkedinViewCount ?? 0);

  return (
    <div className="flex gap-4 items-start">

      {/* Sol — diğer projeler listesi */}
      {others.length > 0 && (
        <div className="w-72 shrink-0 space-y-2">
          {others.map((p) => {
            const thumb = coverOf(p);
            const maturityLabel = p.maturityLevel ? (MATURITY_LABELS[p.maturityLevel] ?? p.maturityLevel) : null;
            const maturityColor = p.maturityLevel ? (MATURITY_COLORS[p.maturityLevel] ?? 'bg-gray-100 text-gray-500') : null;
            return (
              <button
                key={p.id}
                onClick={() => setFeaturedId(p.id)}
                className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#26496b]/30 hover:shadow-sm transition-all"
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-slate-800">
                  {thumb ? (
                    <img src={thumb} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${p.accentGradient ?? 'from-[#26496b] to-[#66aca9]'} opacity-40`} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-4 h-4 rounded-full text-white flex items-center justify-center text-[8px] font-bold shrink-0"
                      style={{ backgroundColor: p.authorAvatarColor ?? '#26496b' }}>
                      {(p.authorInitials ?? p.authorName?.slice(0, 1) ?? '?')}
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{p.authorName}</p>
                  </div>
                  <p className="text-[12px] font-bold leading-snug line-clamp-2 text-gray-800 dark:text-slate-200">
                    {p.title.includes(' — ') ? p.title.split(' — ').slice(1).join(' — ') : p.title}
                  </p>
                  {maturityLabel && (
                    <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${maturityColor}`}>
                      {maturityLabel}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Sağ — öne çıkan proje */}
      <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">

        {/* Hero görsel — üstte tam genişlik */}
        {heroSrc && (
          <div className="relative w-full h-56 sm:h-64 overflow-hidden bg-gray-100 dark:bg-slate-800">
            <img src={heroSrc} alt={featured.title} className="w-full h-full object-cover" />
            {featured.maturityLevel && (
              <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${MATURITY_COLORS[featured.maturityLevel] ?? 'bg-gray-100 text-gray-500'}`}>
                {MATURITY_LABELS[featured.maturityLevel] ?? featured.maturityLevel}
              </span>
            )}
            {dominantViews > 0 && (
              <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-sm">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {dominantViews.toLocaleString('tr-TR')}
              </span>
            )}
          </div>
        )}

        {/* İçerik */}
        <div className="px-5 py-4">
          {/* Yazar */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0"
                style={{ backgroundColor: featured.authorAvatarColor ?? '#26496b' }}
              >
                {featured.authorInitials ?? featured.authorName?.slice(0, 2).toUpperCase() ?? '?'}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{featured.authorName}</p>
                  <svg className="w-3.5 h-3.5 text-[#0a66c2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                {featured.authorTag && (
                  <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${featured.authorTagColor ?? 'bg-gray-100 text-gray-500'}`}>
                    {featured.authorTag}
                  </span>
                )}
              </div>
            </div>
            {featured.projectType?.[0] && (
              <span className="shrink-0 text-[9px] font-semibold px-2 py-0.5 rounded-md bg-[#26496b]/6 text-[#26496b] dark:bg-[#66aca9]/10 dark:text-[#66aca9]">
                {featured.projectType[0]}
              </span>
            )}
          </div>

          {/* Başlık */}
          <h2 className="text-base font-black text-gray-900 dark:text-slate-100 leading-snug tracking-tight mb-3">
            {featured.title}
          </h2>

          {/* Editorial not */}
          {featured.editorialNote ? (
            <div className="rounded-xl bg-[#66aca9]/6 dark:bg-[#66aca9]/8 border border-[#66aca9]/15 p-3.5 mb-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#66aca9] flex items-center gap-1">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Haritailesi Değerlendirmesi
                </p>
                {featured.editorialScore && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className={`w-2.5 h-2.5 ${(featured.editorialScore! / 2) >= i + 1 ? 'text-amber-400' : 'text-gray-200 dark:text-slate-700'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-600 dark:text-slate-400 leading-relaxed line-clamp-3">{featured.editorialNote}</p>
            </div>
          ) : featured.summary ? (
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-3 line-clamp-3">{featured.summary}</p>
          ) : null}

          {/* Hashtags + link */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex flex-wrap gap-1">
              {featured.hashtags?.slice(0, 4).map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 rounded font-medium">
                  #{t}
                </span>
              ))}
            </div>
            <Link href={`/projeler/${featured.slug}`}
              className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-[#26496b] dark:text-[#66aca9] hover:underline">
              Projeyi İncele
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

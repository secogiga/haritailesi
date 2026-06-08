'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { CmsProject } from '@/lib/api';
import { SahneProjelerGrid } from '@/components/SahneProjelerGrid';
import { ProjeGonderButton } from '@/components/ProjeGonder';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const mutfakUrl = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

function mediaUrl(key: string) {
  return `${API_URL}/api/v1/media?key=${encodeURIComponent(key)}`;
}

// ── Öne Çıkan Şerit ────────────────────────────────────────────────────────────

function SpotlightStrip({ project }: { project: CmsProject }) {
  const accent = project.accentGradient ?? 'from-[#26496b] to-[#66aca9]';
  const coverSrc = project.imageKeys?.[0]
    ? mediaUrl(project.imageKeys[0])
    : project.coverImageKey
      ? mediaUrl(project.coverImageKey)
      : null;

  return (
    <Link
      href={`/projeler/${project.slug}`}
      className="group block relative rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Sol renkli şerit */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${accent}`} />

      <div className="flex flex-col sm:flex-row items-stretch gap-0 pl-1">
        {/* İçerik */}
        <div className="flex-1 px-6 py-5 flex flex-col gap-3.5 justify-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 w-fit">
            <span className={`inline-block w-1.5 h-1.5 rounded-full bg-gradient-to-br ${accent}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#66aca9]">Öne Çıkan Proje</span>
          </div>

          {/* Yazar */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm"
              style={{ backgroundColor: project.authorAvatarColor ?? '#26496b' }}
            >
              {project.authorInitials ?? project.authorName?.slice(0, 2).toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 truncate">{project.authorName}</p>
              {project.authorTag && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${project.authorTagColor ?? 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {project.authorTag}
                </span>
              )}
            </div>
          </div>

          {/* Başlık + özet */}
          <div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-slate-50 leading-snug mb-1.5 group-hover:text-[#26496b] dark:group-hover:text-[#66aca9] transition-colors duration-200">
              {project.title}
            </h2>
            {project.summary && (
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-2">{project.summary}</p>
            )}
          </div>

          {/* Etiketler + CTA */}
          <div className="flex items-center gap-2 flex-wrap">
            {project.hashtags?.slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 rounded font-medium">
                #{t}
              </span>
            ))}
            <div className={`ml-auto inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r ${accent} text-white group-hover:brightness-110 transition-all shrink-0 shadow-sm`}>
              Projeyi Gör
              <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Cover fotoğraf — kendi rounded kutusu içinde */}
        {coverSrc && (
          <div className="sm:w-52 lg:w-64 shrink-0 p-3 pl-0">
            <div className="w-full h-full min-h-[160px] sm:min-h-0 rounded-xl overflow-hidden">
              <img
                src={coverSrc}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Ayın Öne Çıkan 3 Projesi ───────────────────────────────────────────────────

const RANK_CONFIG = [
  {
    bg: 'bg-gradient-to-br from-[#26496b] to-[#1a3350]',
    num: 'text-white/10',
    badge: 'bg-white/15 text-white',
    count: 'text-white',
    sub: 'text-white/50',
    title: 'text-white',
    author: 'text-white/60',
    border: 'border-transparent',
  },
  {
    bg: 'bg-white dark:bg-slate-900',
    num: 'text-gray-100 dark:text-slate-800',
    badge: 'bg-[#26496b]/8 text-[#26496b] dark:bg-[#66aca9]/10 dark:text-[#66aca9]',
    count: 'text-gray-900 dark:text-slate-100',
    sub: 'text-gray-400 dark:text-slate-500',
    title: 'text-gray-900 dark:text-slate-100',
    author: 'text-gray-400 dark:text-slate-500',
    border: 'border-gray-100 dark:border-slate-800',
  },
  {
    bg: 'bg-white dark:bg-slate-900',
    num: 'text-gray-100 dark:text-slate-800',
    badge: 'bg-[#26496b]/8 text-[#26496b] dark:bg-[#66aca9]/10 dark:text-[#66aca9]',
    count: 'text-gray-900 dark:text-slate-100',
    sub: 'text-gray-400 dark:text-slate-500',
    title: 'text-gray-900 dark:text-slate-100',
    author: 'text-gray-400 dark:text-slate-500',
    border: 'border-gray-100 dark:border-slate-800',
  },
];

function TopThreeSection({ projects }: { projects: CmsProject[] }) {
  const dominantViews = (p: CmsProject) => Math.max(p.viewCount, p.linkedinViewCount ?? 0);
  const top3 = [...projects].sort((a, b) => dominantViews(b) - dominantViews(a)).slice(0, 3);
  if (top3.length < 2) return null;

  const month = new Date().toLocaleDateString('tr-TR', { month: 'long' });

  return (
    <div>
      {/* Başlık */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-black text-gray-900 dark:text-slate-100 tracking-tight">Ayın Öne Çıkan 3 Projesi</h2>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 capitalize">{month} ayının en çok görüntülenen projeleri</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] font-black tracking-[0.15em] uppercase text-[#66aca9] bg-[#66aca9]/10 border border-[#66aca9]/20 px-3 py-1.5 rounded-full">
            {month}
          </span>
          <Link href="/projeler/yilinonecikanlari"
            className="text-xs font-semibold text-[#26496b] dark:text-[#66aca9] border border-[#26496b]/20 dark:border-[#66aca9]/30 px-3 py-1.5 rounded-full hover:bg-[#26496b]/5 transition-colors">
            Yılın Öne Çıkanları →
          </Link>
        </div>
      </div>

      {/* 3 Kart Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {top3.map((p, i) => {
          const c = RANK_CONFIG[i]!;
          return (
            <Link
              key={p.id}
              href={`/projeler/${p.slug}`}
              className={`group relative rounded-2xl border ${c.border} ${c.bg} overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col gap-3 min-h-[170px]`}
            >
              {/* Arka plan rank sayısı */}
              <span className={`absolute -right-2 -top-3 text-[80px] font-black leading-none select-none pointer-events-none ${c.num}`}>
                {i + 1}
              </span>

              {/* Rank badge */}
              <div className="relative z-10">
                <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-full ${c.badge}`}>
                  <span>#{i + 1}</span>
                  <span className="opacity-60">·</span>
                  <span>{i === 0 ? 'Birinci' : i === 1 ? 'İkinci' : 'Üçüncü'}</span>
                </span>
              </div>

              {/* İçerik */}
              <div className="relative z-10 flex-1 flex flex-col justify-between gap-2">
                <div>
                  {p.authorName && (
                    <p className={`text-[10px] font-semibold mb-1 ${c.author}`}>{p.authorName}</p>
                  )}
                  <p className={`text-sm font-bold leading-snug line-clamp-2 ${c.title}`}>
                    {p.title}
                  </p>
                </div>

                {/* Görüntülenme */}
                <div className="flex items-end justify-between mt-auto pt-1">
                  {p.hashtags?.[0] && (
                    <span className={`text-[10px] font-medium opacity-50 ${c.title}`}>#{p.hashtags[0]}</span>
                  )}
                  <div className="text-right ml-auto">
                    <p className={`text-2xl font-black tabular-nums leading-none ${c.count}`}>
                      {dominantViews(p).toLocaleString('tr-TR')}
                    </p>
                    <p className={`text-[8px] uppercase tracking-widest font-bold mt-0.5 ${c.sub}`}>görüntülenme</p>
                    {((p.linkedinViewCount ?? 0) > 0 || p.viewCount > 0) && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap justify-end">
                        {p.viewCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white/10 text-white/50">
                            Sahne {p.viewCount.toLocaleString('tr-TR')}
                          </span>
                        )}
                        {(p.linkedinViewCount ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#0a66c2]/20 text-[#5fa8e0]">
                            LinkedIn {p.linkedinViewCount!.toLocaleString('tr-TR')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── LinkedIn Kartı ─────────────────────────────────────────────────────────────

function LinkedinCard({ project }: { project: CmsProject }) {
  const accent = project.accentGradient ?? 'from-[#26496b] to-[#66aca9]';
  return (
    <a
      href={project.linkedinUrl ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-sm transition-all overflow-hidden"
    >
      <div className={`h-[2px] bg-gradient-to-r ${accent}`} />
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-8 h-8 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ backgroundColor: project.authorAvatarColor ?? '#26496b' }}
            >
              {project.authorInitials ?? project.authorName?.slice(0, 2).toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">{project.authorName ?? '—'}</p>
              {project.authorTag && (
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${project.authorTagColor ?? 'bg-gray-100 text-gray-500'}`}>
                  {project.authorTag}
                </span>
              )}
            </div>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#0a66c2]/10 text-[#0a66c2]">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            in
          </span>
        </div>

        <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200 leading-snug flex-1 group-hover:text-[#26496b] dark:group-hover:text-[#66aca9] transition-colors line-clamp-2">
          {project.title}
        </h2>

        {project.hashtags && project.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.hashtags.slice(0, 3).map((t) => (
              <span key={t} className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-400 rounded font-medium">
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0a66c2] group-hover:underline">
            LinkedIn&apos;de Gör →
          </span>
        </div>
      </div>
    </a>
  );
}

// ── LinkedIn Proje Seçmeler Grid (sol liste + sağ öne çıkan) ──────────────────

function LinkedinProjelerGrid({ projects }: { projects: CmsProject[] }) {
  const [featuredId, setFeaturedId] = useState<string>(projects[projects.length - 1]?.id ?? '');
  const featured = projects.find((p) => p.id === featuredId) ?? projects[projects.length - 1];
  const rest = projects.filter((p) => p.id !== featuredId);

  if (!featured) return null;

  const accent = (p: CmsProject) => p.accentGradient ?? 'from-[#26496b] to-[#66aca9]';
  const coverSrc = (p: CmsProject): string | null => {
    if (p.coverImageKey) return p.coverImageKey.startsWith('covers/') ? `${API_URL}/api/v1/media?key=${encodeURIComponent(p.coverImageKey)}` : `/projects/${p.coverImageKey}`;
    if (p.imageKeys?.[0]) return `${API_URL}/api/v1/media?key=${encodeURIComponent(p.imageKeys[0])}`;
    return null;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-stretch">
      {/* Sol — kompakt liste */}
      <div className="flex flex-col gap-3 lg:w-72 shrink-0">
        {rest.map((p) => (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => setFeaturedId(p.id)}
            onKeyDown={(e) => e.key === 'Enter' && setFeaturedId(p.id)}
            className="group cursor-pointer flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700 transition-all overflow-hidden"
          >
            <div className={`h-1 bg-gradient-to-r ${accent(p)}`} />
            <div className="flex flex-col flex-1">
              <div className="px-4 h-20 flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: p.authorAvatarColor ?? '#26496b' }}
                >
                  {p.authorInitials ?? p.authorName?.slice(0, 2).toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-gray-900 dark:text-slate-100 truncate">{p.authorName}</div>
                  {p.authorTag && (
                    <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${p.authorTagColor ?? 'bg-gray-100 text-gray-500'}`}>{p.authorTag}</span>
                  )}
                </div>
                <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#66aca9] transition-colors shrink-0 -rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="mt-auto bg-gray-50 dark:bg-slate-800/60 border-t border-gray-100 dark:border-slate-700">
                <div className="h-24 overflow-hidden">
                  {coverSrc(p) ? (
                    <img src={coverSrc(p)!} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className={`h-full bg-gradient-to-r ${accent(p)} opacity-20`} />
                  )}
                </div>
                <div className="h-14 px-4 flex items-center">
                  <p className="text-[13px] font-bold text-gray-800 dark:text-slate-200 leading-snug line-clamp-2 tracking-tight group-hover:text-[#26496b] dark:group-hover:text-[#66aca9] transition-colors">
                    {p.title}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sağ — öne çıkan */}
      <article className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className={`h-1.5 bg-gradient-to-r ${accent(featured)}`} />
        <div className="px-6 py-4 flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full text-white flex items-center justify-center text-sm font-bold shrink-0"
            style={{ backgroundColor: featured.authorAvatarColor ?? '#26496b' }}
          >
            {featured.authorInitials ?? featured.authorName?.slice(0, 2).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{featured.authorName}</div>
            {featured.authorTag && (
              <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${featured.authorTagColor ?? 'bg-gray-100 text-gray-500'}`}>{featured.authorTag}</span>
            )}
          </div>
          <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#0a66c2]/10 text-[#0a66c2]">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </span>
        </div>
        <div className="px-6 pb-6 border-t border-gray-100 dark:border-slate-800">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 leading-snug mt-5 mb-4">{featured.title}</h2>
          {coverSrc(featured) && (
            <div className="mb-5 overflow-hidden rounded-xl border border-gray-100 dark:border-slate-700">
              <img src={coverSrc(featured)!} alt={featured.title} className="w-full max-h-56 object-cover" />
            </div>
          )}
          {(featured.body ?? featured.summary) && (
            <div className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed whitespace-pre-line mb-5">
              {featured.body ?? featured.summary}
            </div>
          )}
          {featured.hashtags && featured.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {featured.hashtags.map((t) => (
                <span key={t} className="text-[11px] px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded font-medium">#{t}</span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {featured.linkedinUrl && (
              <a href={featured.linkedinUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0a66c2]/10 text-[#0a66c2] hover:bg-[#0a66c2]/20 transition-colors">
                LinkedIn&apos;de Gör →
              </a>
            )}
            {featured.externalLinks?.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#26496b]/10 text-[#26496b] dark:bg-[#66aca9]/15 dark:text-[#66aca9] hover:bg-[#26496b]/20 transition-colors">
                {l.label} →
              </a>
            ))}
            <Link href={`/projeler/${featured.slug}`}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#26496b] text-white hover:bg-[#1a3350] transition-colors">
              Projeyi Gör →
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

// ── CTA ────────────────────────────────────────────────────────────────────────

function ProjeCta() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#26496b] to-[#1a3350] p-6 sm:p-8 text-white">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <p className="text-sm font-bold mb-1">Projen mi var?</p>
          <p className="text-sm text-white/70 max-w-lg">
            Sahne veya Haritakademi&apos;de paylaştığın projeyi topluluğa duyur.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <a
            href={`${mutfakUrl}/projeler/yeni`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-semibold text-[#26496b] bg-white hover:bg-white/90 rounded-xl transition-colors"
          >
            Mutfak&apos;ta Oluştur
          </a>
          <ProjeGonderButton />
        </div>
      </div>
    </div>
  );
}

// ── Proje Detay Paneli ─────────────────────────────────────────────────────────

const MATURITY_TR: Record<string, string> = {
  idea: 'Fikir', prototype: 'Prototip', testing: 'Test', active: 'Aktif', commercial: 'Ticari Ürün',
};

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-center shrink-0 text-gray-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 dark:text-slate-500">{label}</p>
        <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 truncate">{value}</p>
      </div>
    </div>
  );
}

function ProjectDetailPanel({ project, onClose }: { project: CmsProject; onClose: () => void }) {
  const createdDate = new Date(project.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const category = project.projectType?.[0] ?? project.hashtags?.[0] ?? '-';
  const status = project.maturityLevel ? (MATURITY_TR[project.maturityLevel] ?? project.maturityLevel) : '-';
  const techs = project.hashtags?.slice(0, 5).join(', ') ?? project.features?.slice(0, 3).join(', ') ?? '-';

  return (
    <div className="sticky top-4 w-72 shrink-0 space-y-3">
      {/* Başlık kartı */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full text-white flex items-center justify-center text-sm font-bold shrink-0"
              style={{ backgroundColor: project.authorAvatarColor ?? '#26496b' }}>
              {project.authorInitials ?? project.authorName?.slice(0, 2).toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-slate-200">{project.authorName}</p>
              {project.authorTag && <p className="text-[10px] text-gray-400">{project.authorTag}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 leading-snug mb-1.5">
          {project.title.includes(' — ') ? project.title.split(' — ').slice(1).join(' — ') : project.title}
        </h3>
        {project.summary && <p className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{project.summary}</p>}
        <Link href={`/projeler/${project.slug}`}
          className="mt-3 flex items-center justify-center gap-1.5 w-full text-xs font-semibold px-3 py-2 rounded-xl bg-[#26496b] text-white hover:bg-[#1a3350] transition-colors">
          Projeyi Gör →
        </Link>
      </div>

      {/* Proje Detayları */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-slate-400 mb-3">Proje Detayları</p>
        <div className="space-y-3">
          <DetailRow
            label="Yayınlanma Tarihi" value={createdDate}
            icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          />
          <DetailRow
            label="Kategori" value={category}
            icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
          />
          {project.hashtags?.length ? (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-center shrink-0 text-gray-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mb-1">Teknolojiler</p>
                <div className="flex flex-wrap gap-1">
                  {project.hashtags.slice(0, 3).map((t) => (
                    <span key={t} className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

    </div>
  );
}

// ── Panel modunda tıklanabilir kompakt kart ────────────────────────────────────

function PanelProjectCard({ project, isSelected, onClick }: { project: CmsProject; isSelected: boolean; onClick: () => void }) {
  const accent = project.accentGradient ?? 'from-[#26496b] to-[#66aca9]';
  const title = project.title.includes(' — ') ? project.title.split(' — ').slice(1).join(' — ') : project.title;
  return (
    <button onClick={onClick} className={`w-full text-left relative flex items-center gap-3 p-3 rounded-xl border transition-all ${
      isSelected
        ? 'border-[#26496b]/40 bg-[#26496b]/5 dark:bg-[#26496b]/10'
        : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-200 dark:hover:border-slate-700'
    }`}>
      <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-to-b ${accent} ${isSelected ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
      <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{ backgroundColor: project.authorAvatarColor ?? '#26496b' }}>
        {project.authorInitials ?? project.authorName?.slice(0, 2).toUpperCase() ?? '?'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate leading-snug">{title}</p>
        <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{project.authorName}</p>
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        {project.viewCount > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {project.viewCount}
          </div>
        )}
        {(project.linkedinViewCount ?? 0) > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-[#0a66c2]/60">
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            {project.linkedinViewCount}
          </div>
        )}
      </div>
    </button>
  );
}

// ── Ana Client ─────────────────────────────────────────────────────────────────

type TabKey = 'all' | 'popular' | 'new' | 'editorial' | 'idea' | 'prototype' | 'product';
type SortKey = 'newest' | 'popular';
type ViewMode = 'grid' | 'panel';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'popular', label: 'Popüler' },
  { key: 'new', label: 'Yeni' },
  { key: 'editorial', label: 'Editör Seçimi' },
  { key: 'idea', label: 'Fikir' },
  { key: 'prototype', label: 'Prototip' },
  { key: 'product', label: 'Ürün' },
];

export function ProjelerClient({
  sahneProjects,
  linkedinProjects,
}: {
  sahneProjects: CmsProject[];
  linkedinProjects: CmsProject[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<CmsProject | null>(null);

  function filterProject(p: CmsProject): boolean {
    if (activeTab === 'popular') return p.viewCount > 0;
    if (activeTab === 'new') return true;
    if (activeTab === 'editorial') return !!p.editorialScore;
    if (activeTab === 'idea') return p.maturityLevel === 'idea';
    if (activeTab === 'prototype') return p.maturityLevel === 'prototype';
    if (activeTab === 'product') return p.maturityLevel === 'active' || p.maturityLevel === 'commercial';
    return true;
  }

  function sortProjects(arr: CmsProject[]): CmsProject[] {
    if (activeTab === 'popular' || sortBy === 'popular') return [...arr].sort((a, b) => Math.max(b.viewCount, b.linkedinViewCount ?? 0) - Math.max(a.viewCount, a.linkedinViewCount ?? 0));
    return [...arr].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const allProjects = useMemo(() => [...sahneProjects, ...linkedinProjects], [sahneProjects, linkedinProjects]);
  const filteredAll = useMemo(() => sortProjects(allProjects.filter(filterProject)), [allProjects, activeTab, sortBy]); // eslint-disable-line
  const filteredSahne = filteredAll.filter((p) => p.type === 'sahne');
  const filteredLinkedin = filteredAll.filter((p) => p.type === 'linkedin');

  const isFiltered = activeTab !== 'all';
  const isEmpty = filteredAll.length === 0;
  const sortLabel = sortBy === 'popular' ? 'En Popüler' : 'En Yeni';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">

      {/* Öne Çıkan */}
      {!isFiltered && (
        <TopThreeSection projects={[...sahneProjects, ...linkedinProjects]} />
      )}

      {/* Filtre Bar */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl px-4 py-2.5 shadow-sm">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-[#26496b] text-white'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sağ: Sort + View Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 hover:border-gray-300 dark:hover:border-slate-600 transition-colors bg-white dark:bg-slate-900"
            >
              {sortLabel}
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-lg py-1 min-w-[120px]">
                {(['newest', 'popular'] as SortKey[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSortBy(s); setSortOpen(false); }}
                    className={`w-full text-left text-xs font-semibold px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${sortBy === s ? 'text-[#26496b] dark:text-[#66aca9]' : 'text-gray-600 dark:text-slate-300'}`}
                  >
                    {s === 'newest' ? 'En Yeni' : 'En Popüler'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grid / Panel toggle */}
          <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => { setViewMode('panel'); if (!selectedProject) setSelectedProject(filteredSahne[0] ?? filteredLinkedin[0] ?? null); }}
              title="Panel görünümü"
              className={`p-1.5 transition-colors ${viewMode === 'panel' ? 'bg-[#26496b] text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Grid görünümü"
              className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-[#26496b] text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Boş state */}
      {isEmpty && (
        <div className="text-center py-16 text-gray-400 text-sm space-y-2">
          <p>Bu filtreye ait proje bulunamadı.</p>
          <button
            onClick={() => setActiveTab('all')}
            className="text-[#26496b] dark:text-[#66aca9] hover:underline text-xs font-semibold"
          >
            Filtreyi temizle
          </button>
        </div>
      )}

      {/* Projeler */}
      {filteredAll.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#66aca9] animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#66aca9]">
              Sahne&apos;den Seçmeler
            </span>
            <span className="text-xs text-gray-400 dark:text-slate-500">({filteredAll.length})</span>
          </div>

          {viewMode === 'grid' ? (
            <SahneProjelerGrid projects={filteredAll} />
          ) : (
            <div className="flex gap-4 items-start">
              <div className="flex-1 min-w-0 space-y-2">
                {filteredAll.map((p) => (
                  <PanelProjectCard
                    key={p.id}
                    project={p}
                    isSelected={selectedProject?.id === p.id}
                    onClick={() => setSelectedProject(p)}
                  />
                ))}
              </div>
              {selectedProject && (
                <ProjectDetailPanel
                  project={selectedProject}
                  onClose={() => setSelectedProject(null)}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Alt CTA */}
      {!isEmpty && <ProjeCta />}
    </div>
  );
}

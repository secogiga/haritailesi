'use client';

import { useState } from 'react';

type SahnePinnedProje = {
  id: string;
  initials: string;
  avatarColor: string;
  author: string;
  title: string;
  tag: string;
  tagColor: string;
  accent: string;
  images: string[];
  body: string;
  tags: string[];
  links?: { label: string; href: string }[];
};

export function SahneProjelerGrid({ pinned }: { pinned: SahnePinnedProje[] }) {
  const [featuredId, setFeaturedId] = useState<string>(pinned[pinned.length - 1]?.id ?? '');

  const featured = pinned.find((p) => p.id === featuredId) ?? pinned[pinned.length - 1];
  const rest = pinned.filter((p) => p.id !== featuredId);

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-stretch">
      {/* Sol — 3 dikey özet kart */}
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
            <div className={`h-1 bg-gradient-to-r ${p.accent}`} />
            <div className="flex flex-col flex-1">
              {/* Üst — avatar + isim + tag, sabit yükseklik */}
              <div className="px-4 h-20 flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-full ${p.avatarColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                  {p.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-gray-900 dark:text-slate-100 truncate">{p.author}</div>
                  <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${p.tagColor}`}>{p.tag}</span>
                </div>
                <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#66aca9] transition-colors shrink-0 -rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Alt bant — görsel + başlık, sabit yükseklik */}
              <div className="mt-auto bg-gray-50 dark:bg-slate-800/60 border-t border-gray-100 dark:border-slate-700">
                <div className="h-24 overflow-hidden">
                  {p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className={`h-full bg-gradient-to-r ${p.accent} opacity-20`} />
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

      {/* Sağ — açık / öne çıkan proje */}
      {featured && (
        <article className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className={`h-1.5 bg-gradient-to-r ${featured.accent}`} />
          <div className="px-6 py-4 flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full ${featured.avatarColor} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
              {featured.initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{featured.author}</div>
              <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${featured.tagColor}`}>{featured.tag}</span>
            </div>
            <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#66aca9]/15 text-[#26496b] dark:text-[#66aca9] shrink-0">
              Sahne
            </span>
          </div>
          <div className="px-6 pb-6 border-t border-gray-100 dark:border-slate-800">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 leading-snug mt-5 mb-4">
              {featured.title}
            </h2>
            {featured.images.length > 0 && (
              <div className="flex gap-3 mb-5 overflow-x-auto pb-1">
                {featured.images.map((src, i) => (
                  <div key={i} className="shrink-0 overflow-hidden rounded-xl border border-gray-100 dark:border-slate-700 cursor-zoom-in">
                    <img
                      src={src}
                      alt={`${featured.title} görsel ${i + 1}`}
                      className="h-48 sm:h-56 w-auto object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed whitespace-pre-line mb-5">
              {featured.body}
            </div>
            {featured.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {featured.tags.map((t) => (
                  <span key={t} className="text-[11px] px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            )}
            {featured.links && featured.links.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {featured.links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#26496b]/10 text-[#26496b] dark:bg-[#66aca9]/15 dark:text-[#66aca9] hover:bg-[#26496b]/20 dark:hover:bg-[#66aca9]/25 transition-colors"
                  >
                    {l.label} →
                  </a>
                ))}
              </div>
            )}
          </div>
        </article>
      )}
    </div>
  );
}

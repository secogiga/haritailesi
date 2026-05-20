'use client';

import { useState } from 'react';

type SahneProje = {
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
};

export function SahneProjeAccordion({ projects }: { projects: SahneProje[] }) {
  const [openId, setOpenId] = useState<string>(projects[0]?.id ?? '');

  return (
    <div className="grid grid-cols-1 gap-4">
      {projects.map((p) => {
        const isOpen = openId === p.id;
        return (
          <article
            key={p.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            <div className={`h-1.5 bg-gradient-to-r ${p.accent}`} />

            {/* Başlık — tıklanabilir */}
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? '' : p.id)}
              className="w-full text-left px-6 sm:px-8 py-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full ${p.avatarColor} text-white flex items-center justify-center text-sm font-bold shrink-0`}
                >
                  {p.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{p.author}</div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${p.tagColor}`}>{p.tag}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="hidden sm:block text-sm font-semibold text-gray-800 dark:text-slate-200 text-right max-w-xs leading-snug">
                  {p.title}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#66aca9]/15 text-[#26496b] dark:text-[#66aca9]">
                  Sahne
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* İçerik */}
            {isOpen && (
              <div className="px-6 sm:px-8 pb-6 sm:pb-8 border-t border-gray-100 dark:border-slate-800">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 leading-snug mt-5 mb-4 sm:hidden">
                  {p.title}
                </h2>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 leading-snug mt-5 mb-4 hidden sm:block">
                  {p.title}
                </h2>

                {p.images.length > 0 && (
                  <div className="flex gap-3 mb-5 overflow-x-auto pb-1">
                    {p.images.map((src, i) => (
                      <div
                        key={i}
                        className="shrink-0 overflow-hidden rounded-xl border border-gray-100 dark:border-slate-700 cursor-zoom-in"
                      >
                        <img
                          src={src}
                          alt={`${p.title} görsel ${i + 1}`}
                          className="h-48 sm:h-64 w-auto object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed whitespace-pre-line mb-5">
                  {p.body}
                </div>

                {p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded font-medium"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

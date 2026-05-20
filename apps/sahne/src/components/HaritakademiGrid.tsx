'use client';

import { useState } from 'react';

type HaritakademiProje = {
  id: string;
  initials: string;
  avatarColor: string;
  author: string;
  title: string;
  tag: string;
  tagColor: string;
  href: string;
  accent: string;
};

const LiIcon = () => (
  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export function HaritakademiGrid({ pinned }: { pinned: HaritakademiProje[] }) {
  const [openId, setOpenId] = useState<string>('');

  return (
    <div className="flex flex-col gap-4">
      {pinned.map((p) => {
        const isOpen = openId === p.id;
        return (
          <article
            key={p.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col"
          >
            {/* İçerik — başlığın üstüne doğru açılır */}
            {isOpen && (
              <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-slate-800 order-first">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 leading-snug mb-4">
                  {p.title}
                </h2>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0a66c2] hover:underline"
                >
                  <LiIcon /> LinkedIn&apos;de Gör →
                </a>
              </div>
            )}

            {/* Başlık — her zaman altta, tıklanabilir */}
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? '' : p.id)}
              className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-full ${p.avatarColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                  {p.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-900 dark:text-slate-100 truncate">{p.author}</div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${p.tagColor}`}>{p.tag}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:block text-sm font-semibold text-gray-800 dark:text-slate-200 text-right max-w-md leading-snug">
                  {p.title}
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0a66c2]/10 text-[#0a66c2]">
                  <LiIcon /> LinkedIn
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {/* ok yukarıyı gösteriyor (chevron-up) — içerik üste doğru açılır */}
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </button>

            {/* Gradient çubuk altta */}
            <div className={`h-1.5 bg-gradient-to-r ${p.accent}`} />
          </article>
        );
      })}
    </div>
  );
}

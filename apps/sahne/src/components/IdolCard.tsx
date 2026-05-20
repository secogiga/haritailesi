'use client';

import { useState } from 'react';
import Image from 'next/image';

export interface Idol {
  id: string;
  name: string;
  title: string;
  organization: string;
  mediaUrl: string;
  description: string;
}

const AVATAR_COLORS = [
  'bg-[#26496b]', 'bg-[#66aca9]', 'bg-amber-600', 'bg-emerald-700',
  'bg-violet-600', 'bg-rose-600', 'bg-indigo-600', 'bg-teal-600',
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length]!;
}

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#\s]+)/);
  return m?.[1] ?? null;
}

export function IdolCard({ idol }: { idol: Idol }) {
  const [playing, setPlaying] = useState(false);
  const vid = youtubeId(idol.mediaUrl);
  const thumb = vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : null;
  const ini = initials(idol.name);
  const color = avatarColor(idol.name);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200">

      {/* Video */}
      <div className="relative aspect-video bg-gray-900 dark:bg-slate-950 overflow-hidden">
        {playing ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={idol.name}
          />
        ) : (
          <>
            {thumb && (
              <Image src={thumb} alt={idol.name} fill className="object-cover opacity-85" unoptimized />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            {/* Idol rozeti */}
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/90 text-white text-[10px] font-bold tracking-wide">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                İdol
              </span>
            </div>

            <button
              onClick={() => setPlaying(true)}
              aria-label="Oynat"
              className="absolute inset-0 flex items-center justify-center group"
            >
              <div className="w-14 h-14 rounded-full bg-white/90 dark:bg-white/80 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-white transition-all duration-200">
                <svg className="w-6 h-6 text-[#26496b] ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>

            <div className="absolute bottom-0 left-0 right-0 px-4 py-3">
              <p className="text-xs font-semibold text-white leading-snug line-clamp-1">{idol.name}</p>
              <p className="text-[10px] text-white/70 mt-0.5 line-clamp-1">{idol.organization}</p>
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-full ${color} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
            {ini}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-tight">{idol.name}</div>
            <div className="text-xs text-gray-400 dark:text-slate-500 truncate">{idol.organization}</div>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-[#26496b] dark:text-blue-400 mb-1">{idol.title}</div>
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-3">{idol.description}</p>
        </div>

        <a
          href={idol.mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
          </svg>
          Haritailesi TV&apos;de İzle
        </a>
      </div>
    </div>
  );
}

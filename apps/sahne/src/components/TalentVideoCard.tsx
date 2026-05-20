'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { CmsTalent } from '@/lib/api';

const CAT_META: Record<string, { label: string; tagColor: string }> = {
  enstruman_calmak: { label: 'Enstrüman',    tagColor: 'bg-violet-100 text-violet-700' },
  sarki_soylemek:   { label: 'Müzik',        tagColor: 'bg-blue-100 text-blue-700' },
  resim_yapmak:     { label: 'Resim',         tagColor: 'bg-orange-100 text-orange-700' },
  dijital_cizim:    { label: 'Dijital Çizim', tagColor: 'bg-indigo-100 text-indigo-700' },
  fotografcilik:    { label: 'Fotoğraf',      tagColor: 'bg-amber-100 text-amber-700' },
  oyunculuk:        { label: 'Oyunculuk',     tagColor: 'bg-red-100 text-red-700' },
  dans_etmek:       { label: 'Dans',          tagColor: 'bg-rose-100 text-rose-700' },
  yazarlik:         { label: 'Yazarlık',      tagColor: 'bg-teal-100 text-teal-700' },
  moda_tasarimi:    { label: 'Moda',          tagColor: 'bg-fuchsia-100 text-fuchsia-700' },
  ahsap_iscilik:    { label: 'Ahşap',         tagColor: 'bg-yellow-100 text-yellow-700' },
  seramik_yapmak:   { label: 'Seramik',       tagColor: 'bg-lime-100 text-lime-700' },
};

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

export function TalentVideoCard({ talent }: { talent: CmsTalent }) {
  const [playing, setPlaying] = useState(false);

  const cat = CAT_META[talent.category];
  const vid = talent.mediaUrl ? youtubeId(talent.mediaUrl) : null;
  const thumb = vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : null;
  const ini = initials(talent.displayName);
  const color = avatarColor(talent.displayName);
  const overlayTitle = `${talent.displayName} "${talent.title}"`;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200">

      {vid && (
        <div className="relative aspect-video bg-gray-900 dark:bg-slate-950 overflow-hidden">
          {playing ? (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={overlayTitle}
            />
          ) : (
            <>
              {thumb && (
                <Image src={thumb} alt={overlayTitle} fill className="object-cover opacity-80" unoptimized />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
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
                <p className="text-xs font-medium text-white/90 leading-snug line-clamp-1">{overlayTitle}</p>
              </div>
            </>
          )}
        </div>
      )}

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-full ${color} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
            {ini}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-tight">{talent.displayName}</div>
            <div className="text-xs text-gray-400 dark:text-slate-500">Haritailesi Üyesi</div>
          </div>
          {cat && (
            <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${cat.tagColor}`}>
              {cat.label}
            </span>
          )}
        </div>

        <div>
          <div className="font-semibold text-gray-800 dark:text-slate-200 text-sm leading-snug">{talent.title}</div>
          {talent.description && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5 leading-relaxed">{talent.description}</p>
          )}
        </div>

        {!vid && talent.mediaUrl && (
          <a
            href={talent.mediaUrl}
            target="_blank" rel="noopener noreferrer"
            className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-[#26496b] dark:text-blue-400 hover:underline"
          >
            Örnek Çalışma →
          </a>
        )}
      </div>
    </div>
  );
}

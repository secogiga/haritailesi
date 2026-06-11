'use client';

import { useState } from 'react';

interface HeroCarouselProps {
  slides: string[];
  title: string;
  linkedinPostUrl?: string | null;
  linkedinViewCount?: number;
  linkedinLikeCount?: number;
  linkedinCommentCount?: number;
  awardCohortMonth?: number | null;
  awardRank?: number | null;
  editorialScore?: number | null;
}

const AY: Record<number, string> = {
  1: 'Ocak', 2: 'Şubat', 3: 'Mart', 4: 'Nisan', 5: 'Mayıs',
  6: 'Haziran', 7: 'Temmuz', 8: 'Ağustos', 9: 'Eylül', 10: 'Ekim', 11: 'Kasım', 12: 'Aralık',
};

export function HeroCarousel({ slides, title, linkedinPostUrl, linkedinViewCount, linkedinLikeCount, linkedinCommentCount, awardCohortMonth, awardRank, editorialScore }: HeroCarouselProps) {
  const [idx, setIdx] = useState(0);

  if (slides.length === 0) {
    return (
      <div className="w-full min-h-[280px] bg-gradient-to-br from-[#1a2d40] to-[#0c1824] flex flex-col items-center justify-center gap-5 p-6">
        {/* Ödül rozeti */}
        {awardCohortMonth != null && awardRank != null && (
          <div className="flex items-center gap-2.5 bg-amber-500/15 border border-amber-400/30 rounded-2xl px-5 py-3">
            <span className="text-3xl font-black text-amber-400">#{awardRank}</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70">Aylık Ödül</p>
              <p className="text-sm font-bold text-amber-300">{AY[awardCohortMonth]} Ayı</p>
            </div>
          </div>
        )}

        {/* Editorial puan */}
        {editorialScore != null && (
          <div className="text-center">
            <p className="text-4xl font-black text-white/90 leading-none">{editorialScore.toFixed(1)}</p>
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mt-1">Haritailesi Puanı</p>
            <div className="flex gap-0.5 justify-center mt-2">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <div key={n} className={`h-1 w-4 rounded-full ${n <= Math.round(editorialScore) ? 'bg-[#66aca9]' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
        )}

        {/* LinkedIn stats */}
        {(linkedinViewCount ?? 0) > 0 && (
          <div className="flex items-center gap-4 text-center">
            <div>
              <p className="text-xl font-black text-white/80 tabular-nums">{(linkedinViewCount ?? 0).toLocaleString('tr-TR')}</p>
              <p className="text-[9px] text-white/40 uppercase tracking-widest">Görüntülenme</p>
            </div>
            {(linkedinLikeCount ?? 0) > 0 && (
              <div>
                <p className="text-xl font-black text-white/80 tabular-nums">{(linkedinLikeCount ?? 0).toLocaleString('tr-TR')}</p>
                <p className="text-[9px] text-white/40 uppercase tracking-widest">Beğeni</p>
              </div>
            )}
            {(linkedinCommentCount ?? 0) > 0 && (
              <div>
                <p className="text-xl font-black text-white/80 tabular-nums">{(linkedinCommentCount ?? 0).toLocaleString('tr-TR')}</p>
                <p className="text-[9px] text-white/40 uppercase tracking-widest">Yorum</p>
              </div>
            )}
          </div>
        )}

        {/* LinkedIn'e git */}
        {linkedinPostUrl && (
          <a href={linkedinPostUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#5fa8e0] border border-[#0a66c2]/40 hover:border-[#0a66c2] hover:bg-[#0a66c2]/10 px-4 py-2 rounded-xl transition-all">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn&apos;de Gör
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[360px]">
      <img
        src={slides[idx]}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0c1824]/25" />

      {slides.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + slides.length) % slides.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all z-10"
            aria-label="Önceki"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % slides.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all z-10"
            aria-label="Sonraki"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`rounded-full transition-all duration-200 ${
                  i === idx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Görsel ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

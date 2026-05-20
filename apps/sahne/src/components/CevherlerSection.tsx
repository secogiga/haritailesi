'use client';

import { useState } from 'react';
import Image from 'next/image';
import { YetenekGonderButton } from './YetenekGonder';

// ─── Editorial data — gerçek verilerle değiştirilecek ────────────────────────

type Talent = {
  id: number;
  initials: string;
  avatarColor: string;
  name: string;
  city: string;
  profession: string;
  tag: string;
  tagColor: string;
  desc: string;
  platform?: 'youtube' | 'instagram';
  videoId: string | null;      // YouTube ID veya Instagram Reel ID — null ise "yakında"
  videoTitle: string;
  thumbOverride?: string;
};

const TALENTS: Talent[] = [
  {
    id: 1,
    initials: 'GD',
    avatarColor: 'bg-[#26496b]',
    name: 'Gökhan Demir',
    city: '',
    profession: 'Haritailesi Üyesi',
    tag: 'Müzik',
    tagColor: 'bg-violet-100 text-violet-700',
    desc: '"Yolcu" şarkısıyla Haritailesi topluluğunun müzikal sesini taşıdı.',
    videoId: '82Wgj-m0sNE',
    videoTitle: 'Gökhan Demir "Yolcu"',
  },
  {
    id: 2,
    initials: 'KÖ',
    avatarColor: 'bg-[#66aca9]',
    name: 'Koray Özdoğu',
    city: '',
    profession: 'Haritailesi Üyesi',
    tag: 'Müzik',
    tagColor: 'bg-blue-100 text-blue-700',
    desc: '"Asla Vazgeçme" ile duygusal bir müzik yolculuğuna çıkardı dinleyiciyi.',
    videoId: '-1TfqU-4kBQ',
    videoTitle: 'Koray Özdoğu "Asla Vazgeçme"',
  },
  {
    id: 3,
    initials: 'AG',
    avatarColor: 'bg-amber-600',
    name: 'Alper Girgin',
    city: '',
    profession: 'Haritailesi Üyesi',
    tag: 'Müzik',
    tagColor: 'bg-amber-100 text-amber-700',
    desc: '"Adab-ı Muaşeret" ile toplulukta yankı uyandıran bir performans ortaya koydu.',
    videoId: 'EwKvUGP-zzk',
    videoTitle: 'Alper Girgin "Adab-ı Muaşeret"',
  },
  {
    id: 4,
    initials: 'MF',
    avatarColor: 'bg-emerald-700',
    name: 'Mesleğimizin Filizleri',
    city: '',
    profession: 'Meslek Lisesi Öğrencileri',
    tag: 'Gelecek Nesil',
    tagColor: 'bg-emerald-100 text-emerald-700',
    desc: 'Harita ve tapu-kadastro alanındaki meslek lisesi öğrencileri sektörün geleceğini şekillendiriyor.',
    videoId: 'gcVcwsaw_Do',
    videoTitle: 'Mesleğimizin Filizleri',
  },
];

// ─── Tek kart ─────────────────────────────────────────────────────────────────

function TalentCard({ t }: { t: Talent }) {
  const [playing, setPlaying] = useState(false);
  const isInstagram = t.platform === 'instagram';
  const thumb = t.thumbOverride
    ?? (!isInstagram && t.videoId ? `https://img.youtube.com/vi/${t.videoId}/hqdefault.jpg` : null);

  // Instagram: aspect ratio 4:5 (reel formatı), YouTube: 16:9
  const aspectClass = isInstagram ? 'aspect-[4/5]' : 'aspect-video';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200">

      {/* Video alanı */}
      <div className={`relative ${aspectClass} bg-gray-900 dark:bg-slate-950 overflow-hidden`}>
        {playing && t.videoId && !isInstagram ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${t.videoId}?autoplay=1&rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={t.videoTitle}
          />
        ) : (
          <>
            {/* Thumbnail */}
            {thumb ? (
              <Image src={thumb} alt={t.videoTitle} fill className="object-cover opacity-80" unoptimized />
            ) : isInstagram ? (
              /* Instagram gradient placeholder */
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)' }}>
                <svg className="w-12 h-12 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-16 h-16 text-slate-700 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            )}

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Play / Aç butonu */}
            {t.videoId ? (
              isInstagram ? (
                <a
                  href={`https://www.instagram.com/reel/${t.videoId}/`}
                  target="_blank" rel="noopener noreferrer"
                  aria-label="Instagram'da aç"
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-200">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-white/90 bg-black/30 px-3 py-1 rounded-full group-hover:bg-black/50 transition-colors">
                    Instagram&apos;da İzle
                  </span>
                </a>
              ) : (
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
              )
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-white/60 bg-black/30 px-3 py-1.5 rounded-full tracking-wider uppercase">
                  Yakında
                </span>
              </div>
            )}

            {/* Altta platform etiketi + başlık */}
            <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center gap-2">
              {isInstagram && (
                <svg className="w-3.5 h-3.5 text-pink-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              )}
              <p className="text-xs font-medium text-white/90 leading-snug line-clamp-1">{t.videoTitle}</p>
            </div>
          </>
        )}
      </div>

      {/* Kart içeriği */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Üye satırı */}
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-full ${t.avatarColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
            {t.initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-tight">{t.name}</div>
            <div className="text-xs text-gray-400 dark:text-slate-500">{t.profession}{t.city ? ` · ${t.city}` : ''}</div>
          </div>
          <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${t.tagColor}`}>
            {t.tag}
          </span>
        </div>

        {/* Açıklama */}
        <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{t.desc}</p>

        {/* YouTube linki — video yoksa */}
        {!t.videoId && (
          <div className="mt-auto pt-1">
            <span className="text-[11px] text-gray-300 dark:text-slate-600 italic">Video yakında eklenecek</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sadece kart grid'i — YeteneklerSection tarafından da kullanılır ──────────

export function CevherlerCards() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TALENTS.map((t) => (
          <TalentCard key={t.id} t={t} />
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-gray-400 dark:text-slate-500">
        Yeteneğini topluluğunla paylaşmak istersen{' '}
        <YetenekGonderButton label="buradan gönder" />
        {'. '}
        Videonu gömebilir, sesini duyurabiliriz.
      </p>
    </>
  );
}

// ─── Tam section — /yetenekler sayfasında kullanılır ─────────────────────────

export default function CevherlerSection() {
  return (
    <section className="py-16 sm:py-24 dark:bg-[#070c1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Başlık */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-3.5 h-3.5 text-[#66aca9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#66aca9]">Cevherler</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
              Mesleğin ötesinde yetenekler.
            </h2>
            <p className="mt-2 text-gray-500 dark:text-slate-400 max-w-xl">
              Koordinat hesaplarken aynı zamanda müzik yapıyorlar, fotoğraf sergileri açıyorlar, albüm çıkarıyorlar.
              Biz de ne cevherler var bu toplulukta.
            </p>
          </div>
          <YetenekGonderButton />
        </div>

        <CevherlerCards />
      </div>
    </section>
  );
}

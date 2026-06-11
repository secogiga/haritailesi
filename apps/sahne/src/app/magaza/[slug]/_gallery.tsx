'use client';

import { useState } from 'react';

interface Props {
  images: string[];
  title: string;
  type: string;
}

const TYPE_ICON: Record<string, string> = { digital: '📄', physical: '📦', app: '📱' };

export function ProductGallery({ images, title, type }: Props) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="aspect-square bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 flex items-center justify-center text-6xl">
        <span>{TYPE_ICON[type] ?? '📦'}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Ana görsel */}
      <div className="relative aspect-square bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden group">
        <img
          src={images[active]}
          alt={`${title} — görsel ${active + 1}`}
          className="w-full h-full object-cover transition-opacity duration-200"
        />

        {/* Sol/Sağ ok — birden fazla görsel varsa */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActive(i => (i - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 shadow flex items-center justify-center text-gray-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-slate-700"
              aria-label="Önceki"
            >
              ‹
            </button>
            <button
              onClick={() => setActive(i => (i + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 shadow flex items-center justify-center text-gray-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-slate-700"
              aria-label="Sonraki"
            >
              ›
            </button>

            {/* Nokta indikatörü */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === active ? 'bg-white scale-125' : 'bg-white/50'}`}
                  aria-label={`Görsel ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail şeridi */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden transition-all ${i === active ? 'border-[#26496b] dark:border-blue-400 ring-1 ring-[#26496b]/30' : 'border-gray-100 dark:border-slate-700 hover:border-[#26496b]/50'}`}
            >
              <img src={img} alt={`${title} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

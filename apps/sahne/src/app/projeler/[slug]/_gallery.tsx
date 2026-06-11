'use client';

import { useState } from 'react';

export function GalleryLightbox({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [imgFade, setImgFade] = useState(true);

  function openAt(i: number) {
    setImgFade(true);
    setOpen(i);
    setTimeout(() => setVisible(true), 10);
  }
  function close() {
    setVisible(false);
    setTimeout(() => setOpen(null), 200);
  }
  function goTo(i: number) {
    setImgFade(false);
    setTimeout(() => { setOpen(i); setImgFade(true); }, 150);
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {images.map((src, i) => (
          <button key={i} onClick={() => openAt(i)}
            className="shrink-0 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm hover:opacity-90 hover:scale-[1.02] transition-all duration-200 cursor-zoom-in">
            <img src={src} alt={`${title} görsel ${i + 1}`}
              className="h-40 w-auto max-w-[260px] object-cover" />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-8 transition-all duration-200 ${visible ? 'bg-black/40' : 'bg-black/0'}`}
          onClick={close}
        >
          <div
            className={`relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full transition-all duration-200 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center text-sm transition-colors"
              onClick={close}
            >✕</button>

            <div className="overflow-hidden">
              <img
                src={images[open]}
                alt={`${title} görsel ${open + 1}`}
                className={`w-full max-h-[60vh] object-contain transition-opacity duration-150 ${imgFade ? 'opacity-100' : 'opacity-0'}`}
              />
            </div>

            {images.length > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  disabled={open === 0}
                  onClick={() => goTo(open - 1)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >← Önceki</button>
                <span className="text-xs text-gray-400 dark:text-slate-500">{open + 1} / {images.length}</span>
                <button
                  disabled={open === images.length - 1}
                  onClick={() => goTo(open + 1)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >Sonraki →</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

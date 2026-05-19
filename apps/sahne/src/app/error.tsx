'use client';

import { useEffect } from 'react';

export default function SahneError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Bir sorun oluştu</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        Sayfa yüklenirken beklenmedik bir hata meydana geldi.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1e3a56] rounded-xl transition-colors"
      >
        Tekrar Dene
      </button>
    </div>
  );
}

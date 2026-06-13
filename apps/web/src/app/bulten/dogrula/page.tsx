'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function Content() {
  const params = useSearchParams();
  const status = params.get('status');

  if (status === 'ok') {
    return (
      <div className="text-center max-w-md mx-auto px-4 py-24">
        <div className="text-5xl mb-6">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Aboneliğiniz onaylandı!</h1>
        <p className="text-gray-500 mb-8">Haritailesi Bülteni'ne başarıyla abone oldunuz. Her ay topluluktan haberler, etkinlikler ve fırsatlarla dolu bir bülten gönderilecek.</p>
        <Link href="/" className="inline-block px-6 py-3 bg-[var(--color-mavi,#294f73)] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="text-center max-w-md mx-auto px-4 py-24">
        <div className="text-5xl mb-6">⏰</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Link süresi dolmuş</h1>
        <p className="text-gray-500 mb-8">Doğrulama linki 48 saat geçerlidir. Abone olmak için formu tekrar doldurun, yeni bir link gönderelim.</p>
        <Link href="/#bulten" className="inline-block px-6 py-3 bg-[var(--color-mavi,#294f73)] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
          Tekrar Abone Ol
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center max-w-md mx-auto px-4 py-24">
      <div className="text-5xl mb-6">❓</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Geçersiz link</h1>
      <p className="text-gray-500 mb-8">Bu doğrulama linki geçerli değil veya daha önce kullanılmış.</p>
      <Link href="/" className="inline-block px-6 py-3 bg-[var(--color-mavi,#294f73)] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}

export default function BultenDogrulaPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Suspense>
        <Content />
      </Suspense>
    </main>
  );
}

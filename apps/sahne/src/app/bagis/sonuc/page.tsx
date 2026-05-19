'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

function SonucContent() {
  const params = useSearchParams();
  const success = params.get('durum') === 'basarili';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${success ? 'bg-emerald-100' : 'bg-red-100'}`}>
          {success ? (
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {success ? 'Ödeme Tamamlandı!' : 'Ödeme Başarısız'}
        </h1>
        <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">
          {success
            ? 'Bağışınız başarıyla alındı. Üyeliğiniz en kısa sürede aktive edilecektir. Onay e-posta adresinize gönderilecektir.'
            : 'Ödeme işlemi sırasında bir sorun oluştu. Lütfen tekrar deneyin veya havale yöntemini kullanın.'}
        </p>

        <div className="flex gap-3 justify-center">
          {!success && (
            <Link
              href="/bagis"
              className="px-6 py-3 bg-[#26496b] text-white font-semibold rounded-xl hover:bg-[#1d3a57] transition-colors text-sm"
            >
              Tekrar Dene
            </Link>
          )}
          <Link
            href="/"
            className={`px-6 py-3 font-semibold rounded-xl transition-colors text-sm ${
              success
                ? 'bg-[#26496b] text-white hover:bg-[#1d3a57]'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function BagisOdemeSonuc() {
  return (
    <Suspense>
      <SonucContent />
    </Suspense>
  );
}

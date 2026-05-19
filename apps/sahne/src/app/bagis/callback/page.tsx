'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000/api/v1';

function CallbackContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'fail'>('loading');

  useEffect(() => {
    const token = params.get('token');
    const paymentStatus = params.get('status');

    if (!token) { setStatus('fail'); return; }

    fetch(`${API}/donations/iyzico/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, status: paymentStatus }),
    })
      .then(() => setStatus(paymentStatus === 'success' ? 'success' : 'fail'))
      .catch(() => setStatus('fail'));
  }, [params]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          {status === 'loading' && (
            <>
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
                <svg className="w-6 h-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Ödeme Doğrulanıyor</h2>
              <p className="text-sm text-gray-500">Lütfen bekleyin…</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Bağışınız Alındı!</h2>
              <p className="text-sm text-gray-500 mb-6">Desteğiniz için çok teşekkür ederiz. Makbuzu e-posta adresinize ilettik.</p>
              <Link href="/" className="inline-block px-6 py-2.5 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1d3a57] transition-colors">
                Ana Sayfaya Dön
              </Link>
            </>
          )}
          {status === 'fail' && (
            <>
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Ödeme Başarısız</h2>
              <p className="text-sm text-gray-500 mb-6">Ödeme tamamlanamadı. Tekrar deneyebilir veya havale yöntemini kullanabilirsiniz.</p>
              <Link href="/bagis" className="inline-block px-6 py-2.5 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1d3a57] transition-colors">
                Tekrar Dene
              </Link>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default function BagisCallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}

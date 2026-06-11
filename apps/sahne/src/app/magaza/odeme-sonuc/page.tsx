'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

function OdemeSonucContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'fail'>('loading');
  const orderId = params.get('orderId') ?? '';
  const email = params.get('email') ?? '';
  const isMock = params.get('mock') === '1';

  useEffect(() => {
    if (isMock) { setStatus('success'); return; }

    const token = params.get('token');
    if (!token) { setStatus('fail'); return; }

    fetch(`${API_URL}/api/v1/store/callback/iyzico`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, status: params.get('status') ?? '' }),
    })
      .then(r => { setStatus(r.ok ? 'success' : 'fail'); })
      .catch(() => setStatus('fail'));
  }, []); // eslint-disable-line

  return (
    <>
      <Navbar />
      <main className="min-h-screen dark:bg-[#070c1a] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-10 text-center">
          {status === 'loading' && (
            <>
              <div className="w-12 h-12 rounded-full border-4 border-[#26496b] border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-500 dark:text-slate-400">Ödeme işleminiz doğrulanıyor…</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Ödeme Başarılı!</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                Siparişiniz alındı. Onay ve detaylar e-posta adresinize gönderildi.
              </p>
              {orderId && email && (
                <a
                  href={`/magaza/siparislerim?orderId=${orderId}&email=${encodeURIComponent(email)}`}
                  className="inline-block px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors mb-3"
                >
                  Siparişimi Görüntüle
                </a>
              )}
              <div>
                <a href="/magaza" className="text-sm text-[#26496b] dark:text-blue-400 hover:underline">
                  Mağazaya Dön →
                </a>
              </div>
            </>
          )}

          {status === 'fail' && (
            <>
              <div className="text-5xl mb-4">❌</div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Ödeme Başarısız</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                Ödemeniz tamamlanamadı. Lütfen tekrar deneyin veya farklı bir ödeme yöntemi kullanın.
              </p>
              <a href="/magaza" className="inline-block px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors">
                Mağazaya Dön
              </a>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default function OdemeSonucPage() {
  return (
    <Suspense>
      <OdemeSonucContent />
    </Suspense>
  );
}

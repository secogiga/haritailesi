'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export default function DownloadPage() {
  const params = useParams();
  const token = params['token'] as string;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }

    fetch(`${API_URL}/api/v1/store/download/${token}`)
      .then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { message?: string };
          throw new Error(body.message ?? 'İndirme bağlantısı geçersiz veya süresi dolmuş.');
        }
        const data = await res.json() as { downloadUrl: string };
        setStatus('success');
        window.location.href = data.downloadUrl;
      })
      .catch(err => {
        setErrorMsg(err instanceof Error ? err.message : 'Bir hata oluştu.');
        setStatus('error');
      });
  }, [token]); // eslint-disable-line

  return (
    <>
      <Navbar />
      <main className="min-h-screen dark:bg-[#070c1a] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-10 text-center">
          {status === 'loading' && (
            <>
              <div className="w-12 h-12 rounded-full border-4 border-[#26496b] border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-500 dark:text-slate-400">İndirme hazırlanıyor…</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">İndirme Başlıyor</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Dosya otomatik olarak indirilecek. Başlamadıysa{' '}
                <a href={`${API_URL}/api/v1/store/download/${token}`}
                  className="text-[#26496b] dark:text-blue-400 hover:underline">
                  buraya tıklayın
                </a>.
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-5xl mb-4">❌</div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">İndirme Başarısız</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">{errorMsg || 'Bağlantı geçersiz veya süresi dolmuş.'}</p>
              <a href="/magaza/siparislerim"
                className="inline-block px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-mavi)] rounded-xl hover:bg-[var(--color-mavi-acik)] transition-colors">
                Siparişlerimi Gör →
              </a>
            </>
          )}
        </div>
      </main>
    </>
  );
}

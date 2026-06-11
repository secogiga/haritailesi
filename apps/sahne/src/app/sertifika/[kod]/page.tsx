'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface CertData {
  certCode: string;
  surveyTitle: string;
  score: number | null;
  maxScore: number | null;
  percent: number | null;
  completedAt: string;
  name: string;
}

export default function SertifikaDogrulaPage() {
  const { kod } = useParams<{ kod: string }>();
  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!kod) return;
    fetch(`${API}/api/v1/surveys/cert/${kod}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json() as Promise<CertData>;
      })
      .then(data => { if (data) setCert(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [kod]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Doğrulanıyor…</div>
        </main>
      </>
    );
  }

  if (notFound || !cert) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl border border-red-100 shadow-sm p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Sertifika Bulunamadı</h1>
            <p className="text-sm text-gray-500 mb-6">Bu sertifika kodu geçersiz veya süresi dolmuş.</p>
            <Link href="/sen-ne-dersin" className="inline-block px-6 py-3 bg-[#26496b] text-white rounded-xl text-sm font-semibold hover:bg-[#1e3a56] transition-colors">
              Sen Ne Dersin?'e Git
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-3xl border border-green-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-b from-green-50 px-8 pt-10 pb-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold mb-3">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Doğrulandı
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">{cert.surveyTitle}</h1>
              <p className="text-sm text-gray-500">Bu sertifika geçerli ve onaylıdır.</p>
            </div>

            {/* Details */}
            <div className="p-8 space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-sm text-gray-500">Ad</span>
                <span className="text-sm font-semibold text-gray-900">{cert.name}</span>
              </div>
              {cert.percent !== null && (
                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Skor</span>
                  <span className="text-sm font-semibold text-green-700">
                    {cert.score}/{cert.maxScore} — {cert.percent}%
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-sm text-gray-500">Tamamlanma tarihi</span>
                <span className="text-sm font-semibold text-gray-900">
                  {new Date(cert.completedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-500">Sertifika kodu</span>
                <span className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded-lg">{cert.certCode}</span>
              </div>
            </div>

            <div className="px-8 pb-8">
              <Link
                href="/sen-ne-dersin/testler"
                className="block w-full py-3 bg-[#26496b] text-white rounded-xl text-sm font-semibold text-center hover:bg-[#1e3a56] transition-colors"
              >
                Testlere Göz At
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

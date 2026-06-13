'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface CertData {
  certCode: string;
  surveyTitle: string;
  surveySlug: string;
  displayName: string | null;
  score: number | null;
  maxScore: number | null;
  percent: number;
  passed: boolean;
  completedAt: string;
}

export default function SertifikaDogrulaPage() {
  const { kod } = useParams<{ kod: string }>();
  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!kod) return;
    fetch(`${API}/api/v1/surveys/certificate/${kod}`)
      .then(r => r.ok ? r.json() as Promise<CertData> : Promise.reject(r.status))
      .then(setCert)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [kod]);

  const date = cert ? new Date(cert.completedAt).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  }) : '';

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-8">
            <Link href="/sen-ne-dersin" className="hover:text-gray-600">Sen Ne Dersin?</Link>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-gray-600 font-medium">Sertifika Doğrulama</span>
          </div>

          {loading && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm h-80 animate-pulse" />
          )}

          {!loading && notFound && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Sertifika Bulunamadı</h2>
              <p className="text-sm text-gray-500 mb-6">Bu doğrulama kodu geçersiz veya sertifika mevcut değil.</p>
              <Link href="/sen-ne-dersin" className="inline-block px-6 py-3 bg-[#26496b] text-white rounded-xl text-sm font-semibold hover:bg-[#1e3a56] transition-colors">
                Sen Ne Dersin?
              </Link>
            </div>
          )}

          {!loading && cert && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-md overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[#26496b] to-[#66aca9]" />

              <div className="px-10 py-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full mb-6">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Sertifika Doğrulandı</span>
                </div>

                <div className="text-[#26496b] font-bold text-2xl tracking-tight mb-1">haritailesi</div>
                <div className="text-xs text-gray-400 tracking-[0.3em] uppercase mb-8">Mesleğin Topluluğu</div>

                <div className="text-xs font-bold tracking-[0.3em] text-[#66aca9] uppercase mb-3">Başarı Sertifikası</div>
                <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#26496b] to-transparent mx-auto mb-8" />

                <p className="text-sm text-gray-500 mb-5">Bu sertifika, aşağıdaki kişinin testi başarıyla tamamladığını onaylar.</p>

                {cert.displayName && (
                  <div className="text-2xl font-bold text-gray-900 mb-6 border-b-2 border-[#26496b]/20 pb-4">
                    {cert.displayName}
                  </div>
                )}

                <div className="bg-gray-50 rounded-2xl px-8 py-5 mb-6">
                  <p className="text-lg font-bold text-gray-900 mb-2">{cert.surveyTitle}</p>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                    {cert.score !== null && cert.maxScore !== null && (
                      <>
                        <span>Skor: <strong>{cert.score}/{cert.maxScore} puan</strong></span>
                        <span>·</span>
                      </>
                    )}
                    <span>Başarı: <strong className="text-green-600">{cert.percent}%</strong></span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mb-6">
                  <span>Tarih: {date}</span>
                  <span>·</span>
                  <span className="text-green-600 font-bold">✓ GEÇTİ</span>
                </div>

                <div className="text-[10px] text-gray-300 font-mono mb-2">Doğrulama Kodu: {cert.certCode}</div>
                <div className="text-xs text-gray-300">haritailesi.org · Sen Ne Dersin?</div>
              </div>

              <div className="h-2 bg-gradient-to-r from-[#26496b] to-[#66aca9]" />

              <div className="px-8 py-5 bg-gray-50 flex items-center justify-between gap-4 flex-wrap">
                <p className="text-xs text-gray-400">Bu sertifika haritailesi.org tarafından düzenlenmiştir.</p>
                <Link
                  href={`/sen-ne-dersin/${cert.surveySlug}`}
                  className="text-xs font-semibold text-[#26496b] hover:underline"
                >
                  Teste Git →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

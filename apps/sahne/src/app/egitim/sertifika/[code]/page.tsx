import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { CertActions } from './_CertActions';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface CertData {
  certificateCode: string;
  issuedAt: string;
  quizScore: number | null;
  trainingTitle: string;
  trainingSlug: string;
  holderName: string;
}

export const metadata: Metadata = { title: 'Sertifika Doğrulama' };

export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  let cert: CertData | null = null;
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/certificates/verify/${code}`, { cache: 'no-store' });
    if (res.ok) cert = await res.json() as CertData;
  } catch {}

  return (
    <>
      <Navbar />
      <style>{`@media print { header, nav { display: none !important; } body { background: white !important; } .print\\:hidden { display: none !important; } }`}</style>
      <main className="min-h-screen dark:bg-[#070c1a] flex items-center justify-center px-4 py-16 print:py-4 print:min-h-0">
        {cert ? (
          <div className="w-full max-w-2xl">
            {/* Sertifika kartı */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-[var(--color-mavi)]/20 shadow-xl overflow-hidden">
              {/* Başlık */}
              <div className="bg-gradient-to-br from-[#1a3350] to-[#26496b] px-8 py-8 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                    <circle cx="170" cy="10" r="80" fill="white" /><circle cx="20" cy="90" r="50" fill="white" />
                  </svg>
                </div>
                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">Haritailesi</p>
                <h1 className="text-2xl font-black mb-1">Başarı Sertifikası</h1>
                <p className="text-white/70 text-sm">Bu sertifika resmi olarak doğrulanmıştır ✓</p>
              </div>

              {/* İçerik */}
              <div className="px-8 py-8 text-center">
                <div className="w-20 h-20 rounded-2xl bg-[var(--color-mavi)]/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🏆</span>
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-slate-100 mb-1">{cert.holderName}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">aşağıdaki kursu başarıyla tamamlamıştır:</p>

                <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl px-6 py-4 mb-6">
                  <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{cert.trainingTitle}</p>
                  {cert.quizScore !== null && (
                    <p className="text-sm text-emerald-600 font-medium mt-1">Quiz Puanı: %{cert.quizScore}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Verilme Tarihi</p>
                    <p className="font-semibold text-gray-800 dark:text-slate-200">
                      {new Date(cert.issuedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Sertifika Kodu</p>
                    <p className="font-mono font-bold text-[var(--color-mavi)] text-sm">{cert.certificateCode}</p>
                  </div>
                </div>

                <CertActions code={cert.certificateCode} trainingTitle={cert.trainingTitle} />

                <div className="flex gap-3 justify-center mt-3 print:hidden">
                  <Link href={`/egitim/${cert.trainingSlug}`}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                    Kursu Gör
                  </Link>
                  <Link href="/egitim"
                    className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors">
                    Tüm Eğitimler
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-5xl mb-4">❌</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Sertifika Bulunamadı</h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6">Bu kod geçersiz veya sertifika mevcut değil.</p>
            <Link href="/egitim" className="text-sm text-[var(--color-mavi)] hover:underline">← Eğitimlere Dön</Link>
          </div>
        )}
      </main>
    </>
  );
}

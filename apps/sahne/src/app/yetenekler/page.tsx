import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { TalentVideoCard } from '@/components/TalentVideoCard';
import { YetenekGonderButton } from '@/components/YetenekGonder';
import { cms } from '@/lib/api';

export default async function YeteneklerPage() {
  const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';
  const talents = await cms.talents();

  return (
    <>
      <Navbar />
      <main className="min-h-screen dark:bg-[#070c1a]">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-3.5 h-3.5 text-[#66aca9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#66aca9]">Cevherler</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
                  Mesleğin ötesinde yetenekler.
                </h1>
                <p className="mt-2 text-gray-500 dark:text-slate-400 max-w-xl">
                  Koordinat hesaplarken aynı zamanda müzik yapıyorlar, fotoğraf sergileri açıyorlar, albüm çıkarıyorlar.
                  Biz de ne cevherler var bu toplulukta.
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0 flex-wrap">
                <YetenekGonderButton variant="solid" label="Yeteneğini Paylaş" />
                <a
                  href={`${MUTFAK_URL}/yetenekler`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium text-[#26496b] dark:text-blue-400 hover:underline"
                >
                  Mutfak&apos;tan paylaş →
                </a>
                <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
                  ← Ana sayfa
                </Link>
              </div>
            </div>

            {/* Stats */}
            {talents.length > 0 && (
              <div className="mt-6 flex items-center gap-6 flex-wrap text-sm text-gray-500 dark:text-slate-400">
                <span>
                  <strong className="text-gray-900 dark:text-slate-100">{talents.length}</strong> paylaşılan yetenek
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ── Grid ──────────────────────────────────────────────────────── */}
        <section className="py-12 sm:py-16 dark:bg-[#070c1a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {talents.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-5">🎸</div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">
                  Henüz paylaşılmış yetenek yok.
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                  İlk olarak sen paylaş! Müzik, fotoğraf, resim veya başka bir yetenekten olabilir.
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <YetenekGonderButton variant="solid" label="Yeteneğini Paylaş" />
                  <a
                    href={`${MUTFAK_URL}/yetenekler`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-sm font-medium text-[#26496b] dark:text-blue-400 hover:underline"
                  >
                    Mutfak&apos;tan paylaş →
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {talents.map((t) => (
                  <TalentVideoCard key={t.id} talent={t} />
                ))}
              </div>
            )}

            <p className="mt-8 text-center text-xs text-gray-400 dark:text-slate-500">
              Yeteneğini topluluğunla paylaşmak istersen{' '}
              <YetenekGonderButton label="buradan gönder" />
              {'. '}
              Videonu gömebilir, sesini duyurabiliriz.
            </p>
          </div>
        </section>

      </main>
    </>
  );
}

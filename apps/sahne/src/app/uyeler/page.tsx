import Link from 'next/link';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Üyeler',
  description: 'Haritailesi topluluğunun harita, geomatik ve kadastro uzmanları.',
};

export default function UyelerPage() {
  const WEB_URL = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';

  return (
    <>
      <Navbar />
      <main className="min-h-screen dark:bg-[#070c1a]">
        <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-teal)] mb-3">
              Sahne Modülleri
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">
              Üyeler
            </h1>
            <p className="text-gray-500 dark:text-slate-400 max-w-2xl">
              Sektörün farklı alanlarından uzmanları ve öğrencileri tanıyın.
            </p>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[var(--color-mavi)]/8 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-[var(--color-mavi)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-5 tracking-wide uppercase">
              Yakında
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              Üye dizini hazırlanıyor
            </h2>
            <p className="text-gray-500 dark:text-slate-400 leading-relaxed mb-8">
              Haritailesi üyelerini keşfedebileceğiniz, meslek alanına ve şehre göre filtreleyebileceğiniz
              üye dizini çok yakında burada olacak.
            </p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mb-6">
              Şimdilik üye dizinine Mutfak üzerinden erişebilirsiniz.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`${process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org'}/uyeler`}
                className="px-6 py-3 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors"
              >
                Mutfak&apos;ta Üye Dizini
              </a>
              <Link
                href={`${WEB_URL}/uye-ol` as `https://${string}`}
                className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 rounded-xl transition-colors"
              >
                Topluluğa Katıl
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

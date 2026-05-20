import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Haritailesi Genç' };

const AVANTAJLAR = [
  'Harita ve geomatik topluluğuna erken katılım',
  'Sektör profesyonelleriyle networking ve etkinlikler',
  'Mentorluk ve kariyer rehberliği',
  'Öğrenci projeleri ve atölye çalışmaları',
  'Sahne içerik platformuna erişim',
];

export default function GencPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-[var(--color-teal)] text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/60 mb-3">Haritailesi</p>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-5">Genç</h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
            Lise, önlisans ve lisans öğrencileri olarak dinamizminle ve enerjinle mesleğine değer kat.
          </p>
        </div>
      </section>

      {/* Üyelik kartları */}
      <section className="py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Üyelik Seçenekleri</p>
          <div className="grid sm:grid-cols-2 gap-5">
            <Link
              href="/genc/basvuru"
              className="group block bg-white rounded-2xl border-2 border-transparent hover:border-[var(--color-teal)] shadow-sm hover:shadow-md p-7 transition-all"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-teal)] bg-[var(--color-teal)]/10 px-2.5 py-1 rounded-full">
                  Ücretsiz
                </span>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-[var(--color-teal)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[var(--color-teal)] transition-colors">
                Öğrenci Üyeliği
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Üniversitede harita, geomatik veya kadastro bölümünde öğreniminize devam ediyorsanız.
              </p>
            </Link>

            <Link
              href="/genc/basvuru"
              className="group block bg-white rounded-2xl border-2 border-transparent hover:border-[var(--color-teal)] shadow-sm hover:shadow-md p-7 transition-all"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-teal)] bg-[var(--color-teal)]/10 px-2.5 py-1 rounded-full">
                  Ücretsiz · 1 Yıl
                </span>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-[var(--color-teal)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[var(--color-teal)] transition-colors">
                Yeni Mezun Üyeliği
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Mezuniyetinizin üzerinden 1 yıldan az süre geçmişse Haritailesi Genç bünyesine katılın.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Avantajlar */}
      <section className="pb-14 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Genç üye olarak neler kazanırsın?</h2>
          <ul className="space-y-3">
            {AVANTAJLAR.map((a) => (
              <li key={a} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="mt-0.5 font-bold text-[var(--color-teal)]">✓</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Mesleğin Gelecekleri */}
      <section className="pb-10 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Seçilmiş Program</p>
          <Link
            href="/meslegin-gelecekleri"
            className="flex items-center justify-between bg-[var(--color-mavi)] text-white rounded-2xl p-6 hover:bg-[var(--color-mavi-acik)] transition-colors group"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-lg">Mesleğin Gelecekleri</span>
                <span className="bg-[var(--color-altin)] text-white text-xs font-bold px-2 py-0.5 rounded-full">25 Kontenjan</span>
              </div>
              <p className="text-white/70 text-sm">Seçilmiş öğrenci gelişim programı — mentorluk, proje, topluluk</p>
            </div>
            <svg className="w-5 h-5 text-white/60 group-hover:text-white shrink-0 ml-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Bireysel üyeliğe yönlendirme */}
      <section className="pb-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-gray-500">
            Mezuniyetinizin üzerinden 1 yıldan fazla süre geçtiyse{' '}
            <Link href="/uye-ol/bireysel" className="text-[var(--color-mavi)] font-medium hover:underline">
              Bireysel Üyelik
            </Link>{' '}
            başvurusuna göz atın.
          </p>
        </div>
      </section>

      {/* Öğrenci Kulüpleri CTA */}
      <section className="pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/genc/ogrenci-kulupler"
            className="flex items-center justify-between bg-white border border-gray-100 shadow-sm rounded-2xl p-6 hover:shadow-md hover:border-[var(--color-teal)] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[var(--color-teal)]/10 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-[var(--color-teal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-[var(--color-teal)] transition-colors">Öğrenci Kulüpleri</p>
                <p className="text-sm text-gray-500 mt-0.5">Üniversitelerdeki harita ve geomatik kulüplerini keşfet</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-[var(--color-teal)] shrink-0 ml-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}

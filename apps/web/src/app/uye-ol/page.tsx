import type { Metadata } from 'next';
import type { Route } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Üye Ol' };

const UYELIK_TIPLERI = [
  {
    href: '/genc',
    baslik: 'Haritailesi Genç',
    alt: 'Öğrenci & Yeni Mezun',
    aciklama: 'Lise, önlisans ve lisans öğrencileri olarak dinamizminle ve enerjinle mesleğine değer kat.',
    etiket: 'Öğrenci • Yeni Mezun (≤1 yıl)',
    ucretsiz: true,
  },
  {
    href: '/uye-ol/bireysel',
    baslik: 'Bireysel Üyelik',
    alt: 'Mesleğin Değer Ortakları',
    aciklama: 'Meslek profesyoneli olarak bilgi, deneyim ve emeğinle mesleğine değer kat.',
    etiket: 'Kamu • Özel • Serbest • Kendi Ofis',
    ucretsiz: false,
  },
  {
    href: '/uye-ol/kurumsal',
    baslik: 'Kurumsal Üyelik',
    alt: 'Mesleğe Değer Katan Markalar',
    aciklama: 'SHKM, LİHKAB ve şirket olarak mesleğine sen de değer kat.',
    etiket: 'SHKM • LİHKAB • Şirketler',
    ucretsiz: false,
  },
];

export default function UyeOlPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-4xl font-bold text-[var(--color-mavi)]">Haritailesi&apos;ne Katıl</h1>
          <p className="mt-3 text-lg text-gray-600">
            Hepimizin kazandığı bir dünya mümkün. Hangi yolculuğa çıkmak istiyorsun?
          </p>
        </div>

        <div className="space-y-4">
          {UYELIK_TIPLERI.map((tip) => (
            <Link
              key={tip.href}
              href={tip.href as Route}
              className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md hover:border-[var(--color-mavi-acik)] border-2 border-transparent transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-[var(--color-mavi)]">
                      {tip.baslik}
                    </h2>
                    {tip.ucretsiz && (
                      <span className="text-xs font-bold text-[var(--color-teal)] bg-[var(--color-teal)]/10 px-2 py-0.5 rounded-full">
                        Ücretsiz
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[var(--color-altin)] mt-0.5">{tip.alt}</p>
                  <p className="mt-2 text-gray-600">{tip.aciklama}</p>
                  <p className="mt-2 text-xs text-gray-400">{tip.etiket}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-[var(--color-mavi-acik)] shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

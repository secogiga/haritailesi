import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Mağaza',
  description: 'Haritailesi mağazası: dijital kaynaklar, üye kitleri ve topluluk ürünleri.',
};

const PRODUCTS = [
  {
    id: '1',
    title: 'Harita Terimleri Sözlüğü',
    subtitle: 'Dijital E-Kitap · PDF',
    price: '49 TL',
    memberPrice: '29 TL',
    badge: 'Dijital İndirme',
    badgeColor: 'bg-blue-100 text-blue-700',
    icon: (
      <svg className="w-10 h-10 text-[#26496b] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    description: "500'den fazla terim ve tanım, Türkçe–İngilizce karşılıklar, kadastro ve geodezi alt alanları dahil. Liseliden uzmana herkes için referans kaynağı.",
    tags: ['PDF', '130 sayfa', 'Türkçe–İngilizce'],
  },
  {
    id: '2',
    title: 'Haritailesi Üye Paketi',
    subtitle: 'Kart + Sticker + Rozet Seti',
    price: '120 TL',
    memberPrice: 'Üyeye Özel',
    badge: 'Fiziksel Ürün',
    badgeColor: 'bg-amber-100 text-amber-700',
    icon: (
      <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    description: 'Özel baskı üye kimlik kartı (metal yüzeyli), topoloji temalı sticker seti (8 parça), mavi kadife rozet. Teslimat: 3–5 iş günü.',
    tags: ['Kargo Dahil', 'Sınırlı Stok', 'Hediye Paketi'],
  },
  {
    id: '3',
    title: 'CBS Proje Şablonları Paketi',
    subtitle: '15 QGIS & ArcGIS Pro Şablonu',
    price: '299 TL',
    memberPrice: '199 TL',
    badge: 'Dijital İndirme',
    badgeColor: 'bg-blue-100 text-blue-700',
    icon: (
      <svg className="w-10 h-10 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    description: 'Kadastro parselleme, yol güzergah analizi, taşkın riski haritası ve daha fazlası. Her şablon hazır semboloji, lejant ve A3 baskı düzeni içerir.',
    tags: ['15 Şablon', '.qgz + .aprx', 'Süresiz Lisans'],
  },
];

export default function MagazaPage() {
  const webUrl = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';

  return (
    <>
      <Navbar />
      <main className="min-h-screen dark:bg-[#070c1a]">
        {/* Hero */}
        <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-teal)] mb-3">
              Sahne Modülleri
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">
              Mağaza
            </h1>
            <p className="text-gray-500 dark:text-slate-400 max-w-2xl">
              Dijital kaynaklar, eğitim materyalleri ve topluluk ürünleri.
              Üyeler için özel fiyatlar ve öncelikli erişim.
            </p>
          </div>
        </section>

        {/* Products */}
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {PRODUCTS.map((product) => (
                <article
                  key={product.id}
                  className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700 transition-all p-6"
                >
                  {/* Icon area */}
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center mb-5">
                    {product.icon}
                  </div>

                  <span className={`self-start text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3 ${product.badgeColor}`}>
                    {product.badge}
                  </span>

                  <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-0.5">
                    {product.title}
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">{product.subtitle}</p>

                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-4 flex-1">
                    {product.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {product.tags.map((tag) => (
                      <span key={tag} className="text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
                    <div>
                      <div className="text-lg font-bold text-gray-900 dark:text-slate-100">{product.price}</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{product.memberPrice}</div>
                    </div>
                    <a
                      href={`${webUrl}/uye-ol`}
                      className="px-4 py-2 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors"
                    >
                      Satın Al
                    </a>
                  </div>
                </article>
              ))}
            </div>

            {/* Info banner */}
            <div className="mt-10 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#26496b]/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#26496b] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-0.5">
                  Üye Fiyatlarına Erişin
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Tüm dijital ürünlerde %20–40 üye indirimi, kargosuz fiziksel ürünler ve aylık yeni içerik erişimi.
                  Ücretsiz kargolama 500 TL üzeri siparişlerde geçerlidir.
                </p>
              </div>
              <a
                href={`${webUrl}/uye-ol`}
                className="shrink-0 px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors"
              >
                Üye Ol
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

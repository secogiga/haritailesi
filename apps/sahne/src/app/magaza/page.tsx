import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { PageActionTracker } from '@/components/PageActionTracker';
import MagazaClient from './_client';
import { HeroNewsletterBanner } from '@/components/HeroNewsletterBanner';

export const metadata: Metadata = {
  title: 'Mağaza',
  description: 'Haritailesi mağazası: dijital kaynaklar, üye kitleri ve topluluk ürünleri.',
};

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export interface ProductVariant {
  name: string;
  values: string[];
  priceModifier?: number;
}

export interface StoreProduct {
  id: string;
  slug: string;
  ownerType: 'vakif' | 'seller';
  sellerId: string | null;
  title: string;
  subtitle: string | null;
  description: string;
  type: 'digital' | 'physical' | 'app';
  price: number;
  memberPrice: number | null;
  images: string[];
  downloadUrl: string | null;
  stock: number | null;
  tags: string[];
  variants: ProductVariant[];
  badgeLabel: string | null;
  badgeColor: string | null;
  status: string;
  sortOrder: number;
}

async function getInitialProducts(): Promise<{ data: StoreProduct[]; total: number; hasMore: boolean }> {
  try {
    const res = await fetch(`${API_URL}/api/v1/store/products?limit=24&offset=0`, { next: { revalidate: 60 } });
    if (!res.ok) return { data: [], total: 0, hasMore: false };
    return res.json() as Promise<{ data: StoreProduct[]; total: number; hasMore: boolean }>;
  } catch {
    return { data: [], total: 0, hasMore: false };
  }
}

export default async function MagazaPage() {
  const { data: products, total, hasMore } = await getInitialProducts();
  const webUrl = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';
  const sahneUrl = process.env['NEXT_PUBLIC_SAHNE_URL'] ?? 'http://localhost:3002';

  const digitalCount = products.filter(p => p.type === 'digital').length;
  const physicalCount = products.filter(p => p.type === 'physical').length;

  return (
    <>
      <Navbar />
      <PageActionTracker actionId="v-magaza" />
      <main className="min-h-screen bg-[#f5f7fa] dark:bg-[#070c1a]">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-[#0e1c2f] dark:bg-[#060d1a]">
          {/* Topo doku */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ccircle cx='40' cy='40' r='38' fill='none' stroke='%2366aca9' stroke-width='0.5'/%3E%3Ccircle cx='40' cy='40' r='28' fill='none' stroke='%2366aca9' stroke-width='0.5'/%3E%3Ccircle cx='40' cy='40' r='18' fill='none' stroke='%2366aca9' stroke-width='0.5'/%3E%3Ccircle cx='40' cy='40' r='8' fill='none' stroke='%2366aca9' stroke-width='0.5'/%3E%3C/svg%3E")`,
              backgroundSize: '80px 80px',
            }}
          />
          {/* Gradient ışıklar */}
          <div aria-hidden className="absolute -top-40 right-1/3 w-[600px] h-[400px] rounded-full bg-[#66aca9]/8 blur-[100px] pointer-events-none" />
          <div aria-hidden className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full bg-[#26496b]/15 blur-[80px] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

              {/* Sol: Metin + aksiyonlar */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#66aca9]/15 border border-[#66aca9]/30 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#66aca9] animate-pulse" />
                  <span className="text-xs font-semibold text-[#66aca9] tracking-widest uppercase">Sahne Mağazası</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-4">
                  Harita<span className="text-[#66aca9]">ilesi</span>
                  <br />
                  <span className="font-light text-white/60">Mağaza</span>
                </h1>

                <p className="text-white/50 max-w-sm text-sm sm:text-base leading-relaxed mb-8">
                  Dijital kaynaklar, eğitim materyalleri ve topluluk ürünleri. Üyeler için özel fiyatlar ve öncelikli erişim.
                </p>

                {/* CTA satırı */}
                <div className="flex items-center gap-3 flex-wrap mb-10">
                  <a
                    href={`${sahneUrl}/magaza/satici-ol`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#66aca9]/15 text-[#66aca9] border border-[#66aca9]/30 rounded-xl hover:bg-[#66aca9]/25 hover:border-[#66aca9]/50 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Ürününü Mağazaya Ekle
                  </a>
                </div>

                {/* İstatistikler */}
                <div className="flex items-center gap-8 pt-8 border-t border-white/10">
                  {[
                    { label: 'Ürün', value: total },
                    { label: 'Dijital', value: digitalCount },
                    { label: 'Fiziksel', value: physicalCount },
                  ].map(s => (
                    <div key={s.label}>
                      <p className="text-2xl font-black text-white">{s.value}</p>
                      <p className="text-xs text-white/35 font-medium uppercase tracking-wide mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sağ: Ürün önizleme kartları + newsletter */}
              <div className="hidden lg:flex flex-col gap-5 -mt-10">
                {/* Kart stack */}
                <div className="relative h-72 -translate-y-[15px]">
                  {/* Arka kart (3.) */}
                  <div className="absolute right-1 top-7 w-64 h-[268px] rounded-2xl bg-white/5 border border-white/8 rotate-12 scale-90" />
                  {/* Orta kart (2.) */}
                  <div className="absolute right-4 top-3 w-64 h-[268px] rounded-2xl bg-white/8 border border-white/12 rotate-6" />
                  {/* Üyelik rozeti */}
                  <div className="absolute bg-[#0e1c2f] border border-[#66aca9]/50 rounded-xl px-3.5 py-2.5 shadow-xl shadow-black/40 rotate-12 select-none" style={{ top: '60px', left: '-270px' }}>
                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mb-0.5">Üye Avantajı</p>
                    <p className="text-sm font-black text-white">%20–40 İndirim</p>
                  </div>

                  {/* Ön kart (1.) — featured product veya placeholder */}
                  <div className="absolute right-10 -top-5 w-64 rounded-2xl bg-[#1a2e45] border border-white/15 shadow-2xl overflow-hidden -rotate-3">
                    {products[0] ? (
                      <>
                        <div className="aspect-[4/3] overflow-hidden bg-[#0e1c2f]">
                          {products[0].images[0] ? (
                            <img src={products[0].images[0]} alt={products[0].title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">
                              {products[0].type === 'digital' ? '📄' : products[0].type === 'app' ? '📱' : '📦'}
                            </div>
                          )}
                        </div>
                        <div className="p-3.5">
                          <span className="text-[10px] text-[#66aca9] font-semibold uppercase tracking-wide">
                            {products[0].type === 'digital' ? 'Dijital' : products[0].type === 'app' ? 'Uygulama' : 'Fiziksel'}
                          </span>
                          <p className="text-sm font-bold text-white mt-0.5 line-clamp-1">{products[0].title}</p>
                          <p className="text-base font-black text-white mt-1">
                            ₺{(products[0].price / 100).toFixed(0)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="aspect-[4/3] bg-gradient-to-br from-[#66aca9]/20 to-[#26496b]/30 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl mb-2 opacity-50">🗺️</div>
                            <p className="text-[10px] text-white/30 font-medium">Ürün yok</p>
                          </div>
                        </div>
                        <div className="p-3.5">
                          <div className="h-2 bg-white/10 rounded-full w-2/3 mb-2" />
                          <div className="h-3 bg-white/15 rounded-full w-full mb-1.5" />
                          <div className="h-4 bg-white/20 rounded-full w-1/2" />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Newsletter banner */}
                <div className="w-[calc(100%-1.5rem)] ml-auto translate-x-9">
                  <HeroNewsletterBanner
                    count={250}
                    avatars
                    bannerSub="yeni ürün ve fırsatları ilk öğreniyor"
                    modalTitle="Yeni ürünleri kaçırma"
                    modalSub="Haritailesi mağazasındaki yeni ürünler ve özel fırsatlar doğrudan e-postana gelsin."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Wave separator */}
          <div
            className="absolute bottom-0 left-0 right-0 h-8 bg-[#f5f7fa] dark:bg-[#070c1a]"
            style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }}
          />
        </section>


        {/* ── ÜRÜNLER ─────────────────────────────────────────────────────── */}
        <MagazaClient products={products} total={total} initialHasMore={hasMore} webUrl={webUrl} />

        {/* ── ÜYELİK BANNER ───────────────────────────────────────────────── */}
        <section className="pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0e1c2f] to-[#1a3550] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div aria-hidden className="absolute right-0 top-0 w-64 h-full opacity-5"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='28' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
                  backgroundSize: '60px 60px',
                }}
              />
              <div className="w-10 h-10 rounded-xl bg-[#66aca9]/20 border border-[#66aca9]/30 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#66aca9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-white mb-0.5">Üye Fiyatlarına Erişin</p>
                <p className="text-sm text-white/50">
                  Tüm dijital ürünlerde %20–40 üye indirimi, kargosuz fiziksel ürünler.
                </p>
              </div>
              <a
                href={`${webUrl}/uye-ol`}
                className="shrink-0 px-5 py-2.5 text-sm font-bold text-[#0e1c2f] bg-[#66aca9] hover:bg-[#7bbcba] rounded-xl transition-colors"
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

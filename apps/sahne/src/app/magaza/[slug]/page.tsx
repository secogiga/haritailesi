import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { PageActionTracker } from '@/components/PageActionTracker';
import type { StoreProduct } from '../page';
import CheckoutButton from './_checkout';
import { ReviewsSection } from './_reviews';
import { RelatedProducts } from './_related';
import { StockNotifyButton } from './_stock-notify';
import { ProductGallery } from './_gallery';
import { PriceBlock } from './_price';
import { BundleContents } from './_bundle';
import { ShareMenu } from '@/components/ShareMenu';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

async function getProduct(slug: string): Promise<StoreProduct | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/store/products/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<StoreProduct>;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Ürün Bulunamadı' };
  return {
    title: product.title,
    description: product.description.slice(0, 160),
  };
}

const TYPE_LABELS: Record<string, string> = { digital: 'Dijital', physical: 'Fiziksel', app: 'Uygulama' };
const DEFAULT_BADGE_CLS: Record<string, string> = {
  digital: 'bg-blue-100 text-blue-700',
  physical: 'bg-amber-100 text-amber-700',
  app: 'bg-purple-100 text-purple-700',
};

function fmt(kurus: number) {
  return `₺${(kurus / 100).toFixed(0)}`;
}

export default async function UrunDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.images,
    sku: product.slug,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'TRY',
      price: (product.price / 100).toFixed(2),
      availability: product.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Haritailesi Vakfı' },
    },
  };

  const webUrl = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';
  const badgeCls = product.badgeColor ?? DEFAULT_BADGE_CLS[product.type] ?? 'bg-gray-100 text-gray-600';
  const badgeLabel = product.badgeLabel ?? TYPE_LABELS[product.type];
  const outOfStock = product.stock !== null && product.stock === 0;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <PageActionTracker actionId="v-magaza-urun" />
      <main className="min-h-screen dark:bg-[#070c1a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-400 mb-8">
            <a href="/magaza" className="hover:text-[#26496b] dark:hover:text-blue-400 transition-colors">Mağaza</a>
            <span className="mx-2">›</span>
            <span className="text-gray-700 dark:text-slate-300">{product.title}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Sol: Görsel Galerisi */}
            <div className="flex flex-col gap-4">
              <ProductGallery images={product.images} title={product.title} type={product.type} />
            </div>

            {/* Sağ: Bilgiler */}
            <div className="flex flex-col">
              <span className={`self-start text-xs font-semibold px-2.5 py-0.5 rounded-full mb-4 ${badgeCls}`}>
                {badgeLabel}
              </span>

              <div className="flex items-start gap-2 mb-2">
                <h1 className="flex-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
                  {product.title}
                </h1>
                <ShareMenu title={product.title} size="sm" />
              </div>
              {product.subtitle && (
                <p className="text-sm text-gray-400 dark:text-slate-500 mb-4">{product.subtitle}</p>
              )}

              <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
                {product.description}
              </p>

              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {product.tags.map(tag => (
                    <span key={tag} className="text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {product.stock !== null && (
                <p className={`text-sm mb-4 font-medium ${product.stock === 0 ? 'text-red-500' : product.stock <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {product.stock === 0 ? '• Stok tükendi' : product.stock <= 5 ? `• Son ${product.stock} ürün` : `• Stokta mevcut`}
                </p>
              )}

              <div className="border-t border-gray-100 dark:border-slate-800 pt-6 mt-auto">
                <div className="mb-4">
                  <PriceBlock price={product.price} memberPrice={product.memberPrice} />
                </div>

                {outOfStock ? (
                  <StockNotifyButton slug={product.slug} />
                ) : (
                  <div className="space-y-3">
                    <CheckoutButton product={product} />
                    <p className="text-xs text-center text-gray-400 dark:text-slate-500">
                      {product.type === 'digital' ? 'Ödeme sonrası indirme linki e-postanıza gönderilir.' : 'Ödeme sonrası 3–5 iş günü içinde kargo.'}
                    </p>
                    <a href="/magaza/siparislerim" className="block text-xs text-center text-[#26496b] dark:text-blue-400 hover:underline">
                      Mevcut siparişimi sorgula →
                    </a>
                  </div>
                )}

                {product.ownerType === 'seller' && (
                  <p className="mt-3 text-xs text-gray-400 dark:text-slate-500 text-center">
                    Bu ürün bağımsız bir satıcı tarafından sunulmaktadır.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bundle içerikleri */}
          <BundleContents slug={product.slug} bundlePrice={product.price} />

          {/* Yorumlar + Benzer Ürünler */}
          <div className="mt-8 pt-6">
            <ReviewsSection slug={product.slug} productId={product.id} />
            <RelatedProducts slug={product.slug} />
          </div>
        </div>
      </main>
    </>
  );
}

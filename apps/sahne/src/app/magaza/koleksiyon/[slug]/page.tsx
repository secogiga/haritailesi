import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { PageActionTracker } from '@/components/PageActionTracker';
import MagazaClient from '../../_client';
import { CartButton } from '@/components/CartDrawer';
import type { StoreProduct } from '../../page';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface Collection {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  productIds: string[];
}

async function getCollection(slug: string): Promise<Collection | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/store/collections/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json() as Promise<Collection>;
  } catch { return null; }
}

async function getCollectionProducts(slug: string): Promise<{ data: StoreProduct[]; total: number; hasMore: boolean }> {
  try {
    const res = await fetch(`${API_URL}/api/v1/store/products?collection=${slug}&limit=24&offset=0`, { next: { revalidate: 60 } });
    if (!res.ok) return { data: [], total: 0, hasMore: false };
    return res.json() as Promise<{ data: StoreProduct[]; total: number; hasMore: boolean }>;
  } catch { return { data: [], total: 0, hasMore: false }; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const col = await getCollection(slug);
  if (!col) return { title: 'Koleksiyon Bulunamadı' };
  return { title: col.title, description: col.description ?? undefined };
}

export default async function KoleksiyonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [col, { data: products, total, hasMore }] = await Promise.all([
    getCollection(slug),
    getCollectionProducts(slug),
  ]);

  if (!col) notFound();

  const webUrl = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';
  const sahneUrl = process.env['NEXT_PUBLIC_SAHNE_URL'] ?? 'http://localhost:3002';

  return (
    <>
      <Navbar />
      <PageActionTracker actionId="v-magaza-koleksiyon" />
      <main className="min-h-screen dark:bg-[#070c1a]">
        {/* Hero */}
        <section
          className="relative bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-12 sm:py-16 overflow-hidden"
        >
          {col.coverImage && (
            <div className="absolute inset-0 opacity-10">
              <img src={col.coverImage} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <nav className="text-xs text-gray-400 mb-3">
                  <a href="/magaza" className="hover:text-[#26496b] transition-colors">Mağaza</a>
                  <span className="mx-1.5">›</span>
                  <span className="text-gray-600 dark:text-slate-300">{col.title}</span>
                </nav>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">
                  {col.title}
                </h1>
                {col.description && (
                  <p className="text-gray-500 dark:text-slate-400 max-w-2xl">{col.description}</p>
                )}
                <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">{total} ürün</p>
              </div>
              <CartButton />
            </div>
          </div>
        </section>

        <MagazaClient products={products} total={total} initialHasMore={hasMore} webUrl={webUrl} collectionSlug={slug} />
      </main>
    </>
  );
}

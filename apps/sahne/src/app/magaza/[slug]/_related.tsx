import type { StoreProduct } from '../page';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

async function getRelated(slug: string): Promise<StoreProduct[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/store/products/${slug}/related`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json() as Promise<StoreProduct[]>;
  } catch { return []; }
}

function fmt(kurus: number) { return `₺${(kurus / 100).toFixed(0)}`; }

export async function RelatedProducts({ slug }: { slug: string }) {
  const products = await getRelated(slug);
  if (!products.length) return null;

  return (
    <div className="mt-10 pt-8 border-t border-gray-100 dark:border-slate-800">
      <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">Benzer Ürünler</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {products.map(p => (
          <a key={p.id} href={`/magaza/${p.slug}`}
            className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-3 hover:shadow-md transition-shadow">
            <div className="w-full aspect-square bg-gray-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-2xl mb-2 overflow-hidden">
              {p.images[0] ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" /> : (p.type === 'digital' ? '📄' : p.type === 'app' ? '📱' : '📦')}
            </div>
            <p className="text-xs font-semibold text-gray-900 dark:text-slate-100 leading-snug line-clamp-2">{p.title}</p>
            <p className="text-xs text-[#26496b] dark:text-blue-400 font-bold mt-1">{fmt(p.price)}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

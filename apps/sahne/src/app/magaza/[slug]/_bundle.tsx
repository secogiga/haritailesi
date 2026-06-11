import type { StoreProduct } from '../page';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface BundleItem {
  productId: string;
  quantity: number;
  product: StoreProduct | null;
}

async function getBundleContents(slug: string): Promise<BundleItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/store/products/${slug}/bundle`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json() as Promise<BundleItem[]>;
  } catch { return []; }
}

function fmt(kurus: number) { return `₺${(kurus / 100).toFixed(0)}`; }

export async function BundleContents({ slug, bundlePrice }: { slug: string; bundlePrice: number }) {
  const items = await getBundleContents(slug);
  if (!items.length) return null;

  const totalIndividual = items.reduce((s, i) => s + (i.product?.price ?? 0) * i.quantity, 0);
  const saving = totalIndividual - bundlePrice;

  return (
    <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Bu Pakette Neler Var?</h3>
        {saving > 0 && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
            {fmt(saving)} tasarruf
          </span>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-3">
            <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-slate-700 flex items-center justify-center text-xl shrink-0 overflow-hidden">
              {item.product?.images[0]
                ? <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                : (item.product?.type === 'digital' ? '📄' : item.product?.type === 'app' ? '📱' : '📦')}
            </div>
            <div className="flex-1 min-w-0">
              {item.product ? (
                <a href={`/magaza/${item.product.slug}`} className="text-sm font-semibold text-gray-900 dark:text-slate-100 hover:text-[#26496b] dark:hover:text-blue-400 truncate block">
                  {item.product.title}
                </a>
              ) : (
                <p className="text-sm text-gray-400 dark:text-slate-500">Ürün mevcut değil</p>
              )}
              {item.quantity > 1 && (
                <p className="text-xs text-gray-400 dark:text-slate-500">{item.quantity} adet</p>
              )}
            </div>
            {item.product && (
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 shrink-0">
                {fmt(item.product.price * item.quantity)}
              </p>
            )}
          </div>
        ))}
      </div>

      {saving > 0 && (
        <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-800 flex justify-between text-sm">
          <span className="text-gray-500 dark:text-slate-400">Ayrı ayrı alsan</span>
          <span className="font-semibold text-gray-400 dark:text-slate-500 line-through">{fmt(totalIndividual)}</span>
        </div>
      )}
    </div>
  );
}

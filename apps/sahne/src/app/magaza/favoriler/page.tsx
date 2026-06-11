'use client';

import { useEffect, useState } from 'react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import Navbar from '@/components/Navbar';
import type { StoreProduct } from '../page';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

function fmt(k: number) { return `₺${(k / 100).toFixed(0)}`; }

export default function FavorilerPage() {
  const { productIds, toggle } = useWishlist();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productIds.size) { setLoading(false); return; }
    fetch(`${API_URL}/api/v1/store/products`)
      .then(r => r.json())
      .then((all: StoreProduct[]) => setProducts(all.filter(p => productIds.has(p.id))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productIds.size]); // eslint-disable-line

  return (
    <>
      <Navbar />
      <main className="min-h-screen dark:bg-[#070c1a]">
        <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-10">
          <div className="max-w-5xl mx-auto px-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Favorilerim</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{productIds.size} ürün kaydedildi</p>
          </div>
        </section>
        <section className="py-8">
          <div className="max-w-5xl mx-auto px-4">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map(i => <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 animate-pulse" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">♡</div>
                <p className="text-gray-500 dark:text-slate-400 mb-4">Henüz favori ürün eklemediniz.</p>
                <a href="/magaza" className="text-sm text-[#26496b] dark:text-blue-400 hover:underline font-medium">Mağazaya Göz At →</a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => (
                  <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <a href={`/magaza/${p.slug}`} className="text-sm font-bold text-gray-900 dark:text-slate-100 hover:text-[#26496b] dark:hover:text-blue-400 flex-1">{p.title}</a>
                      <button onClick={() => toggle(p.id)} className="text-red-500 hover:text-red-700 text-xl ml-2 shrink-0" title="Favorilerden çıkar">♥</button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 flex-1 line-clamp-2 mb-4">{p.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-slate-100">{fmt(p.price)}</p>
                        {p.memberPrice && <p className="text-xs text-emerald-600 dark:text-emerald-400">Üye: {fmt(p.memberPrice)}</p>}
                      </div>
                      <button onClick={() => addToCart(p)}
                        className="px-3 py-2 text-sm font-semibold text-white bg-[var(--color-mavi)] rounded-xl hover:bg-[var(--color-mavi-acik)] transition-colors">
                        Sepete Ekle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

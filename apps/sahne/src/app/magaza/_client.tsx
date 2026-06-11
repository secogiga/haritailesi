'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { StoreProduct } from './page';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { trackAddToCart } from '@/components/GA4Provider';
import { useExchangeRate } from '@/hooks/useExchangeRate';

const TYPE_LABELS: Record<string, string> = { digital: 'Dijital', physical: 'Fiziksel', app: 'Uygulama' };
const TYPE_ACCENT: Record<string, string> = {
  digital: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  physical: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  app: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};
const TYPE_DOT: Record<string, string> = {
  digital: 'bg-blue-400',
  physical: 'bg-amber-400',
  app: 'bg-violet-400',
};

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const PAGE_SIZE = 24;

function fmt(kurus: number) {
  return `₺${(kurus / 100).toFixed(0)}`;
}

function discountPct(price: number, memberPrice: number): number {
  return Math.round((1 - memberPrice / price) * 100);
}

interface Props {
  products: StoreProduct[];
  total: number;
  initialHasMore: boolean;
  webUrl: string;
  collectionSlug?: string;
}

export default function MagazaClient({ products: initialProducts, total: initialTotal, initialHasMore, collectionSlug }: Props) {
  const [filter, setFilter] = useState<'all' | 'digital' | 'physical' | 'app'>('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [products, setProducts] = useState<StoreProduct[]>(initialProducts);
  const [offset, setOffset] = useState(initialProducts.length);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [total, setTotal] = useState(initialTotal);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addToCart, items: cartItems } = useCart();
  const { toggle: toggleWishlist, isWishlisted } = useWishlist();
  const [added, setAdded] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const { tryToUsd } = useExchangeRate();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const fetchProducts = useCallback(async (type: string, q: string, off: number, append: boolean) => {
    if (append) setLoadingMore(true); else setSearching(true);
    try {
      const qs = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(off) });
      if (type !== 'all') qs.set('type', type);
      if (q.trim()) qs.set('q', q.trim());
      if (collectionSlug) qs.set('collection', collectionSlug);
      const res = await fetch(`${API_URL}/api/v1/store/products?${qs.toString()}`);
      if (!res.ok) return;
      const data = await res.json() as { data: StoreProduct[]; total: number; hasMore: boolean };
      setProducts(prev => append ? [...prev, ...data.data] : data.data);
      setTotal(data.total);
      setHasMore(data.hasMore);
      setOffset(off + data.data.length);
    } finally {
      if (append) setLoadingMore(false); else setSearching(false);
    }
  }, [collectionSlug]);

  useEffect(() => {
    void fetchProducts(filter, debouncedQuery, 0, false);
  }, [filter, debouncedQuery, fetchProducts]);

  function loadMore() {
    void fetchProducts(filter, debouncedQuery, offset, true);
  }

  function handleAddToCart(e: React.MouseEvent, product: StoreProduct) {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    trackAddToCart({ id: product.id, title: product.title, price: product.price, type: product.type });
    setAdded(product.id);
    setTimeout(() => setAdded(null), 1500);
  }

  function handleWishlist(e: React.MouseEvent, productId: string) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(productId);
  }

  const FILTERS = [
    { id: 'all' as const, label: 'Tümü', count: total },
    { id: 'digital' as const, label: 'Dijital' },
    { id: 'physical' as const, label: 'Fiziksel' },
    { id: 'app' as const, label: 'Uygulama' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* ── YAPIŞKAN FİLTRE BAR ────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 py-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-[#f5f7fa]/80 dark:bg-[#070c1a]/80 backdrop-blur-md border-b border-black/5 dark:border-white/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">

          {/* Tip filtreleri */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filter === f.id
                    ? 'bg-[#0e1c2f] text-white shadow-sm dark:bg-white dark:text-[#0e1c2f]'
                    : 'bg-white dark:bg-white/5 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200/70 dark:border-white/10'
                }`}
              >
                {f.id !== 'all' && (
                  <span className={`w-1.5 h-1.5 rounded-full ${filter === f.id ? 'bg-[#66aca9]' : TYPE_DOT[f.id]}`} />
                )}
                {f.label}
                {f.count !== undefined && (
                  <span className={`text-[10px] ${filter === f.id ? 'opacity-60' : 'opacity-40'}`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Arama */}
          <div className="relative sm:ml-auto w-full sm:w-56">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ürün ara…"
              className="w-full pl-8 pr-8 py-2 text-sm bg-white dark:bg-white/5 border border-gray-200/70 dark:border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 focus:border-[#26496b]/40 dark:focus:ring-[#66aca9]/20 dark:text-slate-100 placeholder-gray-400 transition-all"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── ÜRÜN GRIDI ───────────────────────────────────────────────────── */}
      <div className="py-8">

        {/* Yükleniyor skeleton */}
        {searching && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white dark:bg-white/5 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100 dark:bg-white/10" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-100 dark:bg-white/10 rounded-full w-1/3" />
                  <div className="h-4 bg-gray-100 dark:bg-white/10 rounded-full w-3/4" />
                  <div className="h-3 bg-gray-100 dark:bg-white/10 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!searching && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-3xl mb-4">🔍</div>
            <p className="text-base font-semibold text-gray-700 dark:text-slate-300 mb-1">
              {debouncedQuery ? `"${debouncedQuery}" bulunamadı` : 'Bu kategoride ürün yok'}
            </p>
            <p className="text-sm text-gray-400 dark:text-slate-500">Farklı bir arama deneyin</p>
          </div>
        )}

        {!searching && products.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(product => {
                const outOfStock = product.stock !== null && product.stock === 0;
                const lowStock = product.stock !== null && product.stock > 0 && product.stock <= 5;
                const inCart = cartItems.some(i => i.productId === product.id);
                const justAdded = added === product.id;
                const wishlisted = isWishlisted(product.id);
                const isHovered = hovered === product.id;
                const typeCls = TYPE_ACCENT[product.type] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20';
                const hasImage = product.images.length > 0;
                const usd = tryToUsd(product.price);

                return (
                  <article
                    key={product.id}
                    onMouseEnter={() => setHovered(product.id)}
                    onMouseLeave={() => setHovered(null)}
                    className={`group relative flex flex-col bg-white dark:bg-[#111827] rounded-2xl overflow-hidden transition-all duration-300 ${
                      outOfStock ? 'opacity-60' : 'hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/40'
                    }`}
                  >
                    {/* Görsel */}
                    <a href={`/magaza/${product.slug}`} className="relative block aspect-square overflow-hidden bg-gray-50 dark:bg-[#1a2535]">
                      {hasImage ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-105' : 'scale-100'}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl opacity-30">
                            {product.type === 'digital' ? '📄' : product.type === 'app' ? '📱' : '📦'}
                          </span>
                        </div>
                      )}

                      {/* Overlay gradyan */}
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

                      {/* Tip badge — sol üst */}
                      <div className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-sm ${typeCls}`}>
                        <span className={`w-1 h-1 rounded-full ${TYPE_DOT[product.type] ?? 'bg-gray-400'}`} />
                        {product.badgeLabel ?? TYPE_LABELS[product.type]}
                      </div>

                      {/* Favori — sağ üst */}
                      <button
                        onClick={e => handleWishlist(e, product.id)}
                        className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
                          wishlisted
                            ? 'bg-red-500/90 text-white'
                            : 'bg-black/20 text-white/70 hover:bg-black/40 hover:text-white opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>

                      {/* Stok tükendi overlay */}
                      {outOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-xs font-bold text-white bg-black/60 px-3 py-1 rounded-full">Stok Tükendi</span>
                        </div>
                      )}

                      {/* Detaya git — hover'da ortada */}
                      <div className={`absolute inset-0 flex items-end justify-center pb-4 transition-opacity duration-300 ${isHovered && !outOfStock ? 'opacity-100' : 'opacity-0'}`}>
                        <span className="text-[11px] font-semibold text-white/80 border border-white/30 px-3 py-1 rounded-full backdrop-blur-sm">
                          Detayı Gör
                        </span>
                      </div>
                    </a>

                    {/* Kart alt bilgi */}
                    <div className="flex flex-col flex-1 p-3.5">

                      {/* Başlık */}
                      <a href={`/magaza/${product.slug}`} className="block flex-1">
                        <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-snug line-clamp-2 mb-0.5 hover:text-[#26496b] dark:hover:text-[#66aca9] transition-colors">
                          {product.title}
                        </h2>
                        {product.subtitle && (
                          <p className="text-[11px] text-gray-400 dark:text-slate-500 line-clamp-1">{product.subtitle}</p>
                        )}
                      </a>

                      {/* Stok uyarısı */}
                      {lowStock && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1.5">
                          ⚡ Son {product.stock} ürün
                        </p>
                      )}

                      {/* Fiyat + Aksiyon */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                        <div>
                          <div className="text-base font-black text-gray-900 dark:text-slate-100 leading-none">
                            {fmt(product.price)}
                          </div>
                          {product.memberPrice ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                Üye {fmt(product.memberPrice)}
                              </span>
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 rounded font-bold">
                                -%{discountPct(product.price, product.memberPrice)}
                              </span>
                            </div>
                          ) : usd ? (
                            <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{usd}</div>
                          ) : null}
                        </div>

                        {!outOfStock && (
                          <button
                            onClick={e => handleAddToCart(e, product)}
                            className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                              justAdded
                                ? 'bg-emerald-500 text-white scale-95'
                                : inCart
                                  ? 'bg-[#26496b]/10 dark:bg-[#66aca9]/10 text-[#26496b] dark:text-[#66aca9] border border-[#26496b]/20'
                                  : 'bg-[#0e1c2f] dark:bg-[#66aca9] text-white hover:bg-[#1a3550] dark:hover:bg-[#7bbcba]'
                            }`}
                          >
                            {justAdded ? '✓' : inCart ? 'Sepette' : '+'}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex flex-col items-center gap-2 mt-12 pb-4">
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  {products.length} / {total} ürün
                </p>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="group flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-white dark:bg-white/5 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-white/10 rounded-full hover:bg-[#0e1c2f] hover:text-white hover:border-transparent dark:hover:bg-white/10 disabled:opacity-50 transition-all"
                >
                  {loadingMore ? (
                    <>
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Yükleniyor
                    </>
                  ) : (
                    <>
                      Daha Fazla
                      <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

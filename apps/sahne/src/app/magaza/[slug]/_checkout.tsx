'use client';

import { useState } from 'react';
import type { StoreProduct, ProductVariant } from '../page';
import { useCart } from '@/contexts/CartContext';
import { CartButton } from '@/components/CartDrawer';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const SAHNE_URL = process.env['NEXT_PUBLIC_SAHNE_URL'] ?? 'http://localhost:3002';

function fmt(kurus: number) {
  return `₺${(kurus / 100).toFixed(0)}`;
}

// ─── Variant Seçici ────────────────────────────────────────────────────────────

export function VariantSelector({
  variants,
  selected,
  onChange,
}: {
  variants: ProductVariant[];
  selected: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  if (!variants.length) return null;
  return (
    <div className="space-y-3 mb-4">
      {variants.map(v => (
        <div key={v.name}>
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            {v.name}: <span className="text-gray-900 dark:text-slate-100 normal-case font-bold">{selected[v.name] ?? '—'}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {v.values.map(val => (
              <button key={val} onClick={() => onChange({ ...selected, [v.name]: val })}
                className={`px-3 py-1.5 text-sm rounded-xl border transition-all ${selected[v.name] === val
                  ? 'bg-[#26496b] text-white border-[#26496b]'
                  : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-[#26496b] hover:text-[#26496b]'}`}>
                {val}
                {v.priceModifier ? <span className="text-xs ml-1 opacity-75">{v.priceModifier > 0 ? `+${fmt(v.priceModifier)}` : fmt(v.priceModifier)}</span> : null}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── EFT Seçeneği ──────────────────────────────────────────────────────────────

function EftInfo({ product }: { product: StoreProduct }) {
  const [open, setOpen] = useState(false);
  const [eftData, setEftData] = useState<{ iban: string; bankName: string; amount: string; description: string } | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function initEft() {
    if (!email || !name) return;
    setLoading(true);
    try {
      const orderRes = await fetch(`${API_URL}/api/v1/store/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerName: name, buyerEmail: email, items: [{ productId: product.id, quantity: 1 }] }),
      });
      const order = await orderRes.json() as { id: string };
      const eftRes = await fetch(`${API_URL}/api/v1/store/orders/${order.id}/eft`, { method: 'POST' });
      setEftData(await eftRes.json() as { iban: string; bankName: string; amount: string; description: string });
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="w-full text-sm text-gray-400 dark:text-slate-500 hover:text-[#26496b] dark:hover:text-blue-400 transition-colors py-1">
      EFT / Havale ile öde
    </button>
  );

  return (
    <div className="bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">EFT / Havale ile Ödeme</p>
      {!eftData ? (
        <>
          <input className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:bg-slate-800 dark:text-slate-100" placeholder="Adınız" value={name} onChange={e => setName(e.target.value)} />
          <input type="email" className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:bg-slate-800 dark:text-slate-100" placeholder="E-posta" value={email} onChange={e => setEmail(e.target.value)} />
          <button disabled={!email || !name || loading} onClick={() => void initEft()} className="w-full py-2 text-sm font-semibold text-white bg-[#26496b] rounded-xl disabled:opacity-50">
            {loading ? 'Hazırlanıyor…' : 'IBAN Bilgisini Al'}
          </button>
        </>
      ) : (
        <div className="space-y-1.5 text-sm">
          <p><strong>Banka:</strong> {eftData.bankName}</p>
          <p className="font-mono text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded border border-gray-200 dark:border-slate-700">{eftData.iban}</p>
          <p><strong>Tutar:</strong> {eftData.amount}</p>
          <p><strong>Açıklama:</strong> {eftData.description}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Ödemeniz ulaştıktan sonra siparişiniz işleme alınacaktır.</p>
        </div>
      )}
    </div>
  );
}

// ─── Checkout Aksiyon Butonu ───────────────────────────────────────────────────

interface Props {
  product: StoreProduct;
}

export default function CheckoutButton({ product }: Props) {
  const { addToCart } = useCart();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [addedToCart, setAddedToCart] = useState(false);

  const variantsComplete = product.variants.length === 0 ||
    product.variants.every(v => selected[v.name]);

  function handleAddToCart() {
    if (!variantsComplete) return;
    addToCart(product, 1, selected);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }

  return (
    <div className="space-y-3">
      {product.variants.length > 0 && (
        <VariantSelector
          variants={product.variants}
          selected={selected}
          onChange={setSelected}
        />
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleAddToCart}
          disabled={!variantsComplete}
          className={`flex-1 py-3 text-sm font-semibold rounded-2xl transition-all ${
            addedToCart
              ? 'bg-green-600 text-white'
              : !variantsComplete
                ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed'
                : 'bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] text-white'
          }`}
        >
          {addedToCart ? '✓ Sepete Eklendi' : 'Sepete Ekle'}
        </button>
        <CartButton />
      </div>

      {!variantsComplete && product.variants.length > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Lütfen tüm seçenekleri belirleyin.
        </p>
      )}

      <EftInfo product={product} />
    </div>
  );
}

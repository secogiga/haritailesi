'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const SAHNE_URL = process.env['NEXT_PUBLIC_SAHNE_URL'] ?? 'http://localhost:3002';

function fmt(kurus: number) { return `₺${(kurus / 100).toFixed(0)}`; }

interface CheckoutForm {
  name: string; surname: string; email: string; phone: string;
  address: string; city: string; district: string; postalCode: string;
}

const EMPTY: CheckoutForm = { name: '', surname: '', email: '', phone: '', address: '', city: '', district: '', postalCode: '' };

export function CartButton() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-xl text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        title="Sepet"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[var(--color-mavi)] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      {open && <CartDrawer onClose={() => setOpen(false)} />}
    </>
  );
}

function CartDrawer({ onClose }: { onClose: () => void }) {
  const { items, removeFromCart, updateQuantity, clearCart, total, count } = useCart();
  const [step, setStep] = useState<'cart' | 'info' | 'address' | 'installments' | 'payment'>('cart');
  const [installments, setInstallments] = useState(1);
  const [form, setForm] = useState<CheckoutForm>({ ...EMPTY });
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<{ valid: boolean; discountAmount: number; error?: string } | null>(null);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkoutHtml, setCheckoutHtml] = useState('');
  const [binNumber, setBinNumber] = useState('');
  const [availableInstallments, setAvailableInstallments] = useState<Array<{ count: number; perInstallment: number; totalPrice: number }> | null>(null);
  const [checkingBin, setCheckingBin] = useState(false);

  const hasPhysical = items.some(i => i.type === 'physical');
  const discountAmount = coupon?.valid ? (coupon.discountAmount ?? 0) : 0;
  const finalTotal = total - discountAmount;

  const inp = 'w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] dark:bg-slate-800 dark:text-slate-100 placeholder-gray-400';

  async function checkBin(bin: string) {
    if (bin.length < 6) { setAvailableInstallments(null); return; }
    setCheckingBin(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/store/checkout/bin-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ binNumber: bin, orderTotal: finalTotal }),
      });
      if (!res.ok) return;
      const data = await res.json() as { installments?: Array<{ count: number; perInstallment: number; totalPrice: number }> };
      setAvailableInstallments(data.installments ?? null);
      if (data.installments?.length) setInstallments(data.installments[0]!.count);
    } catch { /* ignore */ } finally { setCheckingBin(false); }
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setValidating(true); setCoupon(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/store/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), orderAmount: total }),
      });
      const data = await res.json() as { valid: boolean; discountAmount?: number; error?: string };
      const c: { valid: boolean; discountAmount: number; error?: string } = { valid: data.valid, discountAmount: data.discountAmount ?? 0 };
      if (data.error) c.error = data.error;
      setCoupon(c);
    } catch { setCoupon({ valid: false, discountAmount: 0, error: 'Kupon doğrulanamadı.' }); }
    finally { setValidating(false); }
  }

  async function checkout() {
    setLoading(true); setError('');
    try {
      const shippingAddress = hasPhysical ? {
        fullName: `${form.name} ${form.surname}`, phone: form.phone,
        address: form.address, city: form.city, district: form.district, postalCode: form.postalCode,
      } : undefined;

      const orderRes = await fetch(`${API_URL}/api/v1/store/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName: `${form.name} ${form.surname}`,
          buyerEmail: form.email,
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity, selectedVariants: i.selectedVariants })),
          ...(shippingAddress ? { shippingAddress } : {}),
          ...(coupon?.valid ? { couponCode: couponCode.trim() } : {}),
        }),
      });
      if (!orderRes.ok) throw new Error((await orderRes.json().catch(() => ({})) as { message?: string }).message ?? 'Sipariş oluşturulamadı.');
      const order = await orderRes.json() as { id: string; total: number };

      const checkoutRes = await fetch(`${API_URL}/api/v1/store/orders/${order.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, surname: form.surname, email: form.email, callbackUrl: `${SAHNE_URL}/magaza/odeme-sonuc`, installments }),
      });
      if (!checkoutRes.ok) throw new Error('Ödeme başlatılamadı.');
      const checkout = await checkoutRes.json() as { status: string; checkoutFormContent?: string };

      if (checkout.status === 'success' && checkout.checkoutFormContent) {
        setCheckoutHtml(checkout.checkoutFormContent);
        setStep('payment');
        clearCart();
      } else if (checkout.status === 'mock') {
        clearCart();
        window.location.href = `/magaza/odeme-sonuc?mock=1&email=${encodeURIComponent(form.email)}&orderId=${order.id}`;
      } else {
        throw new Error('Ödeme formu yüklenemedi.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ml-auto w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="font-bold text-gray-900 dark:text-slate-100">
            {step === 'cart' ? `Sepet (${count})` : step === 'info' ? 'İletişim Bilgileri' : step === 'address' ? 'Kargo Adresi' : 'Ödeme'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>

        {/* Payment step */}
        {step === 'payment' && checkoutHtml && (
          <div className="flex-1 p-4 overflow-y-auto" dangerouslySetInnerHTML={{ __html: checkoutHtml }} />
        )}

        {/* Cart step */}
        {step === 'cart' && (
          <div className="flex-1 flex flex-col overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="text-5xl mb-4">🛒</div>
                <p className="text-gray-500 dark:text-slate-400 mb-4">Sepetiniz boş</p>
                <button onClick={onClose} className="text-sm text-[#26496b] dark:text-blue-400 hover:underline">Alışverişe Devam Et →</button>
              </div>
            ) : (
              <>
                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.productId} className="flex gap-3 bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                      <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                        {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" /> : (item.type === 'digital' ? '📄' : item.type === 'app' ? '📱' : '📦')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{item.title}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{fmt(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-sm font-bold hover:bg-gray-100 flex items-center justify-center">−</button>
                        <span className="w-6 text-center text-sm font-semibold text-gray-900 dark:text-slate-100">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-sm font-bold hover:bg-gray-100 flex items-center justify-center">+</button>
                        <button onClick={() => removeFromCart(item.productId)} className="w-7 h-7 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center ml-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Kupon */}
                  <div className="flex gap-2 mt-2">
                    <input className={`${inp} flex-1`} value={couponCode} onChange={e => { setCouponCode(e.target.value); setCoupon(null); }}
                      placeholder="Kupon kodu" onKeyDown={e => { if (e.key === 'Enter') void applyCoupon(); }} />
                    <button disabled={validating || !couponCode.trim()} onClick={() => void applyCoupon()}
                      className="px-3 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-xl disabled:opacity-50 hover:bg-[#1e3a56] transition-colors shrink-0">
                      {validating ? '…' : 'Uygula'}
                    </button>
                  </div>
                  {coupon && (
                    <p className={`text-xs px-2 py-1 rounded-lg ${coupon.valid ? 'text-green-700 bg-green-50 dark:bg-green-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'}`}>
                      {coupon.valid ? `✓ İndirim: ${fmt(coupon.discountAmount)}` : `✕ ${coupon.error}`}
                    </p>
                  )}
                </div>

                {/* Toplam + Devam */}
                <div className="border-t border-gray-100 dark:border-slate-800 p-4 space-y-2">
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400">
                      <span>Ara toplam</span><span>{fmt(total)}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>İndirim</span><span>-{fmt(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 dark:text-slate-100">
                    <span>Toplam</span><span>{fmt(finalTotal)}</span>
                  </div>
                  <button onClick={() => setStep('info')}
                    className="w-full py-3 mt-1 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors">
                    Ödemeye Geç →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Taksit seçim adımı */}
        {step === 'installments' && (
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium uppercase tracking-wide mb-2">Kart Numarası (ilk 6 hane)</p>
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                value={binNumber}
                placeholder="123456"
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '');
                  setBinNumber(v);
                  if (v.length === 6) void checkBin(v);
                  else setAvailableInstallments(null);
                }}
                className={inp}
              />
              {checkingBin && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Kart bilgisi sorgulanıyor…</p>}
            </div>

            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium uppercase tracking-wide">Taksit Seçeneği</p>
            {(availableInstallments ?? [{ count: 1, perInstallment: finalTotal, totalPrice: finalTotal }, { count: 2, perInstallment: Math.ceil(finalTotal / 2), totalPrice: finalTotal }, { count: 3, perInstallment: Math.ceil(finalTotal / 3), totalPrice: finalTotal }]).map(opt => (
              <button key={opt.count} onClick={() => setInstallments(opt.count)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${installments === opt.count ? 'border-[#26496b] bg-[#26496b]/5' : 'border-gray-200 dark:border-slate-700 hover:border-[#26496b]/50'}`}>
                <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  {opt.count === 1 ? 'Tek çekim' : `${opt.count} taksit`}
                </span>
                <span className="text-sm font-bold text-[#26496b] dark:text-blue-400">
                  {opt.count === 1 ? fmt(opt.perInstallment) : `${fmt(opt.perInstallment)} × ${opt.count}`}
                </span>
              </button>
            ))}
            <button onClick={() => void checkout()} disabled={loading}
              className="w-full py-3 mt-2 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors disabled:opacity-50">
              {loading ? 'Lütfen bekleyin…' : 'Ödemeye Geç →'}
            </button>
            <p className="text-xs text-center text-gray-400 dark:text-slate-500">iyzico ile güvenli ödeme</p>
          </div>
        )}

        {(step === 'info' || step === 'address') && (
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {step === 'info' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold block mb-1">Ad *</label>
                    <input required className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold block mb-1">Soyad *</label>
                    <input required className={inp} value={form.surname} onChange={e => setForm(f => ({ ...f, surname: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold block mb-1">E-posta *</label>
                  <input required type="email" className={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold block mb-1">Telefon</label>
                  <input type="tel" className={inp} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0555 123 45 67" />
                </div>
              </>
            )}
            {step === 'address' && (
              <>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold block mb-1">Adres *</label>
                  <textarea rows={3} className={inp} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Mahalle, sokak, bina no, daire…" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold block mb-1">İl *</label>
                    <input required className={inp} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="İstanbul" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold block mb-1">İlçe</label>
                    <input className={inp} value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold block mb-1">Posta Kodu</label>
                  <input className={inp} value={form.postalCode} onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))} placeholder="34000" />
                </div>
              </>
            )}

            {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>}

            <div className="flex gap-2 pt-2">
              <button onClick={() => setStep(step === 'info' ? 'cart' : step === 'address' ? 'info' : 'info')}
                className="px-4 py-2.5 text-sm text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800">
                ← Geri
              </button>
              <button
                disabled={loading || (step === 'info' ? !(form.name && form.surname && form.email) : !(form.address && form.city))}
                onClick={() => { if (step === 'info' && hasPhysical) { setStep('address'); } else if (step === 'address' || step === 'info') { setStep('installments'); } else { void checkout(); } }}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors disabled:opacity-50">
                {loading ? 'Lütfen bekleyin…' : step === 'info' && hasPhysical ? 'Devam Et →' : 'Taksit Seç →'}
              </button>
            </div>
            <p className="text-xs text-center text-gray-400 dark:text-slate-500">iyzico ile güvenli ödeme · SSL şifreli</p>
          </div>
        )}
      </div>
    </div>
  );
}

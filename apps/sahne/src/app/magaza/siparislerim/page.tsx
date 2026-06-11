'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Ödeme Bekleniyor',
  processing: 'Hazırlanıyor',
  partially_shipped: 'Kısmi Kargo',
  shipped: 'Kargoda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal',
  refunded: 'İade',
};
const PAYMENT_CLS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};
const SHIPPING_CLS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-500',
  preparing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
};
const SHIPPING_LABELS: Record<string, string> = {
  pending: 'Bekliyor', preparing: 'Hazırlanıyor', shipped: 'Kargoda', delivered: 'Teslim',
};

function fmt(kurus: number) {
  return `₺${(kurus / 100).toFixed(2)}`;
}

const CARRIER_TRACKING_URLS: Record<string, string> = {
  yurtici: 'https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=',
  mng: 'https://www.mngkargo.com.tr/wps/portal/mng/main/gondaritakip?barcode=',
  ptt: 'https://www.ptt.gov.tr/Sayfalar/GonderiTakip.aspx?barcode=',
  aras: 'https://kargotakip.araskargo.com.tr/?barcode=',
  ups: 'https://www.ups.com/track?tracknum=',
};

interface OrderItem {
  id: string;
  productSnapshot: { title: string; price: number; type: string; ownerType: string };
  quantity: number;
  unitPrice: number;
  shippingStatus: string;
  payoutStatus: string;
  trackingNumber: string | null;
  trackingCompany: string | null;
  shippedAt: string | null;
}

interface Order {
  id: string;
  buyerName: string;
  buyerEmail: string;
  total: number;
  paymentStatus: string;
  status: string;
  shippingAddress: Record<string, string> | null;
  createdAt: string;
  items: OrderItem[];
}

function SiparislerimContent() {
  const params = useSearchParams();
  const [orderId, setOrderId] = useState(params.get('orderId') ?? '');
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (params.get('orderId') && params.get('email')) {
      void lookup();
    }
  }, []); // eslint-disable-line

  async function confirmDelivery(itemId: string) {
    if (!email) return;
    setConfirming(itemId);
    try {
      await fetch(`${API_URL}/api/v1/store/orders/items/${itemId}/confirm-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerEmail: email }),
      });
      setConfirmed(prev => new Set([...prev, itemId]));
    } catch { /* ignore */ } finally { setConfirming(null); }
  }

  async function lookup() {
    if (!orderId || !email) return;
    setLoading(true); setError(''); setSearched(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/store/orders/lookup?orderId=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        const e = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(e.message ?? 'Sipariş bulunamadı.');
      }
      setOrder(await res.json() as Order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sipariş bulunamadı.');
      setOrder(null);
    } finally { setLoading(false); }
  }

  const inp = 'w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] dark:bg-slate-900 dark:text-slate-100';

  return (
    <>
      <Navbar />
      <main className="min-h-screen dark:bg-[#070c1a]">
        <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-10">
          <div className="max-w-2xl mx-auto px-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1">Sipariş Sorgula</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Sipariş numarası ve e-posta adresinizle siparişinizi sorgulayabilirsiniz.</p>
          </div>
        </section>

        <section className="py-8">
          <div className="max-w-2xl mx-auto px-4 space-y-6">
            {/* Arama formu */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Sipariş No (ID)</label>
                <input className={inp} value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">E-posta Adresi</label>
                <input type="email" className={inp} value={email} onChange={e => setEmail(e.target.value)} placeholder="siparis@example.com" />
              </div>
              <button
                onClick={() => void lookup()}
                disabled={loading || !orderId || !email}
                className="w-full py-3 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'Sorgulanıyor…' : 'Sipariş Sorgula'}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {order && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                {/* Order header */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Sipariş No</p>
                      <p className="font-mono text-xs text-gray-700 dark:text-slate-300">{order.id}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PAYMENT_CLS[order.paymentStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                        {order.paymentStatus === 'paid' ? 'Ödendi' : order.paymentStatus === 'pending' ? 'Ödeme Bekleniyor' : order.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm mt-3">
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-500">Durum</p>
                      <p className="font-medium text-gray-900 dark:text-slate-100 text-xs mt-0.5">{ORDER_STATUS_LABELS[order.status] ?? order.status}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-500">Toplam</p>
                      <p className="font-bold text-gray-900 dark:text-slate-100 mt-0.5">{fmt(order.total)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-500">Tarih</p>
                      <p className="font-medium text-gray-900 dark:text-slate-100 text-xs mt-0.5">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="p-5 space-y-3">
                  <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-2">Ürünler</p>
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                      <div className="text-2xl">{item.productSnapshot.type === 'digital' ? '📄' : item.productSnapshot.type === 'app' ? '📱' : '📦'}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{item.productSnapshot.title}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{fmt(item.unitPrice)} · {item.quantity} adet</p>
                        {item.productSnapshot.type === 'physical' && (
                          <div className="mt-1 space-y-1.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${SHIPPING_CLS[item.shippingStatus] ?? ''}`}>
                              {SHIPPING_LABELS[item.shippingStatus] ?? item.shippingStatus}
                            </span>
                            {item.trackingNumber && (
                              <div className="space-y-1">
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                  <strong>{item.trackingCompany ?? 'Kargo'}</strong> · {item.trackingNumber}
                                  {item.shippedAt && ` · ${new Date(item.shippedAt).toLocaleDateString('tr-TR')}`}
                                </p>
                                {item.trackingCompany && CARRIER_TRACKING_URLS[item.trackingCompany.toLowerCase()] && (
                                  <a
                                    href={`${CARRIER_TRACKING_URLS[item.trackingCompany.toLowerCase()]}${item.trackingNumber}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#26496b] dark:text-blue-400 border border-[#26496b]/30 dark:border-blue-400/30 rounded-lg px-2 py-1 hover:bg-[#26496b]/5 dark:hover:bg-blue-400/5 transition-colors"
                                  >
                                    🚚 Kargoyu Takip Et →
                                  </a>
                                )}
                              </div>
                            )}
                            {item.productSnapshot.ownerType === 'seller' &&
                              item.shippingStatus === 'shipped' &&
                              item.payoutStatus === 'held' &&
                              !confirmed.has(item.id) && (
                                <button
                                  disabled={confirming === item.id}
                                  onClick={() => void confirmDelivery(item.id)}
                                  className="mt-1 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {confirming === item.id ? 'Onaylanıyor…' : '✓ Teslim Aldım'}
                                </button>
                              )}
                            {(item.payoutStatus === 'released' || confirmed.has(item.id)) && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
                                ✓ Teslim onaylandı
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {order.shippingAddress && (
                  <div className="px-5 pb-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-2">Kargo Adresi</p>
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 text-xs text-gray-600 dark:text-slate-400 space-y-0.5">
                      {Object.entries(order.shippingAddress).map(([k, v]) => (
                        <p key={k}><strong className="capitalize">{k}:</strong> {v}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {searched && !loading && !order && !error && (
              <div className="text-center text-gray-400 dark:text-slate-500 py-8">
                Sipariş bilgisi bulunamadı.
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

export default function SiparislerimPage() {
  return (
    <Suspense>
      <SiparislerimContent />
    </Suspense>
  );
}

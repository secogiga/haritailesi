'use client';

import { useEffect, useState } from 'react';
import { useToken } from '@/hooks/useToken';
import { mutfakApi as api, type StoreSeller, type StoreProduct, type StoreOrderItem } from '@/lib/api';

function fmt(kurus: number) {
  return `${(kurus / 100).toFixed(2)} TL`;
}

const SHIPPING_LABELS: Record<string, string> = {
  pending: 'Bekliyor', preparing: 'Hazırlanıyor', shipped: 'Kargoda', delivered: 'Teslim',
};
const SHIPPING_CLS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  preparing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
};

export default function MagazamPage() {
  const token = useToken();

  const [seller, setSeller] = useState<StoreSeller | null | undefined>(undefined);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [orders, setOrders] = useState<StoreOrderItem[]>([]);
  const [balance, setBalance] = useState<{ held: number; released: number; totalPaid: number } | null>(null);
  const [loyaltyBalance, setLoyaltyBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'bakiye'>('orders');
  const [trackingForm, setTrackingForm] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<string | null>(null);
  const [updateErr, setUpdateErr] = useState('');

  useEffect(() => {
    if (!token) return;
    void (async () => {
      setLoading(true);
      try {
        const [sellerData, productsData, ordersData, balanceData, loyaltyData] = await Promise.all([
          api.getMySellerProfile(token),
          api.getMySellerProducts(token),
          api.getMySellerOrders(token),
          api.getMySellerBalance(token).catch(() => null),
          fetch(`${process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000'}/api/v1/store/loyalty/balance`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => ({ balance: 0 })) as Promise<{ balance: number }>,
        ]);
        setSeller(sellerData);
        setProducts(productsData.data);
        setOrders(ordersData.data);
        setBalance(balanceData);
        setLoyaltyBalance(loyaltyData.balance);
      } catch {
        setSeller(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function updateShipping(itemId: string) {
    if (!token) return;
    setUpdating(itemId); setUpdateErr('');
    try {
      await api.updateMyItemShipping(token, itemId, {
        shippingStatus: (trackingForm[`${itemId}_status`] ?? 'preparing') as 'preparing' | 'shipped' | 'delivered',
        ...(trackingForm[`${itemId}_num`] ? { trackingNumber: trackingForm[`${itemId}_num`] } : {}),
        ...(trackingForm[`${itemId}_co`] ? { trackingCompany: trackingForm[`${itemId}_co`] } : {}),
      });
      const updated = await api.getMySellerOrders(token);
      setOrders(updated.data);
    } catch (err) {
      setUpdateErr(err instanceof Error ? err.message : 'Hata oluştu');
    } finally { setUpdating(null); }
  }

  const inp = 'w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b] dark:bg-slate-800 dark:text-slate-100';
  const sel = inp;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 animate-pulse" />)}
      </div>
    );
  }

  // Satıcı değil veya onay bekliyor
  if (!seller) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center">
          <div className="text-4xl mb-4">🏪</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Satıcı hesabınız yok</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
            Mağazada ürün listelemek ve satış yapmak için satıcı başvurusu yapmanız gerekiyor.
          </p>
          <a href="/magazam/basvur"
            className="inline-block px-6 py-3 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1e3a56] rounded-xl transition-colors">
            Satıcı Başvurusu Yap
          </a>
        </div>
      </div>
    );
  }

  if (seller.status === 'pending') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Başvurunuz İnceleniyor</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
            Başvurunuz 1–3 iş günü içinde değerlendirilecek. Onaylandığında <strong>{seller.email}</strong> adresine bildirim gönderilecek.
          </p>
          {seller.adminNotes && (
            <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              <strong>Admin notu:</strong> {seller.adminNotes}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (seller.status === 'rejected' || seller.status === 'suspended') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center">
          <div className="text-4xl mb-4">{seller.status === 'suspended' ? '🔒' : '❌'}</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            {seller.status === 'suspended' ? 'Hesap Askıya Alındı' : 'Başvuru Reddedildi'}
          </h2>
          {seller.adminNotes && (
            <p className="text-sm text-gray-500 dark:text-slate-400">{seller.adminNotes}</p>
          )}
        </div>
      </div>
    );
  }

  // Onaylı satıcı dashboard
  const pendingOrders = orders.filter(o => o.shippingStatus !== 'delivered').length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Mağazam</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {seller.businessName ?? seller.applicantName} ·
            Komisyon: %{seller.commissionRate ? (parseFloat(seller.commissionRate) * 100).toFixed(1) : '—'}
          </p>
        </div>
        {loyaltyBalance > 0 && (
          <a href="/magazam/puanlarim"
            className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-3 py-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
            <span className="text-lg">⭐</span>
            <div>
              <p className="text-xs font-bold text-yellow-800 dark:text-yellow-300">{loyaltyBalance} puan</p>
              <p className="text-[10px] text-yellow-600 dark:text-yellow-500">Puanlarım →</p>
            </div>
          </a>
        )}
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Toplam Sipariş', value: orders.length },
          { label: 'Bekleyen', value: pendingOrders },
          { label: 'Beklemede (Escrow)', value: balance ? fmt(balance.held) : '—', note: 'Alıcı teslim onayı bekleniyor' },
          { label: 'Aktarılabilir', value: balance ? fmt(balance.released) : '—', highlight: true },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl border p-4 text-center ${(stat as { highlight?: boolean }).highlight ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800'}`}>
            <p className={`text-xl font-bold ${(stat as { highlight?: boolean }).highlight ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-slate-100'}`}>{stat.value}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{stat.label}</p>
            {(stat as { note?: string }).note && <p className="text-[10px] text-gray-300 dark:text-slate-600 mt-0.5">{(stat as { note?: string }).note}</p>}
          </div>
        ))}
      </div>

      {/* Escrow bilgi banner */}
      {balance && (balance.held > 0 || balance.released > 0) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-400 mb-5">
          <strong>Ödeme Güvencesi:</strong> Satışlarınızdan elde ettiğiniz tutar, alıcı teslim onayı veya 14 günlük bekleme süresi sonunda aktarılabilir bakiyeye geçer.
          {balance.released > 0 && <> Şu an <strong>{fmt(balance.released)}</strong> aktarılmaya hazır — yöneticiniz IBAN'ınıza transfer yapacak.</>}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1 mb-5 w-fit">
        <button onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'orders' ? 'bg-white dark:bg-slate-900 text-[#26496b] dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}>
          Siparişler ({orders.length})
        </button>
        <button onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'products' ? 'bg-white dark:bg-slate-900 text-[#26496b] dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}>
          Ürünlerim ({products.length})
        </button>
        <button onClick={() => setActiveTab('bakiye')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'bakiye' ? 'bg-white dark:bg-slate-900 text-[#26496b] dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}>
          Bakiye
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-3">
          {updateErr && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{updateErr}</p>}
          {orders.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center text-gray-400 dark:text-slate-500">
              Henüz sipariş yok.
            </div>
          ) : orders.map(item => (
            <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-slate-100">{item.productSnapshot.title}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    {fmt(item.unitPrice)} · {item.quantity} adet · {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                    Kazancınız: {fmt(item.sellerAmount)}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${SHIPPING_CLS[item.shippingStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                  {SHIPPING_LABELS[item.shippingStatus]}
                </span>
              </div>

              {item.trackingNumber && (
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                  Takip: <strong>{item.trackingCompany ?? ''}</strong> {item.trackingNumber}
                </p>
              )}

              {item.productSnapshot.type === 'physical' && item.shippingStatus !== 'delivered' && (
                <div className="border-t border-gray-100 dark:border-slate-800 pt-3 grid grid-cols-3 gap-2">
                  <select className={sel} value={trackingForm[`${item.id}_status`] ?? item.shippingStatus}
                    onChange={e => setTrackingForm(f => ({ ...f, [`${item.id}_status`]: e.target.value }))}>
                    <option value="preparing">Hazırlanıyor</option>
                    <option value="shipped">Kargoya Verildi</option>
                    <option value="delivered">Teslim Edildi</option>
                  </select>
                  <input className={inp} placeholder="Takip no"
                    value={trackingForm[`${item.id}_num`] ?? ''}
                    onChange={e => setTrackingForm(f => ({ ...f, [`${item.id}_num`]: e.target.value }))} />
                  <button disabled={updating === item.id} onClick={() => void updateShipping(item.id)}
                    className="px-3 py-2 text-xs font-semibold bg-[#26496b] text-white rounded-lg hover:bg-[#1e3a56] disabled:opacity-50 transition-colors">
                    {updating === item.id ? '…' : 'Güncelle'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'bakiye' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-4">Ödeme Durumu</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
                <span className="text-sm text-gray-600 dark:text-slate-400">Beklemede (teslim onayı bekleniyor)</span>
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{balance ? fmt(balance.held) : '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
                <span className="text-sm text-gray-600 dark:text-slate-400">Aktarılabilir bakiye</span>
                <span className="text-sm font-bold text-green-700 dark:text-green-400">{balance ? fmt(balance.released) : '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-slate-400">Toplam aktarılan</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{balance ? fmt(balance.totalPaid) : '—'}</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-xs text-gray-500 dark:text-slate-400 space-y-1">
            <p><strong>Nasıl çalışır?</strong></p>
            <p>• Alıcı ürünü teslim aldığında "Teslim Aldım" onayı verir veya kargo tarihinden 14 gün sonra otomatik onaylanır.</p>
            <p>• Onaylanan tutarlar aktarılabilir bakiyeye geçer.</p>
            <p>• Yöneticimiz IBAN'ınıza havale yapar ve sizi bilgilendirir.</p>
            {seller?.iban && <p>• IBAN: <span className="font-mono">{seller.iban}</span></p>}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 dark:text-slate-400">{products.length} ürün</p>
            <a href="/magazam/urunlerim"
              className="px-4 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56] transition-colors">
              + Ürün Ekle / Düzenle
            </a>
          </div>
          {products.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center text-gray-400 dark:text-slate-500">
              Henüz yayında ürününüz yok.
            </div>
          ) : (
            <div className="space-y-2">
              {products.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 px-4 py-3.5 flex items-center gap-3">
                  <div className="text-2xl">{p.type === 'digital' ? '📄' : p.type === 'app' ? '📱' : '📦'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-slate-100 truncate">{p.title}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{fmt(p.price)} {p.memberPrice ? `· Üye: ${fmt(p.memberPrice)}` : ''}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                    {p.status === 'active' ? 'Aktif' : p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

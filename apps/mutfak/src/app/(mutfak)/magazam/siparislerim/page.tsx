'use client';

import { useEffect, useState } from 'react';
import { useToken } from '@/hooks/useToken';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Ödeme Bekleniyor', processing: 'Hazırlanıyor',
  shipped: 'Kargoda', delivered: 'Teslim', cancelled: 'İptal', refunded: 'İade',
};
const PAYMENT_CLS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

function fmt(kurus: number) { return `${(kurus / 100).toFixed(2)} TL`; }

interface StoreOrder {
  id: string; buyerName: string; buyerEmail: string;
  total: number; paymentStatus: string; status: string; createdAt: string;
}

export default function BuyerOrdersPage() {
  const token = useToken();
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/v1/store/orders/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Siparişlerim</h1>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center text-gray-400 dark:text-slate-500">
          Henüz sipariş vermediniz.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <a key={order.id} href={`https://sahne.haritailesi.org/magaza/siparislerim?orderId=${order.id}&email=${encodeURIComponent(order.buyerEmail)}`} target="_blank" rel="noopener"
              className="block bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm px-4 py-3.5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${PAYMENT_CLS[order.paymentStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                      {order.paymentStatus === 'paid' ? 'Ödendi' : 'Ödeme Bekleniyor'}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">{ORDER_STATUS_LABELS[order.status] ?? order.status}</span>
                  </div>
                  <p className="font-mono text-xs text-gray-500 dark:text-slate-500">#{order.id.slice(-8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-slate-100">{fmt(order.total)}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

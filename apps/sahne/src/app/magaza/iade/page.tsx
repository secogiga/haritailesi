'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

function IadeForm() {
  const params = useSearchParams();
  const [orderId, setOrderId] = useState(params.get('orderId') ?? '');
  const [buyerEmail, setBuyerEmail] = useState(params.get('email') ?? '');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const inp = 'w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 dark:bg-slate-900 dark:text-slate-100';

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/store/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, buyerEmail, reason }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})) as { message?: string }).message ?? 'Hata');
      setDone(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Bir hata oluştu.'); }
    finally { setSubmitting(false); }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen dark:bg-[#070c1a]">
        <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-10">
          <div className="max-w-2xl mx-auto px-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">İade Talebi</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Sipariş numarası ve e-posta ile iade talebi oluşturabilirsiniz.</p>
          </div>
        </section>
        <section className="py-8">
          <div className="max-w-2xl mx-auto px-4">
            {done ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center">
                <div className="text-4xl mb-3">✅</div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">İade Talebiniz Alındı</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">3 iş günü içinde e-posta ile bilgilendirileceksiniz.</p>
              </div>
            ) : (
              <form onSubmit={(e) => void submit(e)} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 space-y-4">
                <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1.5">Sipariş No *</label>
                  <input required className={inp} value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></div>
                <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1.5">E-posta *</label>
                  <input required type="email" className={inp} value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} /></div>
                <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1.5">İade Nedeni *</label>
                  <textarea required rows={4} minLength={20} className={inp} value={reason} onChange={e => setReason(e.target.value)} placeholder="İade nedeninizi açıklayın…" /></div>
                {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
                <button type="submit" disabled={submitting || !orderId || !buyerEmail || !reason}
                  className="w-full py-3 text-sm font-semibold text-white bg-[var(--color-mavi)] rounded-xl disabled:opacity-50">
                  {submitting ? 'Gönderiliyor…' : 'İade Talebi Gönder'}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

export default function IadePage() {
  return (
    <Suspense>
      <IadeForm />
    </Suspense>
  );
}

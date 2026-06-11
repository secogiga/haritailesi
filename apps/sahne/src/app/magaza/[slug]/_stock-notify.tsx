'use client';

import { useState } from 'react';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export function StockNotifyButton({ slug }: { slug: string }) {
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    if (!email) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/v1/store/products/${slug}/notify-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setDone(true);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  if (done) return (
    <div className="w-full py-3 text-center text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
      ✓ Stok geldiğinde e-posta ile bildirileceksiniz.
    </div>
  );

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="w-full py-3 text-sm font-semibold text-[#26496b] dark:text-blue-400 bg-gray-100 dark:bg-slate-800 rounded-2xl hover:bg-[#26496b]/10 transition-colors">
      Stok Gelince Beni Bildir
    </button>
  );

  return (
    <div className="space-y-2">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="E-posta adresiniz"
        className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 dark:bg-slate-900 dark:text-slate-100"
      />
      <button onClick={() => void subscribe()} disabled={!email || loading}
        className="w-full py-3 text-sm font-semibold text-white bg-[var(--color-mavi)] rounded-xl disabled:opacity-50">
        {loading ? 'Kaydediliyor…' : 'Beni Bildir'}
      </button>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface Review { id: string; buyerName: string; rating: number; comment: string | null; createdAt: string; }

function Stars({ rating }: { rating: number }) {
  return <span className="text-yellow-500 text-sm">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>;
}

export function ReviewsSection({ slug, productId }: { slug: string; productId: string }) {
  const [data, setData] = useState<{ reviews: Review[]; avgRating: number; count: number } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ buyerName: '', buyerEmail: '', rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/store/products/${slug}/reviews`)
      .then(r => r.json())
      .then(d => setData(d as { reviews: Review[]; avgRating: number; count: number }))
      .catch(() => {});
  }, [slug]);

  const inp = 'w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 dark:bg-slate-900 dark:text-slate-100';

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    try {
      await fetch(`${API_URL}/api/v1/store/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, productId }),
      });
      setSubmitted(true); setShowForm(false);
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  }

  return (
    <div className="mt-10 pt-8 border-t border-gray-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Yorumlar</h3>
          {data && data.count > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <Stars rating={Math.round(data.avgRating)} />
              <span className="text-sm text-gray-500 dark:text-slate-400">{data.avgRating.toFixed(1)} — {data.count} yorum</span>
            </div>
          )}
        </div>
        {!submitted && (
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-sm font-semibold text-[#26496b] dark:text-blue-400 border border-[#26496b]/30 dark:border-blue-400/30 rounded-xl hover:bg-[#26496b]/5 transition-colors">
            Yorum Yaz
          </button>
        )}
      </div>

      {submitted && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-sm text-green-700 dark:text-green-400 mb-4">
          ✓ Yorumunuz alındı. İnceleme sonrasında yayınlanacak.
        </div>
      )}

      {showForm && (
        <form onSubmit={(e) => void submit(e)} className="bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 space-y-3 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 block mb-1">Adınız *</label>
              <input required className={inp} value={form.buyerName} onChange={e => setForm(f => ({ ...f, buyerName: e.target.value }))} /></div>
            <div><label className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 block mb-1">E-posta *</label>
              <input required type="email" className={inp} value={form.buyerEmail} onChange={e => setForm(f => ({ ...f, buyerEmail: e.target.value }))} /></div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 block mb-2">Puanınız</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button" onClick={() => setForm(f => ({ ...f, rating: s }))}
                  className={`text-2xl transition-transform hover:scale-110 ${s <= form.rating ? 'text-yellow-500' : 'text-gray-300'}`}>★</button>
              ))}
            </div>
          </div>
          <div><label className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 block mb-1">Yorum</label>
            <textarea rows={3} className={inp} value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} placeholder="Ürün hakkında düşünceleriniz…" /></div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl">İptal</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-semibold text-white bg-[var(--color-mavi)] rounded-xl disabled:opacity-50">
              {submitting ? 'Gönderiliyor…' : 'Gönder'}
            </button>
          </div>
        </form>
      )}

      {!data || data.reviews.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-slate-500">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
      ) : (
        <div className="space-y-4">
          {data.reviews.map(r => (
            <div key={r.id} className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Stars rating={r.rating} />
                <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{r.buyerName}</span>
                <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto">{new Date(r.createdAt).toLocaleDateString('tr-TR')}</span>
              </div>
              {r.comment && <p className="text-sm text-gray-600 dark:text-slate-400">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useSahneAuth } from '@/contexts/SahneAuthContext';
import type { CourseReview } from '@/lib/api';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

function Stars({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readonly && setHover(n)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`text-xl transition-colors ${(hover || value) >= n ? 'text-amber-400' : 'text-gray-200 dark:text-slate-700'} ${readonly ? 'cursor-default' : 'hover:scale-110 transition-transform'}`}>
          ★
        </button>
      ))}
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  return d < 1 ? 'bugün' : d < 7 ? `${d} gün önce` : d < 30 ? `${Math.floor(d / 7)} hafta önce` : `${Math.floor(d / 30)} ay önce`;
}

export function CourseReviews({
  reviews: initial, trainingId, avgRating, reviewCount,
}: {
  reviews: CourseReview[];
  trainingId: string;
  avgRating: number | null;
  reviewCount: number;
}) {
  const { user } = useSahneAuth();
  const [reviews, setReviews] = useState(initial);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/cms/trainings/${trainingId}/reviews`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment || undefined }),
      });
      if (!res.ok) throw new Error();
      const newReview = await res.json() as { id: string; rating: number; comment: string | null; createdAt: string };
      setReviews(prev => [{ ...newReview, displayName: user?.profile?.displayName ?? 'Siz', avatarUrl: user?.profile?.avatarUrl ?? null }, ...prev.filter(r => r.displayName !== (user?.profile?.displayName ?? 'Siz'))]);
      setSubmitted(true);
      setShowForm(false);
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Değerlendirmeler</h2>
          {avgRating && reviewCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400 text-lg">{'★'.repeat(Math.round(avgRating))}</span>
              <span className="text-sm font-bold text-gray-700 dark:text-slate-200">{Number(avgRating).toFixed(1)}</span>
              <span className="text-sm text-gray-400">({reviewCount})</span>
            </div>
          )}
        </div>
        {user && !submitted && (
          <button onClick={() => setShowForm(s => !s)}
            className="text-sm font-medium text-[var(--color-mavi)] hover:underline">
            {showForm ? 'İptal' : '+ Değerlendirme Yaz'}
          </button>
        )}
      </div>

      {/* Yorum formu */}
      {showForm && user && (
        <form onSubmit={e => void submit(e)} className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-5 mb-6 space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Puanınız</p>
            <Stars value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Yorumunuz (isteğe bağlı)</label>
            <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Bu kurs hakkında düşüncelerinizi paylaşın…"
              className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)]/40 resize-none" />
          </div>
          <button type="submit" disabled={rating === 0 || submitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl disabled:opacity-50 transition-colors">
            {submitting ? 'Gönderiliyor…' : 'Değerlendirmeyi Gönder'}
          </button>
        </form>
      )}

      {/* Yorum listesi */}
      {reviews.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-slate-500 py-4">Henüz değerlendirme yok. İlk değerlendirmeyi sen yap!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--color-mavi)] text-white flex items-center justify-center text-sm font-bold shrink-0">
                {r.displayName?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 bg-gray-50 dark:bg-slate-800/50 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{r.displayName ?? 'Üye'}</span>
                  <span className="text-xs text-gray-400">{timeAgo(r.createdAt)}</span>
                </div>
                <Stars value={r.rating} readonly />
                {r.comment && <p className="text-sm text-gray-600 dark:text-slate-400 mt-1.5 leading-relaxed">{r.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

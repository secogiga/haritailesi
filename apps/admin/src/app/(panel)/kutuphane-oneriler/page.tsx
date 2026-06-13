'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApi, type LibrarySuggestion } from '@/lib/api';

const CONTENT_TYPE_LABELS: Record<string, string> = {
  term: 'Terim', guide: 'Rehber', regulation: 'Mevzuat',
};
const CONTENT_TYPE_COLORS: Record<string, string> = {
  term: 'bg-violet-100 text-violet-700',
  guide: 'bg-emerald-100 text-emerald-700',
  regulation: 'bg-rose-100 text-rose-700',
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor', approved: 'Onaylandı', rejected: 'Reddedildi',
};
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
};

function ReviewModal({
  suggestion,
  onClose,
  onDone,
}: {
  suggestion: LibrarySuggestion;
  onClose: () => void;
  onDone: () => void;
}) {
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await adminApi.reviewLibrarySuggestion(suggestion.id, {
        status: decision,
        ...(note.trim() ? { adminNote: note.trim() } : {}),
      });
      onDone();
    } catch {
      setError('İşlem sırasında bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-black text-gray-900">Öneriyi İncele</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${CONTENT_TYPE_COLORS[suggestion.content_type] ?? 'bg-gray-100 text-gray-600'}`}>
                {CONTENT_TYPE_LABELS[suggestion.content_type] ?? suggestion.content_type}
              </span>
              <span className="text-xs text-gray-500">{suggestion.display_name} ({suggestion.email})</span>
              <span className="text-xs text-gray-400">{new Date(suggestion.created_at).toLocaleDateString('tr-TR')}</span>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">{suggestion.body}</p>
          </div>

          <form onSubmit={(e) => { void submit(e); }} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Karar</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDecision('approved')}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${decision === 'approved' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'}`}
                >
                  Onayla
                </button>
                <button
                  type="button"
                  onClick={() => setDecision('rejected')}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${decision === 'rejected' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-red-400'}`}
                >
                  Reddet
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Admin Notu (opsiyonel)</label>
              <textarea
                rows={2}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Kullanıcıya iletilecek not…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                İptal
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-60"
              >
                {busy ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function KutuphaneOnerilerPage() {
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [suggestions, setSuggestions] = useState<LibrarySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LibrarySuggestion | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listLibrarySuggestions(statusFilter);
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { void load(); }, [load]);

  return (
    <>
      {selected && (
        <ReviewModal
          suggestion={selected}
          onClose={() => setSelected(null)}
          onDone={() => { setSelected(null); void load(); }}
        />
      )}

      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">Kütüphane Önerileri</h1>
          <p className="text-sm text-gray-500 mt-1">Kullanıcılardan gelen terim, rehber ve mevzuat düzeltme önerileri.</p>
        </div>

        <div className="flex gap-2 mb-6">
          {(['pending', 'approved', 'rejected'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${statusFilter === s ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-400'}`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white border border-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Bu kategoride öneri bulunmuyor.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${CONTENT_TYPE_COLORS[item.content_type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {CONTENT_TYPE_LABELS[item.content_type] ?? item.content_type}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${STATUS_COLORS[item.status] ?? ''}`}>
                        {STATUS_LABELS[item.status]}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">{item.display_name}</span>
                      <span className="text-xs text-gray-400">{item.email}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{item.body}</p>
                    {item.admin_note && (
                      <p className="mt-2 text-xs text-gray-400 italic">Not: {item.admin_note}</p>
                    )}
                  </div>
                  {item.status === 'pending' && (
                    <button
                      onClick={() => setSelected(item)}
                      className="shrink-0 px-3 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
                    >
                      İncele
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

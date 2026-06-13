'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const TYPE_FILTERS = [
  { key: '', label: 'Tümü' },
  { key: 'guide', label: 'Rehber' },
  { key: 'article', label: 'Makale' },
  { key: 'roadmap', label: 'Yol Haritası' },
  { key: 'technical_doc', label: 'Teknik Doküman' },
  { key: 'career_guide', label: 'Kariyer Rehberi' },
];

const PAGE_SIZE = 50;

function isNew(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() < 30 * 24 * 60 * 60 * 1000;
}

const TYPE_LABELS: Record<string, string> = Object.fromEntries(TYPE_FILTERS.map(t => [t.key, t.label]));
const TYPE_COLORS: Record<string, string> = {
  guide: 'bg-emerald-100 text-emerald-700',
  article: 'bg-blue-100 text-blue-700',
  roadmap: 'bg-violet-100 text-violet-700',
  technical_doc: 'bg-amber-100 text-amber-700',
  career_guide: 'bg-rose-100 text-rose-700',
};

interface Guide {
  id: string;
  slug: string;
  title: string;
  summary: string;
  type: string;
  fields: string[];
  tags: string[];
  authorName: string | null;
  isFeatured: boolean;
  readingTimeMinutes: number | null;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  seriesSlug: string | null;
  seriesOrder: number | null;
}

function SuggestModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ title: '', summary: '', type: '', submitterName: '', submitterEmail: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch(`${API}/api/v1/library/guides/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          summary: form.summary.trim() || undefined,
          type: form.type || undefined,
          submitterName: form.submitterName.trim() || undefined,
          submitterEmail: form.submitterEmail.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error('Hata');
      setStatus('success');
    } catch {
      setErrMsg('Gönderim sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      setStatus('error');
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-black text-gray-900">Rehber Öner</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {status === 'success' ? (
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Öneriniz alındı!</h3>
            <p className="text-sm text-gray-500 mb-6">Rehber öneriniz editörlerimize iletildi. Teşekkürler.</p>
            <button onClick={onClose} className="px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
              Kapat
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => { void submit(e); }} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Rehber Başlığı <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Örn: CBS'de Koordinat Dönüşümü"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kısa Açıklama</label>
              <textarea
                rows={2}
                value={form.summary}
                onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                placeholder="Bu rehber ne anlatmalı?"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">İçerik Türü</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">Seçin (opsiyonel)</option>
                {TYPE_FILTERS.filter(t => t.key).map(t => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Adınız</label>
                <input
                  type="text"
                  value={form.submitterName}
                  onChange={e => setForm(f => ({ ...f, submitterName: e.target.value }))}
                  placeholder="Ali Veli"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">E-posta</label>
                <input
                  type="email"
                  value={form.submitterEmail}
                  onChange={e => setForm(f => ({ ...f, submitterEmail: e.target.value }))}
                  placeholder="ali@ornek.com"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {status === 'error' && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{errMsg}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={status === 'sending' || !form.title.trim()}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'sending' ? 'Gönderiliyor…' : 'Öner'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function RehberlerPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showSuggest, setShowSuggest] = useState(false);
  const pageRef = useRef(0);

  const fetchPage = useCallback(async (append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const url = new URL(`${API}/api/v1/library/guides`);
      if (typeFilter) url.searchParams.set('type', typeFilter);
      url.searchParams.set('limit', String(PAGE_SIZE));
      url.searchParams.set('offset', String(pageRef.current * PAGE_SIZE));
      const res = await fetch(url.toString());
      const batch = await res.json() as Guide[];
      const items = Array.isArray(batch) ? batch : [];
      setGuides(prev => append ? [...prev, ...items] : items);
      setHasMore(items.length === PAGE_SIZE);
    } catch {
      if (!append) setGuides([]);
    } finally {
      if (append) setLoadingMore(false); else setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    pageRef.current = 0;
    void fetchPage(false);
  }, [fetchPage]);

  function loadMore() {
    pageRef.current += 1;
    void fetchPage(true);
  }

  return (
    <>
      <Navbar />
      {showSuggest && <SuggestModal onClose={() => setShowSuggest(false)} />}
      <main className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center gap-2 mb-4 text-sm">
              <Link href="/kutuphane" className="text-white/60 hover:text-white transition-colors">Meslek Kütüphanesi</Link>
              <span className="text-white/40">›</span>
              <span className="text-white/90">Rehberler</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black mb-2">Rehberler & Makaleler</h1>
                <p className="text-white/70 text-sm max-w-lg">Adım adım rehberler, teknik kılavuzlar ve kariyer makaleleri.</p>
              </div>
              <button
                onClick={() => setShowSuggest(true)}
                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-semibold rounded-xl transition-colors backdrop-blur-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Rehber Öner
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap gap-2 mb-8">
            {TYPE_FILTERS.map(t => (
              <button
                key={t.key}
                onClick={() => setTypeFilter(t.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${typeFilter === t.key ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-700'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-40 bg-white border border-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : guides.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">Rehber içerikleri hazırlanıyor.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {guides.map(item => (
                <Link
                  key={item.id}
                  href={`/kutuphane/rehberler/${item.slug}`}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-200 transition-all group block"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${TYPE_COLORS[item.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABELS[item.type] ?? item.type}
                      </span>
                      {isNew(item.publishedAt ?? item.createdAt) && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">Yeni</span>
                      )}
                      {item.seriesSlug && (
                        <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-md">
                          Seri {item.seriesOrder ? `#${item.seriesOrder}` : ''}
                        </span>
                      )}
                      {item.tags.find(t => t.startsWith('seviye:')) && (
                        <span className="text-[10px] font-semibold bg-[#26496b]/10 text-[#26496b] px-2 py-0.5 rounded-md">
                          {item.tags.find(t => t.startsWith('seviye:'))!.replace('seviye:', '')}
                        </span>
                      )}
                    </div>
                    {item.readingTimeMinutes && (
                      <span className="text-[11px] text-gray-400 shrink-0">{item.readingTimeMinutes} dk</span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-2 group-hover:text-emerald-700 transition-colors leading-snug">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{item.summary}</p>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.filter(t => !t.startsWith('seviye:')).slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {hasMore && !loading && guides.length > 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-emerald-400 hover:text-emerald-700 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Yükleniyor…' : 'Daha Fazla Göster'}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

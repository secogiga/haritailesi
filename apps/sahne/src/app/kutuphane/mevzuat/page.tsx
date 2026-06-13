'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const PAGE_SIZE = 50;

function isNew(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() < 30 * 24 * 60 * 60 * 1000;
}

const TYPE_FILTERS = [
  { key: '', label: 'Tümü' },
  { key: 'kanun', label: 'Kanun' },
  { key: 'yonetmelik', label: 'Yönetmelik' },
  { key: 'genelge', label: 'Genelge' },
  { key: 'teknik_teblig', label: 'Teknik Tebliğ' },
  { key: 'kurum_yazisi', label: 'Kurum Yazısı' },
];

const TYPE_LABELS: Record<string, string> = Object.fromEntries(TYPE_FILTERS.map(t => [t.key, t.label]));
const TYPE_COLORS: Record<string, string> = {
  kanun: 'bg-rose-100 text-rose-700',
  yonetmelik: 'bg-orange-100 text-orange-700',
  genelge: 'bg-amber-100 text-amber-700',
  teknik_teblig: 'bg-pink-100 text-pink-700',
  kurum_yazisi: 'bg-gray-100 text-gray-600',
};

const VALIDITY_BADGES: Record<string, { label: string; cls: string }> = {
  yururlukte: { label: 'Yürürlükte', cls: 'bg-emerald-100 text-emerald-700' },
  degistirildi: { label: 'Değiştirildi', cls: 'bg-amber-100 text-amber-700' },
  iptal_edildi: { label: 'İptal Edildi', cls: 'bg-red-100 text-red-600 line-through' },
};

interface Regulation {
  id: string;
  slug: string;
  title: string;
  shortTitle: string | null;
  type: string;
  fields: string[];
  issuingBody: string | null;
  referenceNumber: string | null;
  publishDate: string | null;
  summary: string | null;
  aiSummary: string | null;
  externalUrl: string | null;
  isFeatured: boolean;
  validityStatus: string;
  viewCount: number;
  createdAt: string;
}

export default function MevzuatPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pageRef = useRef(0);

  const fetchPage = useCallback(async (append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const url = new URL(`${API}/api/v1/library/regulations`);
      if (typeFilter) url.searchParams.set('type', typeFilter);
      url.searchParams.set('limit', String(PAGE_SIZE));
      url.searchParams.set('offset', String(pageRef.current * PAGE_SIZE));
      const res = await fetch(url.toString());
      const batch = await res.json() as Regulation[];
      const items = Array.isArray(batch) ? batch : [];
      setRegulations(prev => append ? [...prev, ...items] : items);
      setHasMore(items.length === PAGE_SIZE);
    } catch {
      if (!append) setRegulations([]);
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
      <main className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-rose-600 to-pink-700 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center gap-2 mb-4 text-sm">
              <Link href="/kutuphane" className="text-white/60 hover:text-white transition-colors">Meslek Kütüphanesi</Link>
              <span className="text-white/40">›</span>
              <span className="text-white/90">Mevzuat Merkezi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mb-2">Mevzuat Merkezi</h1>
            <p className="text-white/70 text-sm max-w-lg">Mesleki mevzuatı erişilebilir ve anlaşılır hale getiriyoruz.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap gap-2 mb-8">
            {TYPE_FILTERS.map(t => (
              <button
                key={t.key}
                onClick={() => setTypeFilter(t.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${typeFilter === t.key ? 'bg-rose-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-rose-400 hover:text-rose-700'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white border border-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : regulations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <p className="text-gray-500 text-sm mb-2">Mevzuat içerikleri hazırlanıyor.</p>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mt-4 max-w-sm mx-auto">
                <p className="text-xs font-semibold text-rose-800 mb-1">Editörler çalışıyor</p>
                <p className="text-xs text-rose-600">Her mevzuat için özet, AI açıklaması ve ilgili rehberler eklenecek.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {regulations.map(reg => (
                <div key={reg.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${TYPE_COLORS[reg.type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {TYPE_LABELS[reg.type] ?? reg.type}
                        </span>
                        {reg.issuingBody && <span className="text-[11px] text-gray-400">{reg.issuingBody}</span>}
                        {reg.publishDate && <span className="text-[11px] text-gray-400">{reg.publishDate}</span>}
                        {isNew(reg.createdAt) && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">Yeni</span>}
                        {reg.isFeatured && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">Öne Çıkan</span>}
                        {reg.validityStatus && reg.validityStatus !== 'yururlukte' && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${VALIDITY_BADGES[reg.validityStatus]?.cls ?? 'bg-gray-100 text-gray-500'}`}>
                            {VALIDITY_BADGES[reg.validityStatus]?.label ?? reg.validityStatus}
                          </span>
                        )}
                      </div>
                      <Link href={`/kutuphane/mevzuat/${reg.slug}`} className="block">
                        <h3 className="font-bold text-gray-900 text-sm hover:text-rose-700 transition-colors">{reg.title}</h3>
                      </Link>
                      {reg.referenceNumber && <p className="text-[11px] text-gray-400 mt-0.5">Ref: {reg.referenceNumber}</p>}
                    </div>
                    <button
                      onClick={() => setExpandedId(expandedId === reg.id ? null : reg.id)}
                      className="shrink-0 mt-1 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      aria-label="Özeti göster"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${expandedId === reg.id ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {expandedId === reg.id && (
                    <div className="border-t border-gray-100 px-5 py-4 space-y-3">
                      {reg.aiSummary && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-[11px] font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">AI Özeti</span>
                          </div>
                          <p className="text-sm text-blue-800 leading-relaxed">{reg.aiSummary}</p>
                        </div>
                      )}
                      {reg.summary && !reg.aiSummary && (
                        <p className="text-sm text-gray-600 leading-relaxed">{reg.summary}</p>
                      )}
                      {reg.externalUrl && (
                        <a
                          href={reg.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-semibold text-rose-700 hover:text-rose-900 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Resmi metne git →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {hasMore && !loading && regulations.length > 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-rose-400 hover:text-rose-700 transition-colors disabled:opacity-50"
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

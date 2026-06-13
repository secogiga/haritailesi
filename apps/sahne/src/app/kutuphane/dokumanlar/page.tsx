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
  { key: 'pdf', label: 'PDF' },
  { key: 'technical_spec', label: 'Teknik Şartname' },
  { key: 'academic', label: 'Akademik Yayın' },
  { key: 'report', label: 'Rapor' },
  { key: 'standard', label: 'Standart' },
  { key: 'guide_doc', label: 'Kılavuz' },
];

const TYPE_LABELS: Record<string, string> = Object.fromEntries(TYPE_FILTERS.map(t => [t.key, t.label]));
const TYPE_COLORS: Record<string, string> = {
  pdf: 'bg-red-100 text-red-700',
  technical_spec: 'bg-blue-100 text-blue-700',
  academic: 'bg-violet-100 text-violet-700',
  report: 'bg-amber-100 text-amber-700',
  standard: 'bg-teal-100 text-teal-700',
  guide_doc: 'bg-emerald-100 text-emerald-700',
};

interface Document {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fields: string[];
  tags: string[];
  authorName: string | null;
  publishYear: number | null;
  fileUrl: string | null;
  externalUrl: string | null;
  isFeatured: boolean;
  downloadCount: number;
  createdAt: string;
}

export default function DokumanlarPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  const fetchPage = useCallback(async (append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const url = new URL(`${API}/api/v1/library/documents`);
      if (typeFilter) url.searchParams.set('type', typeFilter);
      url.searchParams.set('limit', String(PAGE_SIZE));
      url.searchParams.set('offset', String(pageRef.current * PAGE_SIZE));
      const res = await fetch(url.toString());
      const batch = await res.json() as Document[];
      const items = Array.isArray(batch) ? batch : [];
      setDocuments(prev => append ? [...prev, ...items] : items);
      setHasMore(items.length === PAGE_SIZE);
    } catch {
      if (!append) setDocuments([]);
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
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center gap-2 mb-4 text-sm">
              <Link href="/kutuphane" className="text-white/60 hover:text-white transition-colors">Meslek Kütüphanesi</Link>
              <span className="text-white/40">›</span>
              <span className="text-white/90">Doküman Merkezi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mb-2">Doküman Merkezi</h1>
            <p className="text-white/70 text-sm max-w-lg">Teknik şartnameler, akademik yayınlar, raporlar ve standartlar tek yerde.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap gap-2 mb-8">
            {TYPE_FILTERS.map(t => (
              <button
                key={t.key}
                onClick={() => setTypeFilter(t.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${typeFilter === t.key ? 'bg-amber-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-700'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white border border-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="font-bold text-gray-900 text-lg mb-2">Doküman Merkezi hazırlanıyor</h2>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">PDF, teknik şartname ve akademik yayınlar eklenecek.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => {
                const href = doc.fileUrl ?? doc.externalUrl ?? '#';
                const isExternal = !!(doc.fileUrl ?? doc.externalUrl);
                return (
                  <a
                    key={doc.id}
                    href={href}
                    target={isExternal ? '_blank' : undefined}
                    rel="noreferrer"
                    className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 hover:border-amber-200 hover:shadow-sm transition-all group"
                  >
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 text-amber-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${TYPE_COLORS[doc.type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {TYPE_LABELS[doc.type] ?? doc.type}
                        </span>
                        {doc.publishYear && <span className="text-[11px] text-gray-400">{doc.publishYear}</span>}
                        {isNew(doc.createdAt) && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">Yeni</span>}
                      </div>
                      <p className="font-semibold text-gray-900 text-sm group-hover:text-amber-700 transition-colors">{doc.title}</p>
                      {doc.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{doc.description}</p>}
                      {doc.authorName && <p className="text-[11px] text-gray-400 mt-0.5">{doc.authorName}</p>}
                    </div>
                    {isExternal && (
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-amber-500 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    )}
                  </a>
                );
              })}
            </div>
          )}

          {hasMore && !loading && documents.length > 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-amber-400 hover:text-amber-700 transition-colors disabled:opacity-50"
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

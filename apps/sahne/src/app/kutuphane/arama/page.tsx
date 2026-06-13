'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const FIELD_LABELS: Record<string, string> = {
  klasik_haritacilik: 'Klasik Haritacılık', cbs: 'CBS', fotogrametri: 'Fotogrametri',
  kadastro: 'Kadastro', uzaktan_algilama: 'Uzaktan Algılama',
  gayrimenkul_degerleme: 'Gayrimenkul Değerleme', yazilim: 'Yazılım',
  kariyer: 'Kariyer', egitim: 'Eğitim', kamu: 'Kamu',
  ozel_sektor: 'Özel Sektör', insaat: 'İnşaat', genel: 'Genel',
};

const TYPE_LABELS: Record<string, string> = {
  guide: 'Rehber', article: 'Makale', roadmap: 'Yol Haritası',
  technical_doc: 'Teknik Doküman', career_guide: 'Kariyer Rehberi',
  pdf: 'PDF', technical_spec: 'Teknik Şartname', academic: 'Akademik',
  report: 'Rapor', standard: 'Standart', guide_doc: 'Kılavuz',
  kanun: 'Kanun', yonetmelik: 'Yönetmelik', genelge: 'Genelge',
  teknik_teblig: 'Teknik Tebliğ', kurum_yazisi: 'Kurum Yazısı',
};

interface Term { id: string; slug?: string | null; term: string; fullForm: string | null; excerpt: string; fields: string[]; isFeatured: boolean }
interface Guide { id: string; slug: string; title: string; excerpt: string; type: string; fields: string[]; readingTimeMinutes: number | null }
interface Document { id: string; title: string; excerpt: string | null; type: string; fields: string[] }
interface Regulation { id: string; slug: string; title: string; shortTitle: string | null; excerpt: string | null; type: string; fields: string[] }
interface Results { terms: Term[]; guides: Guide[]; documents: Document[]; regulations: Regulation[] }

function FieldPills({ fields }: { fields: string[] }) {
  if (!fields.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {fields.slice(0, 3).map(f => (
        <span key={f} className="text-[10px] px-1.5 py-0.5 bg-[#26496b]/8 text-[#26496b] rounded-md font-medium">
          {FIELD_LABELS[f] ?? f}
        </span>
      ))}
    </div>
  );
}

function Section({ title, icon, count, children }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-[#26496b]/10 flex items-center justify-center text-[#26496b]">{icon}</div>
        <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function AramaPage() {
  return (
    <Suspense fallback={null}>
      <AramaPageInner />
    </Suspense>
  );
}

function AramaPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/library/search?q=${encodeURIComponent(q.trim())}&limit=8`);
      setResults(await res.json() as Results);
    } catch { setResults(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setQuery(q);
    void search(q);
  }, [searchParams, search]);

  const total = results ? results.terms.length + results.guides.length + results.documents.length + results.regulations.length : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/kutuphane/arama?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0c1a2e] via-[#26496b] to-[#1a3350] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center gap-2 text-xs text-white/50 mb-4">
              <Link href="/kutuphane" className="hover:text-white/80 transition-colors">Meslek Kütüphanesi</Link>
              <span>›</span>
              <span className="text-white/80">Arama</span>
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0118 0z" />
                </svg>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Terim, rehber, mevzuat, doküman ara…"
                  className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:bg-white/15 focus:border-white/40"
                  autoFocus
                />
              </div>
              <button type="submit" className="px-5 py-3 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-sm text-white font-semibold transition-colors">
                Ara
              </button>
            </form>
            {results && (
              <p className="text-xs text-white/50 mt-3">
                {total === 0 ? `"${searchParams.get('q')}" için sonuç bulunamadı` : `${total} sonuç bulundu`}
              </p>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {loading && (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
            </div>
          )}

          {!loading && results && total === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0118 0z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-700 mb-1">Sonuç bulunamadı</p>
              <p className="text-sm text-gray-400">Farklı bir arama terimi deneyin veya kütüphane bölümlerini doğrudan keşfedin.</p>
              <Link href="/kutuphane" className="mt-4 inline-block text-sm text-[#26496b] font-semibold hover:underline">
                Kütüphaneye Dön →
              </Link>
            </div>
          )}

          {!loading && results && total > 0 && (
            <div className="space-y-8">
              {/* Terimler */}
              <Section title="Meslek Sözlüğü" count={results.terms.length} icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
              }>
                {results.terms.map(t => (
                  <Link key={t.id} href={t.slug ? `/kutuphane/sozluk/${t.slug}` : '/kutuphane/sozluk'} className="block bg-white rounded-xl border border-gray-100 hover:border-violet-200 hover:shadow-sm px-4 py-3 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700 shrink-0 mt-0.5 font-bold text-xs">T</div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{t.term}{t.fullForm ? <span className="text-gray-400 font-normal ml-1.5">({t.fullForm})</span> : null}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.excerpt}</p>
                        <FieldPills fields={t.fields} />
                      </div>
                    </div>
                  </Link>
                ))}
              </Section>

              {/* Rehberler */}
              <Section title="Rehberler" count={results.guides.length} icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              }>
                {results.guides.map(g => (
                  <Link key={g.id} href={`/kutuphane/rehberler/${g.slug}`} className="block bg-white rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm px-4 py-3 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5 font-bold text-xs">R</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 text-sm">{g.title}</p>
                          {g.type && <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-md">{TYPE_LABELS[g.type] ?? g.type}</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{g.excerpt}</p>
                        <FieldPills fields={g.fields} />
                      </div>
                    </div>
                  </Link>
                ))}
              </Section>

              {/* Dokümanlar */}
              <Section title="Dokümanlar" count={results.documents.length} icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              }>
                {results.documents.map(d => (
                  <Link key={d.id} href="/kutuphane/dokumanlar" className="block bg-white rounded-xl border border-gray-100 hover:border-amber-200 hover:shadow-sm px-4 py-3 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5 font-bold text-xs">D</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 text-sm">{d.title}</p>
                          {d.type && <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded-md">{TYPE_LABELS[d.type] ?? d.type}</span>}
                        </div>
                        {d.excerpt && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{d.excerpt}</p>}
                        <FieldPills fields={d.fields} />
                      </div>
                    </div>
                  </Link>
                ))}
              </Section>

              {/* Mevzuat */}
              <Section title="Mevzuat" count={results.regulations.length} icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
              }>
                {results.regulations.map(r => (
                  <Link key={r.id} href={`/kutuphane/mevzuat/${r.slug}`} className="block bg-white rounded-xl border border-gray-100 hover:border-rose-200 hover:shadow-sm px-4 py-3 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 shrink-0 mt-0.5 font-bold text-xs">M</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 text-sm">{r.shortTitle ?? r.title}</p>
                          {r.type && <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 rounded-md">{TYPE_LABELS[r.type] ?? r.type}</span>}
                        </div>
                        {r.excerpt && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.excerpt}</p>}
                        <FieldPills fields={r.fields} />
                      </div>
                    </div>
                  </Link>
                ))}
              </Section>
            </div>
          )}

          {!loading && !results && !searchParams.get('q') && (
            <div className="text-center py-16 text-gray-400 text-sm">
              Aramak istediğiniz terimi, rehberi veya mevzuatı yazın.
            </div>
          )}
        </div>
      </main>
    </>
  );
}

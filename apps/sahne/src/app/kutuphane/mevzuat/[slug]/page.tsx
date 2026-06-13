import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { BookmarkButton, FollowButton, CommentSection, ReadingListButton, ProgressButton, SuggestionButton, ContextualAICard, MembershipCTACard, RelatedEventsCard, SourceLevelBadge } from '../../_library-client';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const TYPE_LABELS: Record<string, string> = {
  kanun: 'Kanun', yonetmelik: 'Yönetmelik', genelge: 'Genelge',
  teknik_teblig: 'Teknik Tebliğ', kurum_yazisi: 'Kurum Yazısı',
};

const TYPE_COLORS: Record<string, string> = {
  kanun: 'bg-rose-100 text-rose-700', yonetmelik: 'bg-orange-100 text-orange-700',
  genelge: 'bg-amber-100 text-amber-700', teknik_teblig: 'bg-pink-100 text-pink-700',
  kurum_yazisi: 'bg-gray-100 text-gray-600',
};

const FIELD_LABELS: Record<string, string> = {
  klasik_haritacilik: 'Klasik Haritacılık', cbs: 'CBS', fotogrametri: 'Fotogrametri',
  kadastro: 'Kadastro', uzaktan_algilama: 'Uzaktan Algılama',
  gayrimenkul_degerleme: 'Gayrimenkul Değerleme', yazilim: 'Yazılım',
  kariyer: 'Kariyer', egitim: 'Eğitim', kamu: 'Kamu',
  ozel_sektor: 'Özel Sektör', insaat: 'İnşaat', genel: 'Genel',
};

interface RelatedTerm { slug: string | null; term: string; definition: string }
interface ChangelogEntry { date: string; note: string; }

const VALIDITY_BADGES: Record<string, { label: string; cls: string }> = {
  yururlukte: { label: 'Yürürlükte', cls: 'bg-emerald-100 text-emerald-700' },
  degistirildi: { label: 'Değiştirildi', cls: 'bg-amber-100 text-amber-700' },
  iptal_edildi: { label: 'İptal Edildi', cls: 'bg-red-100 text-red-600' },
};

interface Regulation {
  id: string; slug: string; title: string; shortTitle: string | null;
  type: string; fields: string[]; issuingBody: string | null;
  referenceNumber: string | null; publishDate: string | null;
  summary: string | null; fullText: string | null; aiSummary: string | null;
  externalUrl: string | null; isFeatured: boolean; viewCount: number;
  validityStatus?: string;
  sourceLevel?: string | null;
  relatedTerms?: RelatedTerm[];
  changelogEntries?: ChangelogEntry[];
}

async function fetchRegulation(slug: string): Promise<Regulation | null> {
  try {
    const res = await fetch(`${API}/api/v1/library/regulations/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<Regulation>;
  } catch { return null; }
}

const SAHNE_BASE = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const reg = await fetchRegulation(slug);
  if (!reg) return { title: 'Mevzuat Bulunamadı' };
  const desc = reg.summary ?? reg.aiSummary ?? undefined;
  return {
    title: `${reg.shortTitle ?? reg.title} | Mevzuat Merkezi — Haritailesi`,
    description: desc,
    openGraph: {
      title: reg.shortTitle ?? reg.title,
      description: desc,
      type: 'article',
      url: `${SAHNE_BASE}/kutuphane/mevzuat/${reg.slug}`,
    },
  };
}

export default async function MevzuatDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const reg = await fetchRegulation(slug);
  if (!reg) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Legislation',
    name: reg.title,
    alternativeName: reg.shortTitle ?? undefined,
    description: reg.summary ?? reg.aiSummary ?? undefined,
    url: `${SAHNE_BASE}/kutuphane/mevzuat/${reg.slug}`,
    ...(reg.publishDate ? { datePublished: reg.publishDate } : {}),
    ...(reg.issuingBody ? { creator: { '@type': 'Organization', name: reg.issuingBody } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-rose-600 to-pink-700 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center gap-2 mb-4 text-sm">
              <Link href="/kutuphane" className="text-white/60 hover:text-white transition-colors">Meslek Kütüphanesi</Link>
              <span className="text-white/40">›</span>
              <Link href="/kutuphane/mevzuat" className="text-white/60 hover:text-white transition-colors">Mevzuat Merkezi</Link>
              <span className="text-white/40">›</span>
              <span className="text-white/90 line-clamp-1">{reg.shortTitle ?? reg.title}</span>
            </div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${TYPE_COLORS[reg.type] ?? 'bg-white/20 text-white'}`}>
                {TYPE_LABELS[reg.type] ?? reg.type}
              </span>
              {reg.isFeatured && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700">Öne Çıkan</span>
              )}
              {reg.validityStatus && VALIDITY_BADGES[reg.validityStatus] && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${VALIDITY_BADGES[reg.validityStatus]!.cls}`}>
                  {VALIDITY_BADGES[reg.validityStatus]!.label}
                </span>
              )}
              <SourceLevelBadge sourceLevel={reg.sourceLevel} />
            </div>

            <h1 className="text-xl sm:text-2xl font-black mb-3 leading-tight">{reg.title}</h1>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-white/60">
              {reg.issuingBody && <span>{reg.issuingBody}</span>}
              {reg.referenceNumber && <span>No: {reg.referenceNumber}</span>}
              {reg.publishDate && <span>{reg.publishDate}</span>}
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {reg.viewCount.toLocaleString('tr-TR')} görüntülenme
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main */}
            <div className="flex-1 min-w-0 space-y-5">
              {reg.aiSummary && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">AI Özeti</span>
                  </div>
                  <p className="text-sm text-blue-900 leading-relaxed">{reg.aiSummary}</p>
                </div>
              )}

              {reg.summary && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-sm font-bold text-gray-700 mb-3">{reg.aiSummary ? 'Resmi Özet' : 'Özet'}</h2>
                  <p className="text-sm text-gray-700 leading-relaxed">{reg.summary}</p>
                </div>
              )}

              {reg.fullText && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-sm font-bold text-gray-700 mb-4">Tam Metin</h2>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-mono text-xs bg-gray-50 rounded-xl p-4 overflow-x-auto">
                    {reg.fullText}
                  </div>
                </div>
              )}

              {reg.relatedTerms && reg.relatedTerms.length > 0 && (
                <div className="bg-violet-50 border border-violet-100 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-violet-200 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-violet-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-bold text-violet-900">Bu Mevzuatta Tanımlanan Terimler</h2>
                  </div>
                  <div className="space-y-3">
                    {reg.relatedTerms.map(t => (
                      <div key={t.term} className="bg-white rounded-xl border border-violet-100 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-violet-800 text-sm">{t.term}</p>
                          {t.slug && (
                            <Link href={`/kutuphane/sozluk/${t.slug}`}
                              className="text-[10px] font-semibold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full hover:bg-violet-200 transition-colors shrink-0">
                              Sözlük →
                            </Link>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">{t.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!reg.aiSummary && !reg.summary && !reg.fullText && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <h2 className="font-bold text-gray-900 text-lg mb-2">İçerik hazırlanıyor</h2>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">Bu mevzuatın özeti ve tam metni yakında eklenecek.</p>
                  {reg.externalUrl && (
                    <a
                      href={reg.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:underline"
                    >
                      Resmi kaynağa git →
                    </a>
                  )}
                </div>
              )}

              {reg.changelogEntries && reg.changelogEntries.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-sm font-bold text-gray-800">Değişiklik Geçmişi</h2>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{reg.changelogEntries.length}</span>
                  </div>
                  <ol className="relative border-l border-gray-200 ml-2 space-y-4">
                    {[...reg.changelogEntries].reverse().map((entry, i) => (
                      <li key={i} className="ml-4">
                        <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-rose-200 border-2 border-white" />
                        <time className="text-[11px] font-semibold text-gray-400 mb-1 block">
                          {new Date(entry.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </time>
                        <p className="text-sm text-gray-700 leading-relaxed">{entry.note}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <CommentSection contentType="regulation" contentId={reg.id} />
            </div>

            {/* Sidebar */}
            <aside className="lg:w-64 shrink-0 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bilgiler</p>
                {reg.issuingBody && (
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">Yayımlayan</p>
                    <p className="text-sm font-medium text-gray-800">{reg.issuingBody}</p>
                  </div>
                )}
                {reg.referenceNumber && (
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">Referans No</p>
                    <p className="text-sm font-medium text-gray-800">{reg.referenceNumber}</p>
                  </div>
                )}
                {reg.publishDate && (
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">Yayım Tarihi</p>
                    <p className="text-sm font-medium text-gray-800">{reg.publishDate}</p>
                  </div>
                )}
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">Tür</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block ${TYPE_COLORS[reg.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {TYPE_LABELS[reg.type] ?? reg.type}
                  </span>
                </div>
              </div>

              {reg.fields.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Meslek Alanları</p>
                  <div className="flex flex-wrap gap-1.5">
                    {reg.fields.map(f => (
                      <span key={f} className="text-xs bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full font-medium">
                        {FIELD_LABELS[f] ?? f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {reg.externalUrl && (
                <div className="bg-rose-50 rounded-2xl border border-rose-100 p-5">
                  <p className="text-xs font-bold text-rose-800 mb-3">Resmi Kaynak</p>
                  <a
                    href={reg.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 text-xs font-semibold text-rose-700 bg-white border border-rose-200 rounded-xl px-3 py-2 hover:bg-rose-700 hover:text-white hover:border-rose-700 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Resmi Metne Git →
                  </a>
                </div>
              )}

              <FollowButton regulationSlug={reg.slug} className="w-full justify-center" />

              <BookmarkButton
                type="regulations"
                id={reg.id}
                title={reg.shortTitle ?? reg.title}
                slug={reg.slug}
                className="w-full justify-center"
              />
              <ReadingListButton
                contentType="regulation"
                contentId={reg.id}
                title={reg.shortTitle ?? reg.title}
                slug={reg.slug}
                className="w-full justify-center"
              />
              <ProgressButton
                contentType="regulation"
                contentId={reg.id}
                className="w-full justify-center"
              />
              <SuggestionButton
                contentType="regulation"
                contentId={reg.id}
                className="w-full justify-center"
              />

              <RelatedEventsCard fields={reg.fields} />
              <ContextualAICard contentType="regulation" title={reg.shortTitle ?? reg.title} slug={reg.slug} />
              <MembershipCTACard />

              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
                <Link
                  href="/kutuphane/mevzuat"
                  className="block text-center text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-colors"
                >
                  Tüm Mevzuat →
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

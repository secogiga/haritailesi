import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Navbar from '@/components/Navbar';
import { BookmarkButton, HelpfulButton, CommentSection, ReadingListButton, ProgressButton, SuggestionButton, ContextualAICard, MembershipCTACard, RelatedEventsCard, AuthorCard, SourceLevelBadge, LevelBadge, PrerequisitesCard, ContributorsCard, UserBadgesCard } from '../../_library-client';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const TYPE_LABELS: Record<string, string> = {
  guide: 'Rehber',
  article: 'Makale',
  roadmap: 'Yol Haritası',
  technical_doc: 'Teknik Doküman',
  career_guide: 'Kariyer Rehberi',
};

const TYPE_COLORS: Record<string, string> = {
  guide: 'bg-emerald-100 text-emerald-700',
  article: 'bg-blue-100 text-blue-700',
  roadmap: 'bg-violet-100 text-violet-700',
  technical_doc: 'bg-amber-100 text-amber-700',
  career_guide: 'bg-rose-100 text-rose-700',
};

const FIELD_LABELS: Record<string, string> = {
  klasik_haritacilik: 'Klasik Haritacılık',
  cbs: 'CBS',
  fotogrametri: 'Fotogrametri',
  kadastro: 'Kadastro',
  uzaktan_algilama: 'Uzaktan Algılama',
  gayrimenkul_degerleme: 'Gayrimenkul Değerleme',
  yazilim: 'Yazılım',
  kariyer: 'Kariyer',
  egitim: 'Eğitim',
  kamu: 'Kamu',
  ozel_sektor: 'Özel Sektör',
  insaat: 'İnşaat',
  genel: 'Genel',
};

interface RelatedRegulation { slug: string; title: string; shortTitle: string | null; type: string }

interface Guide {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string | null;
  type: string;
  fields: string[];
  tags: string[];
  authorName: string | null;
  isFeatured: boolean;
  readingTimeMinutes: number | null;
  viewCount: number;
  publishedAt: string | null;
  seriesSlug: string | null;
  seriesOrder: number | null;
  relatedRegulations?: RelatedRegulation[];
  level?: string | null;
  sourceLevel?: string | null;
  prerequisites?: Array<{ termSlug: string; termTitle: string }>;
  contributors?: Array<{ name: string; role?: string; userId?: string }>;
}

interface SeriesGuide {
  id: string; slug: string; title: string;
  summary: string; type: string; seriesOrder: number | null;
}

interface RelatedTerm { id: string; term: string; definition: string; slug?: string | null }

function autoLinkTerms(body: string, terms: RelatedTerm[]): string {
  const withSlug = terms.filter(t => t.slug);
  if (!withSlug.length || !body) return body;
  const sorted = [...withSlug].sort((a, b) => b.term.length - a.term.length);
  const termMap = new Map(sorted.map(t => [t.term.toLowerCase(), t]));
  const escapedTerms = sorted.map(t => t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`\\b(${escapedTerms.join('|')})\\b`, 'gi');
  const parts = body.split(/(```[\s\S]*?```|`[^`]+`|\[[^\]]*\]\([^)]*\))/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) return part;
    return part.replace(pattern, (match) => {
      const t = termMap.get(match.toLowerCase());
      return t ? `[${match}](/kutuphane/sozluk/${t.slug!})` : match;
    });
  }).join('');
}

async function fetchSeriesGuides(seriesSlug: string): Promise<SeriesGuide[]> {
  try {
    const res = await fetch(`${API}/api/v1/library/guides/series/${encodeURIComponent(seriesSlug)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json() as SeriesGuide[];
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

async function fetchRelatedTerms(fields: string[]): Promise<RelatedTerm[]> {
  if (!fields.length) return [];
  try {
    const field = fields[0]!;
    const res = await fetch(`${API}/api/v1/library/terms?field=${encodeURIComponent(field)}&featured=true`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json() as RelatedTerm[];
    return Array.isArray(data) ? data.slice(0, 5) : [];
  } catch {
    return [];
  }
}

async function fetchGuide(slug: string): Promise<Guide | null> {
  try {
    const res = await fetch(`${API}/api/v1/library/guides/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<Guide>;
  } catch {
    return null;
  }
}

const SAHNE_BASE = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = await fetchGuide(slug);
  if (!guide) return { title: 'Rehber Bulunamadı' };
  return {
    title: `${guide.title} | Meslek Kütüphanesi — Haritailesi`,
    description: guide.summary,
    openGraph: {
      title: guide.title,
      description: guide.summary,
      type: 'article',
      url: `${SAHNE_BASE}/kutuphane/rehberler/${guide.slug}`,
      ...(guide.publishedAt ? { publishedTime: guide.publishedAt } : {}),
      ...(guide.authorName ? { authors: [guide.authorName] } : {}),
    },
  };
}

export default async function RehberDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await fetchGuide(slug);

  if (!guide) notFound();

  const [relatedTerms, seriesGuides] = await Promise.all([
    fetchRelatedTerms(guide.fields),
    guide.seriesSlug ? fetchSeriesGuides(guide.seriesSlug) : Promise.resolve([]),
  ]);
  const processedBody = guide.body ? autoLinkTerms(guide.body, relatedTerms) : guide.body;

  const publishedDate = guide.publishedAt
    ? new Date(guide.publishedAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.summary,
    url: `${SAHNE_BASE}/kutuphane/rehberler/${guide.slug}`,
    ...(guide.publishedAt ? { datePublished: guide.publishedAt } : {}),
    ...(guide.authorName ? {
      author: {
        '@type': 'Person',
        name: guide.authorName,
        ...(guide.authorName ? { url: `${SAHNE_BASE}/kutuphane/rehberler?author=${encodeURIComponent(guide.authorName)}` } : {}),
      },
    } : {}),
    publisher: { '@type': 'Organization', name: 'Haritailesi', url: SAHNE_BASE },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center gap-2 mb-4 text-sm">
              <Link href="/kutuphane" className="text-white/60 hover:text-white transition-colors">
                Meslek Kütüphanesi
              </Link>
              <span className="text-white/40">›</span>
              <Link href="/kutuphane/rehberler" className="text-white/60 hover:text-white transition-colors">
                Rehberler
              </Link>
              <span className="text-white/40">›</span>
              <span className="text-white/90 line-clamp-1">{guide.title}</span>
            </div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${TYPE_COLORS[guide.type] ?? 'bg-white/20 text-white'}`}>
                {TYPE_LABELS[guide.type] ?? guide.type}
              </span>
              {guide.isFeatured && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700">
                  Öne Çıkan
                </span>
              )}
              <LevelBadge level={guide.level} />
              <SourceLevelBadge sourceLevel={guide.sourceLevel} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black mb-3 leading-tight">{guide.title}</h1>
            <p className="text-white/75 text-sm max-w-2xl leading-relaxed">{guide.summary}</p>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-white/60">
              {guide.authorName && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {guide.authorName}
                </span>
              )}
              {guide.readingTimeMinutes && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {guide.readingTimeMinutes} dk okuma
                </span>
              )}
              {publishedDate && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {publishedDate}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {guide.viewCount.toLocaleString('tr-TR')} görüntülenme
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content */}
            <article className="flex-1 min-w-0">
              {guide.prerequisites && <PrerequisitesCard prerequisites={guide.prerequisites} />}
              {processedBody ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 sm:px-8 py-8">
                  <div className="prose prose-gray prose-sm sm:prose max-w-none
                    prose-headings:font-bold prose-headings:text-gray-900
                    prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                    prose-a:text-emerald-700 prose-a:no-underline hover:prose-a:underline
                    prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:rounded prose-code:px-1 prose-code:py-0.5
                    prose-pre:bg-gray-900 prose-pre:text-gray-100
                    prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50/50 prose-blockquote:not-italic
                    prose-img:rounded-xl prose-img:shadow-md
                    prose-table:text-sm
                    prose-th:bg-gray-50 prose-th:font-semibold">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {processedBody!}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h2 className="font-bold text-gray-900 text-lg mb-2">İçerik hazırlanıyor</h2>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">Bu rehberin detaylı içeriği yakında eklenecek.</p>
                </div>
              )}

              <div className="mt-6">
                <CommentSection contentType="guide" contentId={guide.id} />
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:w-64 shrink-0 space-y-4">
              <AuthorCard guideSlug={guide.slug} />

              {/* Alanlar */}
              {guide.fields.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Meslek Alanları</p>
                  <div className="flex flex-wrap gap-1.5">
                    {guide.fields.map(f => (
                      <span key={f} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">
                        {FIELD_LABELS[f] ?? f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Etiketler */}
              {guide.tags.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Etiketler</p>
                  <div className="flex flex-wrap gap-1.5">
                    {guide.tags.map(tag => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* İlgili Terimler */}
              {relatedTerms.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">İlgili Terimler</p>
                  <div className="space-y-2">
                    {relatedTerms.map(t => (
                      <Link key={t.id} href={t.slug ? `/kutuphane/sozluk/${t.slug}` : '/kutuphane/sozluk'}
                        className="block group">
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">{t.term}</p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{t.definition}</p>
                      </Link>
                    ))}
                  </div>
                  <Link href="/kutuphane/sozluk" className="block mt-3 text-xs font-semibold text-emerald-600 hover:underline">
                    Tüm Sözlük →
                  </Link>
                </div>
              )}

              {/* Seri navigasyonu */}
              {seriesGuides.length > 1 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bu Serinin Rehberleri</p>
                  <div className="space-y-1">
                    {seriesGuides.map((sg, i) => {
                      const isCurrent = sg.slug === guide.slug;
                      return (
                        <Link
                          key={sg.id}
                          href={`/kutuphane/rehberler/${sg.slug}`}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                            isCurrent
                              ? 'bg-emerald-50 text-emerald-800 font-semibold pointer-events-none'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-emerald-700'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                            isCurrent ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {i + 1}
                          </span>
                          <span className="line-clamp-1">{sg.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                  {/* Önceki / Sonraki */}
                  {(() => {
                    const idx = seriesGuides.findIndex(s => s.slug === guide.slug);
                    const prev = seriesGuides[idx - 1];
                    const next = seriesGuides[idx + 1];
                    return (prev || next) ? (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                        {prev && (
                          <Link href={`/kutuphane/rehberler/${prev.slug}`}
                            className="flex-1 text-center text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl py-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors">
                            ← Önceki
                          </Link>
                        )}
                        {next && (
                          <Link href={`/kutuphane/rehberler/${next.slug}`}
                            className="flex-1 text-center text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl py-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors">
                            Sonraki →
                          </Link>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Dayandığı Mevzuat */}
              {guide.relatedRegulations && guide.relatedRegulations.length > 0 && (
                <div className="bg-rose-50 rounded-2xl border border-rose-100 p-5">
                  <p className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3">Dayandığı Mevzuat</p>
                  <div className="space-y-2">
                    {guide.relatedRegulations.map(r => (
                      <Link key={r.slug} href={`/kutuphane/mevzuat/${r.slug}`}
                        className="block group">
                        <p className="text-sm font-semibold text-rose-800 group-hover:text-rose-600 transition-colors line-clamp-2">
                          {r.shortTitle ?? r.title}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Sosyal: Kaydet + Yardımcı Oldu */}
              <BookmarkButton
                type="guides"
                id={guide.id}
                title={guide.title}
                slug={guide.slug}
                className="w-full justify-center"
              />
              <HelpfulButton slug={guide.slug} />
              <ReadingListButton
                contentType="guide"
                contentId={guide.id}
                title={guide.title}
                slug={guide.slug}
                className="w-full justify-center"
              />
              <ProgressButton
                contentType="guide"
                contentId={guide.id}
                className="w-full justify-center"
              />
              <SuggestionButton
                contentType="guide"
                contentId={guide.id}
                className="w-full justify-center"
              />

              {guide.contributors && <ContributorsCard contributors={guide.contributors} />}
              <UserBadgesCard />
              <RelatedEventsCard fields={guide.fields} />
              <ContextualAICard contentType="guide" title={guide.title} slug={guide.slug} />
              <MembershipCTACard />

              {/* Kütüphaneye dön */}
              <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
                <p className="text-xs font-bold text-emerald-800 mb-2">Daha fazla içerik</p>
                <p className="text-xs text-emerald-700 mb-3 leading-relaxed">
                  Meslek Kütüphanesi'nde sözlük, rehberler, dokümanlar ve mevzuat mevcut.
                </p>
                <Link href="/kutuphane/rehberler"
                  className="block text-center text-xs font-semibold text-emerald-700 bg-white border border-emerald-200 rounded-xl px-3 py-2 hover:bg-emerald-700 hover:text-white hover:border-emerald-700 transition-colors">
                  Tüm Rehberler →
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

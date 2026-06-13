import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { BookmarkButton, CommentSection, ReadingListButton, ProgressButton, SuggestionButton, ExamQuestionsSection, ContextualAICard, MembershipCTACard, RelatedEventsCard, SourceLevelBadge, LevelBadge, ContributorsCard, KnowledgeGraphCard, UserBadgesCard } from '../../_library-client';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const FIELD_LABELS: Record<string, string> = {
  klasik_haritacilik: 'Klasik Haritacılık', cbs: 'CBS', fotogrametri: 'Fotogrametri',
  kadastro: 'Kadastro', uzaktan_algilama: 'Uzaktan Algılama',
  gayrimenkul_degerleme: 'Gayrimenkul Değerleme', yazilim: 'Yazılım',
  kariyer: 'Kariyer', egitim: 'Eğitim', kamu: 'Kamu',
  ozel_sektor: 'Özel Sektör', insaat: 'İnşaat', genel: 'Genel',
};

interface Term {
  id: string; slug: string | null; term: string; fullForm: string | null;
  definition: string; fields: string[]; tags: string[];
  isFeatured: boolean; viewCount: number; seeAlso: string[];
  relatedTermIds: string[]; createdAt: string;
  level?: string | null; sourceLevel?: string | null;
  contributors?: Array<{ name: string; role?: string; userId?: string }>;
}

interface TermRegulation {
  id: string; slug: string; title: string; short_title: string | null; type: string;
  issuing_body: string | null; publish_date: string | null;
}
interface ExamQuestion {
  id: string; questionText: string;
  optionA: string; optionB: string; optionC: string; optionD: string; optionE: string | null;
  correctOption: string; explanation: string | null;
  difficulty: string; source: string | null;
  categoryName: string; categorySlug: string; examType: string;
}

async function fetchTerm(slug: string): Promise<Term | null> {
  try {
    const res = await fetch(`${API}/api/v1/library/terms/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json() as Term;
    // normalize potentially null array fields
    data.seeAlso = Array.isArray(data.seeAlso) ? data.seeAlso : [];
    data.fields = Array.isArray(data.fields) ? data.fields : [];
    data.tags = Array.isArray(data.tags) ? data.tags : [];
    data.relatedTermIds = Array.isArray(data.relatedTermIds) ? data.relatedTermIds : [];
    return data;
  } catch { return null; }
}

async function fetchTermRegulations(slug: string): Promise<TermRegulation[]> {
  try {
    const res = await fetch(`${API}/api/v1/library/terms/slug/${encodeURIComponent(slug)}/regulations`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json() as Promise<TermRegulation[]>;
  } catch { return []; }
}

async function fetchExamQuestions(slug: string): Promise<ExamQuestion[]> {
  try {
    const res = await fetch(`${API}/api/v1/library/terms/slug/${encodeURIComponent(slug)}/exam-questions`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json() as Promise<ExamQuestion[]>;
  } catch { return []; }
}

const SAHNE_BASE = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const term = await fetchTerm(slug);
  if (!term) return { title: 'Terim Bulunamadı' };
  return {
    title: `${term.term} | Meslek Sözlüğü — Haritailesi`,
    description: term.definition.slice(0, 160),
    openGraph: {
      title: `${term.term} — Haritacılık Meslek Sözlüğü`,
      description: term.definition.slice(0, 160),
      type: 'article',
      url: `${SAHNE_BASE}/kutuphane/sozluk/${term.slug ?? slug}`,
    },
  };
}

const REG_TYPE_LABELS: Record<string, string> = {
  kanun: 'Kanun', yonetmelik: 'Yönetmelik', genelge: 'Genelge',
  teknik_teblig: 'Teknik Tebliğ', kurum_yazisi: 'Kurum Yazısı',
};

export default async function TermDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [term, termRegulations, examQuestions] = await Promise.all([
    fetchTerm(slug),
    fetchTermRegulations(slug),
    fetchExamQuestions(slug),
  ]);
  if (!term) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term.term,
    description: term.definition,
    url: `${SAHNE_BASE}/kutuphane/sozluk/${term.slug ?? slug}`,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'Haritailesi Meslek Sözlüğü',
      url: `${SAHNE_BASE}/kutuphane/sozluk`,
    },
  };

  const termInitial = term.term[0]?.toUpperCase() ?? 'T';

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="min-h-screen bg-[#f8f9fb]">

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <div className="bg-[#0b1829] text-white relative overflow-hidden">
          {/* Decorative initial letter */}
          <div className="absolute right-8 top-0 bottom-0 flex items-center pointer-events-none select-none">
            <span className="text-[180px] font-black text-white/[0.04] leading-none">{termInitial}</span>
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-xs mb-6">
              <Link href="/kutuphane" className="text-white/40 hover:text-white/70 transition-colors">Meslek Kütüphanesi</Link>
              <span className="text-white/20">›</span>
              <Link href="/kutuphane/sozluk" className="text-white/40 hover:text-white/70 transition-colors">Meslek Sözlüğü</Link>
              <span className="text-white/20">›</span>
              <span className="text-white/70 font-medium truncate max-w-[180px]">{term.term}</span>
            </div>

            <div className="flex items-start gap-4">
              {/* Amber left bar */}
              <div className="w-1 self-stretch bg-amber-400 rounded-full shrink-0 mt-1" />

              <div className="flex-1 min-w-0">
                {/* Badges */}
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  {term.isFeatured && (
                    <span className="text-[9px] font-black bg-amber-400 text-[#0b1829] px-2 py-0.5 rounded-full tracking-wide">★ ÖNE ÇIKAN</span>
                  )}
                  <LevelBadge level={term.level} />
                  <SourceLevelBadge sourceLevel={term.sourceLevel} />
                  {term.fields.slice(0, 3).map(f => (
                    <Link key={f} href={`/kutuphane/sozluk?field=${f}`}
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors">
                      {FIELD_LABELS[f] ?? f}
                    </Link>
                  ))}
                </div>

                <h1 className="text-3xl sm:text-[40px] font-black leading-tight tracking-tight mb-2">{term.term}</h1>
                {term.fullForm && (
                  <p className="text-white/40 text-sm italic">{term.fullForm}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-5 mt-5 pt-4 border-t border-white/[0.07] text-xs text-white/35">
                  <span>{term.viewCount.toLocaleString('tr-TR')} görüntülenme</span>
                  {term.contributors && term.contributors.length > 0 && (
                    <span>{term.contributors.length} katkı sağlayan</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── Main column ─────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-4">

              {/* Definition — Wikipedia style */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex">
                  <div className="w-1 shrink-0 bg-amber-400" />
                  <div className="flex-1 p-6 sm:p-8">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em] mb-4">Tanım</p>
                    <p className="text-gray-800 leading-[1.75] text-[15px]">{term.definition}</p>

                    {term.tags.length > 0 && (
                      <div className="mt-5 pt-5 border-t border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em] mb-3">Etiketler</p>
                        <div className="flex flex-wrap gap-1.5">
                          {term.tags.map(tag => (
                            <Link key={tag} href={`/kutuphane/sozluk?q=${encodeURIComponent(tag)}`}
                              className="text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full hover:bg-gray-200 transition-colors">
                              {tag}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {term.seeAlso.length > 0 && (
                      <div className="mt-5 pt-5 border-t border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em] mb-3">Ayrıca Bakınız</p>
                        <div className="flex flex-wrap gap-2">
                          {term.seeAlso.map(ref => (
                            <Link
                              key={ref}
                              href={`/kutuphane/sozluk?q=${encodeURIComponent(ref)}`}
                              className="text-xs font-semibold text-[#0b1829] bg-amber-50 border border-amber-100 px-3 py-1 rounded-full hover:bg-amber-100 hover:border-amber-200 transition-colors"
                            >
                              {ref}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mevzuat */}
              {termRegulations.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-[#0b1829] flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-bold text-[#0b1829]">Bu Terimi Tanımlayan Mevzuat</h2>
                  </div>
                  <div className="space-y-2">
                    {termRegulations.map(r => (
                      <Link key={r.slug} href={`/kutuphane/mevzuat/${r.slug}`}
                        className="flex items-start gap-3 bg-gray-50 rounded-xl border border-gray-100 p-4 hover:border-[#0b1829]/20 hover:bg-white hover:shadow-sm transition-all group">
                        <span className="text-xs bg-[#0b1829] text-amber-400 font-bold px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                          {REG_TYPE_LABELS[r.type] ?? r.type}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 group-hover:text-[#0b1829] transition-colors leading-snug">
                            {r.short_title ?? r.title}
                          </p>
                          {r.issuing_body && (
                            <p className="text-xs text-gray-400 mt-0.5">{r.issuing_body}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Exam Questions */}
              {examQuestions.length > 0 && (
                <ExamQuestionsSection questions={examQuestions} />
              )}

              {/* Community Answers — StackOverflow style */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#0b1829] flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#0b1829]">Topluluk Katkıları</h2>
                      <p className="text-[11px] text-gray-400">Üyelerimizin bu terime yaptığı ekleme ve yorumlar</p>
                    </div>
                  </div>
                </div>
                <CommentSection contentType="term" contentId={term.id} />
              </div>
            </div>

            {/* ── Sidebar ─────────────────────────────────────────────── */}
            <aside className="lg:w-56 shrink-0 space-y-3">

              {/* Field tags */}
              {term.fields.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2.5">Meslek Alanı</p>
                  <div className="flex flex-wrap gap-1.5">
                    {term.fields.map(f => (
                      <Link key={f} href={`/kutuphane/sozluk?field=${f}`}
                        className="text-[10px] font-bold bg-[#0b1829]/5 text-[#0b1829] border border-[#0b1829]/10 px-2.5 py-0.5 rounded-full hover:bg-[#0b1829] hover:text-white hover:border-[#0b1829] transition-colors">
                        {FIELD_LABELS[f] ?? f}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* View count */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wider font-medium">Görüntülenme</p>
                <p className="text-xl font-black text-[#0b1829]">{term.viewCount.toLocaleString('tr-TR')}</p>
              </div>

              <BookmarkButton
                type="terms"
                id={term.id}
                title={term.term}
                slug={term.slug ?? term.id}
                className="w-full justify-center"
              />
              <ReadingListButton
                contentType="term"
                contentId={term.id}
                title={term.term}
                slug={term.slug ?? term.id}
                className="w-full justify-center"
              />
              <ProgressButton
                contentType="term"
                contentId={term.id}
                className="w-full justify-center"
              />
              <SuggestionButton
                contentType="term"
                contentId={term.id}
                className="w-full justify-center"
              />

              <KnowledgeGraphCard termSlug={term.slug ?? slug} />
              {term.contributors && <ContributorsCard contributors={term.contributors} />}
              <UserBadgesCard />
              <RelatedEventsCard fields={term.fields} />
              <ContextualAICard contentType="term" title={term.term} slug={term.slug ?? slug} />
              <MembershipCTACard />

              {/* Back to dictionary */}
              <div className="bg-[#0b1829] rounded-2xl p-4">
                <p className="text-[10px] font-black text-white/50 uppercase tracking-wider mb-2.5">Tüm Sözlük</p>
                <Link href="/kutuphane/sozluk"
                  className="block text-center text-xs font-bold text-[#0b1829] bg-amber-400 hover:bg-amber-300 rounded-xl px-3 py-2 transition-colors">
                  Sözlüğe Dön →
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

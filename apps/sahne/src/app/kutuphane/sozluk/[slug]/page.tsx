import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  BookmarkButton, CommentSection,
  SourceLevelBadge, LevelBadge, ContributorsCard,
} from '../../_library-client';

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

async function fetchTerm(slug: string): Promise<Term | null> {
  try {
    const res = await fetch(`${API}/api/v1/library/terms/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json() as Term;
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

/* ── SVG Knowledge Graph — server rendered, no flash ── */
function SeeAlsoGraph({ centerTerm, relatedTerms }: { centerTerm: string; relatedTerms: string[] }) {
  const nodes = relatedTerms.slice(0, 7);
  const n = nodes.length;
  if (n === 0) return null;

  const CX = 130, CY = 115, R = 80;
  const positions = nodes.map((_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) };
  });

  const cw = Math.max(60, centerTerm.length * 8 + 24);

  return (
    <svg viewBox="0 0 260 230" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block', margin: '4px 0' }}>
      <defs>
        <filter id="ns" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.07"/>
        </filter>
      </defs>
      {positions.map((pos, i) => (
        <line key={i} x1={CX} y1={CY} x2={pos.x} y2={pos.y} stroke="#e5e7eb" strokeWidth="1.5"/>
      ))}
      {nodes.map((name, i) => {
        const pos = positions[i]!;
        const w = Math.max(44, name.length * 7.5 + 20);
        return (
          <g key={name} cursor="pointer">
            <rect x={pos.x - w / 2} y={pos.y - 12} width={w} height="24" rx="12" fill="white" stroke="#d1d5db" strokeWidth="1.5" filter="url(#ns)"/>
            <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#374151" fontFamily="system-ui,-apple-system,sans-serif">{name}</text>
          </g>
        );
      })}
      <rect x={CX - cw / 2} y="101" width={cw} height="28" rx="14" fill="#0b1829" filter="url(#ns)"/>
      <text x={CX} y="119" textAnchor="middle" fontSize="13" fontWeight="700" fill="white" fontFamily="system-ui,-apple-system,sans-serif">{centerTerm}</text>
    </svg>
  );
}

const REG_TYPE_LABELS: Record<string, string> = {
  kanun: 'Kanun', yonetmelik: 'Yönetmelik', genelge: 'Genelge',
  teknik_teblig: 'Teknik Tebliğ', kurum_yazisi: 'Kurum Yazısı',
};

/* ── Shared header for MAIN COLUMN sections (dark navy icon box) ── */
function SectionHeader({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-[30px] h-[30px] rounded-lg bg-[#0b1829] flex items-center justify-center shrink-0 text-amber-400">
        {icon}
      </div>
      <div>
        <div className="text-[13px] font-black text-[#0b1829]">{title}</div>
        {subtitle && <div className="text-[11px] text-gray-400 mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}

/* ── Shared header for SIDEBAR sections (amber icon + underline) ── */
function SbHead({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mb-3.5">
      <div className="flex items-center gap-[7px]">
        <span className="text-amber-500 shrink-0">{icon}</span>
        <span className="text-[11px] font-black text-[#0b1829] uppercase tracking-[0.08em]">{title}</span>
      </div>
      <div className="w-[22px] h-0.5 bg-amber-400 rounded-full mt-[6px] ml-[23px]" />
    </div>
  );
}

const CARD = 'bg-white rounded-2xl border border-[#e9eaec] shadow-[0_1px_3px_rgba(0,0,0,0.05)]';

export default async function TermDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [term, termRegulations] = await Promise.all([
    fetchTerm(slug),
    fetchTermRegulations(slug),
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

  const createdDate = new Date(term.createdAt).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const definitionPreview = term.definition.length > 220
    ? term.definition.slice(0, 220) + '…'
    : term.definition;

  const faqQuestions = [
    `${term.term} nedir?`,
    `${term.term} nasıl uygulanır?`,
    `${term.term} nerelerde kullanılır?`,
    `${term.term} ile ilgili mevzuat nelerdir?`,
    `${term.term} hakkında nereden bilgi alabilirim?`,
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="min-h-screen bg-[#f0f2f5]">

        {/* ── Hero ── */}
        <div className="bg-[#0b1829] text-white relative overflow-hidden" style={{ padding: '40px 0 0' }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ left: '52%', backgroundImage: "url('/kelime.jpg')", backgroundSize: 'cover', backgroundPosition: 'center left' }}
          >
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #0b1829 0%, rgba(11,24,41,0.9) 30%, rgba(11,24,41,0.25) 100%)' }} />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 mb-6" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
              <Link href="/kutuphane" className="hover:opacity-70 transition-opacity">Meslek Kütüphanesi</Link>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>›</span>
              <Link href="/kutuphane/sozluk" className="hover:opacity-70 transition-opacity">Meslek Sözlüğü</Link>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>›</span>
              <span style={{ color: 'rgba(255,255,255,0.65)' }} className="truncate max-w-[200px]">{term.term}</span>
            </div>

            {/* Field badges */}
            <div className="flex items-center gap-1.5 flex-wrap mb-3.5">
              {term.isFeatured && (
                <span style={{ fontSize: '10px', fontWeight: 800, background: '#F59E0B', color: '#0b1829', padding: '3px 10px', borderRadius: '99px' }}>
                  ★ Öne Çıkan
                </span>
              )}
              <LevelBadge level={term.level} />
              <SourceLevelBadge sourceLevel={term.sourceLevel} />
              {term.fields.map(f => (
                <Link key={f} href={`/kutuphane/sozluk?field=${f}`}
                  style={{ fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '99px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  {FIELD_LABELS[f] ?? f}
                </Link>
              ))}
            </div>

            {/* Term + verified badge */}
            <div className="flex items-center gap-3.5 flex-wrap" style={{ marginBottom: '10px' }}>
              <h1 style={{ fontSize: '52px', fontWeight: 900, lineHeight: 1, letterSpacing: '-1px' }}>{term.term}</h1>
              <span className="inline-flex items-center gap-1 shrink-0" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '99px', marginTop: '6px' }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Doğrulanmış Terim
              </span>
            </div>

            {term.fullForm && (
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', marginBottom: '16px' }}>{term.fullForm}</p>
            )}

            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, maxWidth: '540px' }}>
              {definitionPreview}
            </p>

            {/* Stats + buttons */}
            <div className="flex items-center justify-between gap-8" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '24px', paddingTop: '16px', paddingBottom: '32px' }}>
              <div className="flex items-center gap-5" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                <span className="flex items-center gap-1.5">
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.7 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {term.viewCount.toLocaleString('tr-TR')} görüntülenme
                </span>
                <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.2)' }} />
                <span className="flex items-center gap-1.5">
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.7 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {createdDate}
                </span>
                <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.2)' }} />
                <button className="flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity">
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.7 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Paylaş
                </button>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <BookmarkButton
                  type="terms" id={term.id} title={term.term} slug={term.slug ?? term.id}
                  className="!bg-white/[0.08] !border-white/[0.12] !text-white !rounded-xl"
                />
                <Link href="/kutuphane/okuma-listesi"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '14px', fontWeight: 500, padding: '8px 16px', borderRadius: '12px' }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                  Okuma Listesi
                </Link>
                <Link href={`/giris?next=/kutuphane/sozluk/${term.slug ?? slug}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F59E0B', border: '1px solid #F59E0B', color: '#0b1829', fontSize: '14px', fontWeight: 900, padding: '8px 16px', borderRadius: '12px' }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Katkı Ver
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-7 pb-[40px]">
          <div className="grid gap-6" style={{ gridTemplateColumns: '70% 1fr', alignItems: 'start' }}>

            {/* ── Main column ── */}
            <div>

              {/* Tanım */}
              <div className={`${CARD} overflow-hidden`}>
                <div className="flex">
                  <div className="w-1 shrink-0 bg-amber-400" />
                  <div style={{ flex: 1, padding: '28px 28px 24px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 800, color: '#9ca3af', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>Tanım</p>
                    <p style={{ fontSize: '15px', color: '#1f2937', lineHeight: 1.8 }}>{term.definition}</p>

                    <div style={{ marginTop: '20px', padding: '14px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>💡</span>
                      <span style={{ fontSize: '13px', color: '#92400e', lineHeight: 1.6, fontStyle: 'italic' }}>
                        {term.term} kavramını doğru anlamak için ilgili mevzuat ve uygulamaları birlikte incelemenizi öneririz.
                      </span>
                    </div>

                    {term.seeAlso.length > 0 && (
                      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f3f4f6' }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#9ca3af', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>Ayrıca Bakınız</div>
                        <div className="flex flex-wrap gap-2">
                          {term.seeAlso.map(ref => (
                            <Link key={ref} href={`/kutuphane/sozluk/${encodeURIComponent(ref)}`}
                              style={{ fontSize: '12px', fontWeight: 700, color: '#0b1829', background: '#fffbeb', border: '1px solid #fde68a', padding: '5px 12px', borderRadius: '99px' }}>
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
                <div className={`${CARD} mt-3.5`} style={{ padding: '20px 24px' }}>
                  <SectionHeader
                    title="Bu Terimi Tanımlayan Mevzuat"
                    icon={
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    }
                  />
                  <div className="flex flex-col gap-2">
                    {termRegulations.slice(0, 3).map(r => (
                      <Link key={r.slug} href={`/kutuphane/mevzuat/${r.slug}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f9fafb', border: '1px solid #e9eaec', borderRadius: '12px', padding: '14px 16px', cursor: 'pointer' }}
                        className="hover:bg-white hover:border-[rgba(11,24,41,0.2)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all group">
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 9px', borderRadius: '6px', background: '#0b1829', color: '#F59E0B', flexShrink: 0 }}>
                          {REG_TYPE_LABELS[r.type] ?? r.type}
                        </span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1f2937' }} className="group-hover:text-[#0b1829] transition-colors">
                            {r.short_title ?? r.title}
                          </div>
                          {r.issuing_body && (
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{r.issuing_body}</div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                  {termRegulations.length > 3 && (
                    <a style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B', marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      Tümünü Gör →
                    </a>
                  )}
                </div>
              )}

              {/* Sık Sorulan Sorular */}
              <div className={`${CARD} mt-3.5`} style={{ padding: '24px' }}>
                <SectionHeader
                  title="Bu Terim Hakkında Sık Sorulan Sorular"
                  subtitle="Bu terimle ilgili sorularınıza hızlı yanıtlar alın."
                  icon={
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
                <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e9eaec', borderRadius: '12px', overflow: 'hidden' }}>
                  {faqQuestions.map((q, i) => (
                    <div key={q}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', fontSize: '13px', color: '#1f2937', fontWeight: 500, borderBottom: i < faqQuestions.length - 1 ? '1px solid #f0f0f0' : 'none', cursor: 'pointer', gap: '12px' }}
                      className="hover:bg-gray-50 hover:text-[#0b1829] transition-colors">
                      {q}
                      <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0, color: '#9ca3af' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '14px', textAlign: 'center' }}>
                  <Link href="#yorumlar" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#2563eb' }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                    Topluluğa Sor →
                  </Link>
                </div>
              </div>

              {/* Topluluk Katkıları */}
              {(() => {
                const PLACEHOLDER = [
                  { name: 'Ahmet Yılmaz', role: 'Harita Mühendisi', initials: 'AY', bg: '#0b1829', color: '#F59E0B', star: true,  action: 'Tanımı düzenledi',  actionColor: '#2563eb', date: '21 Mayıs 2024' },
                  { name: 'Ayşe Demir',   role: 'Harita Teknikeri', initials: 'AD', bg: '#1a3a5c', color: '#fff',    star: false, action: 'Örnek ekledi',      actionColor: '#6b7280', date: '19 Mayıs 2024' },
                ];
                const ACTIONS = [
                  { label: 'Tanımı düzenledi', color: '#2563eb' },
                  { label: 'Örnek ekledi',     color: '#6b7280' },
                  { label: 'Kaynak önerdi',    color: '#6b7280' },
                  { label: 'Meslek notu ekledi', color: '#6b7280' },
                ];
                const AVATAR_BG = ['#0b1829', '#1a3a5c', '#223355', '#1e3a5c'];
                const realContributors = term.contributors ?? [];
                const persons = realContributors.length > 0
                  ? realContributors.slice(0, 4).map((c, i) => ({
                      name: c.name,
                      role: c.role ?? 'Haritacı',
                      initials: c.name.split(' ').slice(0,2).map((w: string) => w[0]?.toUpperCase() ?? '').join(''),
                      bg: AVATAR_BG[i] ?? '#26496b',
                      color: i === 0 ? '#F59E0B' : '#fff',
                      star: i === 0,
                      action: ACTIONS[i % ACTIONS.length]!.label,
                      actionColor: ACTIONS[i % ACTIONS.length]!.color,
                      date: '',
                    }))
                  : PLACEHOLDER;
                const extraCount = realContributors.length > 4 ? realContributors.length - 4 : 0;
                return (
                  <div className={`${CARD} mt-3.5`} style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-[30px] h-[30px] rounded-lg bg-[#0b1829] flex items-center justify-center shrink-0 text-amber-400">
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0b1829' }}>Topluluk Katkıları</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>Bu terime katkı sağlayan ve geliştirenler</div>
                        </div>
                      </div>
                      <a style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B', cursor: 'pointer', whiteSpace: 'nowrap' }}>Tümünü Gör →</a>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      {persons.map((p, i) => (
                        <div key={i} style={{ width: '120px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 8px', borderLeft: i > 0 ? '1px solid #f3f4f6' : 'none' }}>
                          <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900, color: p.color, position: 'relative', marginBottom: '8px', flexShrink: 0 }}>
                            {p.initials}
                            {p.star && (
                              <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '16px', height: '16px', background: '#F59E0B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', border: '2px solid #fff', color: '#0b1829' }}>★</span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0b1829', lineHeight: 1.3 }}>{p.name}</div>
                          <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 500, marginTop: '1px' }}>{p.role}</div>
                          <div style={{ fontSize: '11px', color: p.actionColor, fontWeight: 600, marginTop: '5px' }}>{p.action}</div>
                          {p.date && <div style={{ fontSize: '10px', color: '#c0c4cc', marginTop: '3px' }}>{p.date}</div>}
                        </div>
                      ))}
                      {extraCount > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 12px', flexShrink: 0, gap: '4px' }}>
                          <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#374151', marginBottom: '8px' }}>+{extraCount}</div>
                          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, textAlign: 'center', lineHeight: 1.4 }}>Diğer Katkıcılar</div>
                          <a style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 700, cursor: 'pointer' }}>Tümünü Gör →</a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Kaynaklar */}
              <div className={`${CARD} mt-3.5`} style={{ padding: '20px 24px' }}>
                <SectionHeader
                  title="Kaynaklar"
                  subtitle="Bu terimle ilgili güvenilir kaynaklar"
                  icon={
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  }
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { title: 'Kadastro Kanunu',        meta: 'Resmi Gazete — 21.06.1987', size: '1.2 MB' },
                    { title: 'HKMO — Teknik Rehber',   meta: 'Harita Müh. Odası, 2021',  size: '2.4 MB' },
                    { title: 'TKGM — Kadastro Kılavuzu', meta: 'Teknik Doküman, 2023',  size: '3.1 MB' },
                  ].map(s => (
                    <div key={s.title} className="group flex items-center gap-[10px] px-3 py-2.5 rounded-[10px] border border-[#f0f0f0] bg-[#fafafa] hover:bg-white hover:border-[#e0e0e0] transition-all cursor-pointer">
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff0f0', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, color: '#ef4444', flexShrink: 0 }}>PDF</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0b1829', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{s.meta}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{s.size}</span>
                        <a style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#2563eb', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                          Görüntüle
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        </a>
                        <div className="group-hover:bg-[#0b1829] group-hover:text-amber-400 transition-colors" style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#6b7280' }}>
                          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <a style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B', marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  Tüm Kaynakları Gör →
                </a>
              </div>

              {/* Yorumlar */}
              <div id="yorumlar" className="mt-3.5">
                <CommentSection contentType="term" contentId={term.id} />
              </div>
            </div>

            {/* ── Sidebar ── */}
            <div className="flex flex-col gap-3">

              {/* İlgili Terimler — inline SVG graph */}
              {term.seeAlso.length > 0 && (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '18px', border: '1px solid #e9eaec', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <SbHead
                    title="İlgili Terimler"
                    icon={<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v2m0 14v2M3 12h2m14 0h2m-4.22-6.364l-1.414 1.414M6.634 17.366l-1.414 1.414m0-12.728l1.414 1.414m10.732 10.732l1.414 1.414"/></svg>}
                  />
                  <SeeAlsoGraph centerTerm={term.term} relatedTerms={term.seeAlso.slice(0, 7)} />
                  <a style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', cursor: 'pointer' }}>
                    Tüm ilişkileri gör →
                  </a>
                </div>
              )}

              {/* Bu Terime Katkı Ver */}
              <div style={{ background: '#fff', borderRadius: '18px', padding: '18px', border: '1px solid #e9eaec', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <SbHead
                  title="Bu Terime Katkı Ver"
                  icon={<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>}
                />
                <div style={{ fontSize: '11.5px', color: '#374151', marginBottom: '12px' }}>Bilginizi paylaşın, tanımı geliştirin</div>
                <div style={{ height: '1px', background: '#f3f4f6', marginBottom: '12px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '14px' }}>
                  {['Tanımı düzenleyebilirsiniz', 'Örnek kullanım ekleyebilirsiniz', 'Kaynak önerebilirsiniz', 'Meslek notu paylaşabilirsiniz'].map((f, i) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#374151', padding: '7px 0', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none' }}>
                      <span style={{ width: '16px', height: '16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#10b981', fontSize: '9px', fontWeight: 900 }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>
                <Link href={`/giris?next=/kutuphane/sozluk/${term.slug ?? slug}`}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#F59E0B', color: '#0b1829', fontSize: '13px', fontWeight: 900, padding: '10px', borderRadius: '11px', border: 'none' }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Katkı Yap
                </Link>
                <div style={{ textAlign: 'center', fontSize: '11.5px', color: '#374151', marginTop: '10px', cursor: 'pointer' }}>Katkı rehberini incele →</div>
              </div>

              {/* Etiketler */}
              {term.tags.length > 0 && (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '14px 16px', border: '1px solid #e9eaec', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <SbHead
                    title="Etiketler"
                    icon={<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>}
                  />
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {term.tags.slice(0, 5).map(tag => (
                      <Link key={tag} href={`/kutuphane/sozluk?q=${encodeURIComponent(tag)}`}
                        style={{ fontSize: '11px', fontWeight: 700, color: '#374151', background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '4px 10px', borderRadius: '99px' }}>
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Sor — inline, mockup birebir */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', border: '1px solid #e9eaec', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <SbHead
                  title="Bu Terim Hakkında AI'ya Sor"
                  icon={<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                  {[`Bu terimi basit bir örnekle açıkla`, `Pratikte kullanımı nasıldır?`, `Sıkça karıştırılan kavramlar nelerdir?`].map(q => (
                    <Link key={q} href={`/kutuphane/ai?question=${encodeURIComponent(q + ' (' + term.term + ')')}&title=${encodeURIComponent(term.term)}&type=term&slug=${encodeURIComponent(term.slug ?? slug)}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f9fafb', border: '1px solid #e9eaec', borderRadius: '10px', padding: '10px 12px', cursor: 'pointer', fontSize: '12px', color: '#374151' }}>
                      <svg width="15" height="15" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01"/>
                      </svg>
                      {q}
                    </Link>
                  ))}
                </div>
                <Link href={`/kutuphane/ai?title=${encodeURIComponent(term.term)}&type=term&slug=${encodeURIComponent(term.slug ?? slug)}`}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', background: '#fff', border: '1.5px solid #e5e7eb', color: '#0b1829', fontSize: '12px', fontWeight: 700, padding: '10px', borderRadius: '11px' }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  Kendi soruyu sor →
                </Link>
              </div>

              {/* Topluluğa Katıl — inline, mockup birebir */}
              <div style={{ background: '#fff', borderRadius: '18px', padding: '18px', border: '1px solid #e9eaec', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <SbHead
                  title="Topluluğa Katıl"
                  icon={<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex' }}>
                    {[{ initials: 'AY', bg: '#0b1829', color: '#F59E0B', ml: 0 }, { initials: 'MK', bg: '#26496b', color: '#fff', ml: -8 }, { initials: 'EK', bg: '#1a3550', color: '#6ee7b7', ml: -8 }, { initials: '+', bg: '#e5e7eb', color: '#6b7280', ml: -8 }].map(a => (
                      <div key={a.initials} style={{ width: '28px', height: '28px', borderRadius: '50%', background: a.bg, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: a.color, marginLeft: `${a.ml}px`, flexShrink: 0 }}>
                        {a.initials}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#0b1829' }}>1.254 haritacı</div>
                    <div style={{ fontSize: '10px', color: '#374151' }}>bu hafta 12 yeni üye katıldı</div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#374151', marginBottom: '14px' }}>Öğren, sor, katkı ver — ücretsiz.</div>
                <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid #f3f4f6', marginBottom: '16px' }}>
                  {[{ emoji: '📚', text: 'Sözlük ve içeriklere tam erişim' }, { emoji: '💬', text: 'Soru sor, tartışmalara katıl' }, { emoji: '🎯', text: 'Sınav simülasyonu ve ilerleme takibi' }].map((f, i) => (
                    <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 0', borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none' }}>
                      <span style={{ fontSize: '13px' }}>{f.emoji}</span>
                      <span style={{ fontSize: '12px', color: '#374151' }}>{f.text}</span>
                    </div>
                  ))}
                </div>
                <Link href="/uye-ol" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F59E0B', color: '#0b1829', fontSize: '13px', fontWeight: 900, padding: '11px', borderRadius: '11px' }}>
                  Ücretsiz Üye Ol →
                </Link>
                <Link href="/giris" style={{ display: 'block', textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#374151' }}>
                  Zaten üyeyim, giriş yap
                </Link>
              </div>

              {/* Tüm Sözlük */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '18px', border: '1px solid #e9eaec', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <SbHead
                  title="Tüm Sözlük"
                  icon={<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>}
                />
                <p style={{ fontSize: '12px', color: '#374151', lineHeight: 1.6, marginBottom: '14px' }}>
                  1.254 terime, 38 kategoriye ve binlerce kaynağa göz atın.
                </p>
                <Link href="/kutuphane/sozluk"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', background: '#F59E0B', color: '#0b1829', fontSize: '13px', fontWeight: 800, padding: '10px', borderRadius: '11px' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                  Sözlüğe Dön →
                </Link>
              </div>

            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ height: '1px', background: '#e9eaec' }} />
        </div>

        {/* ── Footer CTA ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div style={{ background: '#0b1829', borderRadius: '20px', padding: '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', position: 'relative', overflow: 'hidden' }}>
            {/* Dekoratif halkalar */}
            <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '200px', height: '200px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: '-10px', top: '-10px', width: '130px', height: '130px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: '120px', bottom: '12px', width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(245,158,11,0.5)', pointerEvents: 'none' }} />

            {/* Sol — metin */}
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: '6px' }}>
                Mesleğimizin yaşayan<br />en büyük bilgi platformu
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                Katkıda bulun, soru sor, içerik üret.
              </p>
            </div>

            {/* Sağ — butonlar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <Link href={`/kutuphane/ai?title=${encodeURIComponent(term.term)}&type=term&slug=${encodeURIComponent(term.slug ?? slug)}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '13px', fontWeight: 700, padding: '11px 20px', borderRadius: '12px' }}>
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                AI Asistan
              </Link>
              <Link href="/uye-ol"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F59E0B', color: '#0b1829', fontSize: '13px', fontWeight: 900, padding: '11px 22px', borderRadius: '12px' }}>
                Üye Ol →
              </Link>
            </div>
          </div>
        </div>

      </main>
    </>
  );
}

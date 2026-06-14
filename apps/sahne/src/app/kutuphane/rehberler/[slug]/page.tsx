import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Navbar from '@/components/Navbar';
import { HelpfulButton, PrerequisitesCard } from '../../_library-client';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const SAHNE_BASE = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';

const TYPE_LABELS: Record<string, string> = {
  guide: 'Rehber',
  article: 'Makale',
  roadmap: 'Yol Haritası',
  technical_doc: 'Teknik Doküman',
  career_guide: 'Kariyer Rehberi',
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta Seviye',
  advanced: 'İleri Seviye',
};

const FIELD_EMOJIS: Record<string, string> = {
  cbs: '🌍', fotogrametri: '📡', kadastro: '📐',
  uzaktan_algilama: '🛰️', kariyer: '💼', yazilim: '💻',
  klasik_haritacilik: '🗺️', gayrimenkul_degerleme: '🏠',
  egitim: '📚', kamu: '🏛️', ozel_sektor: '🏢', insaat: '🏗️', genel: '📍',
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

interface MarkdownSection { heading: string | null; content: string }

function getFirstParagraph(content: string): string {
  const blocks = content.split(/\n\n+/);
  return blocks.find(b => b.trim() && !b.trim().startsWith('#'))?.trim() ?? '';
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links → plain text
    .replace(/[*_`~]/g, '');                  // bold/italic/code markers
}

function splitMarkdownSections(body: string): MarkdownSection[] {
  const lines = body.split('\n');
  const sections: MarkdownSection[] = [];
  let heading: string | null = null;
  let current: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current.some(l => l.trim())) sections.push({ heading, content: current.join('\n').trim() });
      heading = line.replace(/^##\s+/, '').trim();
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.some(l => l.trim())) sections.push({ heading, content: current.join('\n').trim() });
  return sections;
}

const SECTION_META: Array<{ keywords: string[]; icon: string; bg: string }> = [
  { keywords: ['özet', 'giriş', 'nedir', 'hakkında'], icon: '📄', bg: '#f0fdf4' },
  { keywords: ['kurulum', 'yükle', 'install'], icon: '🔧', bg: '#f0fdf4' },
  { keywords: ['arayüz', 'interface', 'ekran'], icon: '🖥️', bg: '#faf5ff' },
  { keywords: ['ilk adım', 'başlangıç', 'başla'], icon: '👣', bg: '#f0fdf4' },
  { keywords: ['sonraki', 'devam', 'ileri'], icon: '➡️', bg: '#f0fdf4' },
  { keywords: ['analiz', 'işlem', 'sorgu'], icon: '📊', bg: '#eff6ff' },
  { keywords: ['harita', 'layout', 'baskı'], icon: '🗺️', bg: '#fffbeb' },
  { keywords: ['veri', 'katman', 'shapefile'], icon: '🗂️', bg: '#f0fdf4' },
  { keywords: ['kaynaklar', 'kaynak', 'link'], icon: '🔗', bg: '#f9fafb' },
  { keywords: ['ipucu', 'öneri', 'not'], icon: '💡', bg: '#fffbeb' },
];

function getSectionMeta(heading: string | null): { icon: string; bg: string } {
  if (!heading) return { icon: '📌', bg: '#f9fafb' };
  const lower = heading.toLowerCase();
  for (const m of SECTION_META) {
    if (m.keywords.some(k => lower.includes(k))) return { icon: m.icon, bg: m.bg };
  }
  return { icon: '📌', bg: '#f9fafb' };
}

const TERM_ICONS: [string, string][] = [
  ['cbs', '🌍'], ['coğrafi bilgi', '🌍'],
  ['gnss', '📡'], ['gps', '📡'], ['uydu', '📡'],
  ['qgis', '🖥️'], ['arcgis', '🖥️'], ['yazılım', '💻'],
  ['rtk', '📍'], ['kinematik', '📍'],
  ['mekansal analiz', '📊'], ['uzamsal', '📊'],
  ['harita', '🗺️'], ['kartografya', '🗺️'],
  ['kadastro', '📐'], ['parsel', '📐'],
  ['uzaktan algılama', '🛰️'], ['fotogrametri', '📷'],
  ['veri', '🗂️'], ['koordinat', '📐'], ['projeksiyon', '🌐'],
];
function getTermIcon(term: string): string {
  const lower = term.toLocaleLowerCase('tr-TR');
  for (const [kw, icon] of TERM_ICONS) { if (lower.includes(kw)) return icon; }
  return '📌';
}
function getShortDesc(definition: string): string {
  const parenMatch = definition.match(/\(([^)]{5,60})\)/);
  if (parenMatch?.[1]) return parenMatch[1];
  const firstSentence = definition.split(/[.!?;]/)[0]?.trim() ?? '';
  return firstSentence.length > 60 ? firstSentence.slice(0, 58) + '…' : firstSentence;
}

const NEXT_ICONS: [string, string][] = [
  ['postgis', '🔗'], ['python', '🐍'], ['mekansal analiz', '📐'],
  ['web', '🌐'], ['eklenti', '🔧'], ['veri', '🗂️'], ['harita', '🗺️'],
  ['uzaktan', '🛰️'], ['kadastro', '📐'], ['cbs', '🌍'],
];
function getNextIcon(text: string): string {
  const lower = text.toLocaleLowerCase('tr-TR');
  for (const [kw, icon] of NEXT_ICONS) { if (lower.includes(kw)) return icon; }
  return '📌';
}

function parseNextSteps(content: string): { items: string[]; note: string } {
  const items: string[] = [];
  const noteLines: string[] = [];
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (t.startsWith('- ') || t.startsWith('* ') || /^\d+\.\s/.test(t)) {
      items.push(stripMarkdown(t.replace(/^(?:[-*]|\d+\.)\s+/, '')));
    } else if (t && !t.startsWith('#')) {
      noteLines.push(t);
    }
  }
  return { items, note: noteLines.join(' ').trim() };
}

function parseActionSteps(content: string): Array<{ title: string; descs: string[]; checks: string[] }> {
  const lines = content.split('\n');
  const steps: Array<{ title: string; descs: string[]; checks: string[] }> = [];
  let current: { title: string; descs: string[]; checks: string[] } | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (line.startsWith('### ')) {
      if (current) steps.push(current);
      current = { title: stripMarkdown(line.replace(/^###\s+/, '')), descs: [], checks: [] };
    } else if (current) {
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
        current.checks.push(trimmed.replace(/^(?:[-*]|\d+\.)\s+/, ''));
      } else if (trimmed && !trimmed.startsWith('#')) {
        current.descs.push(trimmed);
      }
    }
  }
  if (current) steps.push(current);
  return steps;
}

function renderInlineCode(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`)/g);
  return <>{parts.map((part, idx) => {
    if (idx % 2 === 1) return <code key={idx} className="rd-action-code">{part.slice(1, -1)}</code>;
    return part;
  })}</>;
}

async function fetchGuide(slug: string): Promise<Guide | null> {
  try {
    const res = await fetch(`${API}/api/v1/library/guides/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json() as Promise<Guide>;
  } catch { return null; }
}

async function fetchSeriesGuides(seriesSlug: string): Promise<SeriesGuide[]> {
  try {
    const res = await fetch(`${API}/api/v1/library/guides/series/${encodeURIComponent(seriesSlug)}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json() as SeriesGuide[];
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

async function fetchRelatedTerms(fields: string[]): Promise<RelatedTerm[]> {
  if (!fields.length) return [];
  try {
    const res = await fetch(`${API}/api/v1/library/terms?field=${encodeURIComponent(fields[0]!)}&featured=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json() as RelatedTerm[];
    return Array.isArray(data) ? data.slice(0, 5) : [];
  } catch { return []; }
}

async function fetchRecommendedGuides(fields: string[], currentSlug: string): Promise<Guide[]> {
  try {
    const field = fields[0] ?? '';
    const res = await fetch(`${API}/api/v1/library/guides?field=${encodeURIComponent(field)}&limit=8`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const items: Guide[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    return items.filter(g => g.slug !== currentSlug).slice(0, 4);
  } catch { return []; }
}

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

const PAGE_STYLES = `
  .rd-main { background: #f5f6f8; min-height: 100vh; }

  /* HERO */
  .rd-hero { background: #0b1829; position: relative; overflow: hidden; padding: 46px 0 0; }
  .rd-hero-bg { position: absolute; top: 0; right: 0; bottom: 0; left: 38%; background-image: url('/newguide.png'); background-size: cover; background-position: center top; }
  .rd-hero-fade { position: absolute; inset: 0; background: linear-gradient(to right, #0b1829 0%, #0b1829 8%, rgba(11,24,41,0.88) 44%, rgba(11,24,41,0.12) 100%); }
  .rd-hero-inner { position: relative; display: flex; align-items: flex-end; gap: 32px; padding-bottom: 50px; }
  .rd-hero-left { flex: 1; max-width: 580px; }

  .rd-breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; margin-bottom: 16px; flex-wrap: wrap; }
  .rd-breadcrumb a { color: rgba(255,255,255,0.7); font-weight: 500; text-decoration: none; }
  .rd-breadcrumb a:hover { color: #fff; }
  .rd-breadcrumb .sep { color: rgba(255,255,255,0.3); }
  .rd-breadcrumb .cur { color: rgba(255,255,255,0.9); font-weight: 600; }

  .rd-hero-badges { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
  .rd-hbadge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px; border: 1px solid transparent; }
  .rd-hbadge-type { background: rgba(74,222,128,0.15); color: #86efac; border-color: rgba(74,222,128,0.2); }
  .rd-hbadge-level { background: rgba(96,165,250,0.15); color: #93c5fd; border-color: rgba(96,165,250,0.2); }
  .rd-hbadge-featured { background: rgba(251,191,36,0.15); color: #fcd34d; border-color: rgba(251,191,36,0.2); }

  .rd-hero-title { font-size: 36px; font-weight: 900; color: #fff; line-height: 1.15; letter-spacing: -0.5px; margin-bottom: 12px; }
  .rd-hero-summary { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.65; max-width: 460px; margin-bottom: 20px; }

  .rd-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .rd-meta-pill { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 5px 12px; backdrop-filter: blur(4px); }

  /* LAYOUT */
  .rd-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
  .rd-page-body { display: grid; grid-template-columns: 1fr 300px; gap: 24px; padding: 32px 0 60px; }
  .rd-main-col { display: flex; flex-direction: column; gap: 20px; }
  .rd-sidebar-col { display: flex; flex-direction: column; gap: 16px; }

  /* CONTENT CARD */
  .rd-card { background: #fff; border: 1px solid #e8e9ec; border-radius: 16px; padding: 24px; }
  .rd-section-hd { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
  .rd-section-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .rd-section-title { font-size: 13px; font-weight: 900; color: #0b1829; letter-spacing: 0.06em; text-transform: uppercase; }
  /* Callout box */
  .rd-callout { display: flex; align-items: flex-start; gap: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 13px 15px; font-size: 13px; color: #15803d; line-height: 1.55; margin-top: 16px; }
  .rd-callout-check { width: 22px; height: 22px; background: #16a34a; color: #fff; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; flex-shrink: 0; margin-top: 1px; }

  .rd-empty { background: #fff; border: 1px solid #e8e9ec; border-radius: 16px; padding: 48px 32px; text-align: center; }
  .rd-empty-icon { width: 52px; height: 52px; background: #f0fdf4; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 14px; }
  .rd-empty-title { font-size: 16px; font-weight: 800; color: #0b1829; margin-bottom: 6px; }
  .rd-empty-desc { font-size: 13px; color: #9ca3af; }

  /* PROSE */
  .rd-prose { font-size: 14px; color: #374151; line-height: 1.75; font-weight: 400; }
  .rd-prose h1 { font-size: 24px; font-weight: 900; color: #0b1829; margin: 1.6em 0 0.5em; }
  .rd-prose h2 { font-size: 19px; font-weight: 800; color: #0b1829; margin: 1.4em 0 0.45em; padding-bottom: 8px; border-bottom: 1px solid #f0f1f3; }
  .rd-prose h3 { font-size: 15px; font-weight: 800; color: #0b1829; margin: 1.2em 0 0.4em; }
  .rd-prose p { margin-bottom: 1em; }
  .rd-prose a { color: #16a34a; text-decoration: none; font-weight: 600; }
  .rd-prose a:hover { text-decoration: underline; }
  .rd-prose strong { color: #0b1829; font-weight: 700; }
  .rd-prose code { background: #e8e9ec; border-radius: 5px; padding: 2px 6px; font-size: 12.5px; font-family: 'Fira Code', monospace; color: #0b1829; }
  .rd-prose pre { background: #0b1829; color: #4ade80; border-radius: 12px; padding: 18px 20px; overflow-x: auto; margin: 1.2em 0; }
  .rd-prose pre code { background: none; color: #4ade80; padding: 0; font-size: 13px; }
  .rd-prose ul { padding-left: 1.4em; margin-bottom: 1em; }
  .rd-prose ul li { margin-bottom: 0.35em; }
  .rd-prose ol { list-style: none; padding-left: 0; margin-bottom: 1em; display: flex; flex-direction: column; gap: 8px; counter-reset: step-counter; }
  .rd-prose ol li { display: flex; align-items: center; gap: 14px; background: #f9fafb; border: 1px solid #f0f1f3; border-radius: 10px; padding: 12px 14px; margin-bottom: 0; counter-increment: step-counter; font-size: 13px; color: #374151; line-height: 1.4; }
  .rd-prose ol li p { margin: 0; font-size: 13px; color: #374151; line-height: 1.4; }
  .rd-prose ol li::before { content: counter(step-counter, decimal-leading-zero); font-size: 11px; font-weight: 900; color: #78716c; min-width: 32px; width: 32px; height: 32px; border-radius: 50%; background: #fef9ec; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; letter-spacing: 0.02em; }
  .rd-prose ol li code { background: #e8e9ec; border-radius: 4px; padding: 1px 5px; font-size: 12px; font-family: monospace; color: #0b1829; }
  .rd-prose blockquote { border-left: 3px solid #16a34a; background: #f0fdf4; padding: 12px 16px; border-radius: 0 10px 10px 0; margin: 1.2em 0; color: #15803d; }
  .rd-prose img { border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); max-width: 100%; margin: 1em 0; }
  .rd-prose table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 1em 0; }
  .rd-prose th { background: #f3f4f6; font-weight: 700; padding: 9px 12px; text-align: left; border-bottom: 1px solid #e8e9ec; }
  .rd-prose td { padding: 8px 12px; border-bottom: 1px solid #f0f1f3; }
  .rd-prose hr { border: none; border-top: 1px solid #e8e9ec; margin: 2em 0; }

  /* SIDEBAR CARDS */
  .rd-sb-card { background: #fff; border: 1px solid #e8e9ec; border-radius: 14px; overflow: hidden; }
  .rd-sb-hd { padding: 14px 16px; border-bottom: 1px solid #f0f1f3; font-size: 11px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; }
  .rd-sb-body { padding: 14px 16px; }

  /* Term items */
  .rd-term { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid #f0f1f3; text-decoration: none; }
  .rd-term:last-child { border-bottom: none; }
  .rd-term-icon { width: 28px; height: 28px; background: #f0fdf4; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .rd-term-name { font-size: 12px; font-weight: 700; color: #0b1829; }
  .rd-term-desc { font-size: 10px; color: #9ca3af; margin-top: 1px; line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .rd-term:hover .rd-term-name { color: #16a34a; }
  .rd-see-all { font-size: 11px; font-weight: 700; color: #16a34a; display: block; margin-top: 10px; text-decoration: none; }

  /* Guide TOC */
  .rd-gtoc-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f0f1f3; }
  .rd-gtoc-items > .rd-gtoc-item:last-child { border-bottom: none; }
  .rd-gtoc-num { width: 22px; height: 22px; border-radius: 6px; background: #f3f4f6; color: #6b7280; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .rd-gtoc-title { font-size: 12px; color: #374151; font-weight: 500; }
  .rd-gtoc-progress { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; margin-top: 4px; border-top: 1px solid #f0f1f3; font-size: 11px; color: #9ca3af; font-weight: 600; }
  .rd-gtoc-bar { height: 3px; background: #f0f1f3; border-radius: 2px; margin-top: 6px; }
  .rd-gtoc-bar-fill { height: 3px; background: #16a34a; border-radius: 2px; width: 0%; }

  /* TOC / Series */
  .rd-toc { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f0f1f3; text-decoration: none; }
  .rd-toc:last-child { border-bottom: none; }
  .rd-toc-num { width: 20px; height: 20px; border-radius: 6px; background: #f3f4f6; color: #6b7280; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .rd-toc-num.active { background: #16a34a; color: #fff; }
  .rd-toc-title { font-size: 12px; color: #374151; font-weight: 600; }
  .rd-toc:hover .rd-toc-title, .rd-toc.current .rd-toc-title { color: #16a34a; }

  /* Series prev/next */
  .rd-series-nav { display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f1f3; }
  .rd-nav-btn { flex: 1; text-align: center; font-size: 11px; font-weight: 700; color: #6b7280; background: #f9fafb; border: 1px solid #e8e9ec; border-radius: 8px; padding: 8px; text-decoration: none; }
  .rd-nav-btn:hover { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }

  /* CTA card */
  .rd-cta-card { background: #162040; border-radius: 16px; padding: 20px; }
  .rd-cta-title { font-size: 15px; font-weight: 900; color: #fff; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
  .rd-cta-desc { font-size: 12px; color: rgba(255,255,255,0.65); line-height: 1.6; margin-bottom: 14px; }
  .rd-cta-benefit { display: flex; align-items: flex-start; gap: 7px; font-size: 12px; color: rgba(255,255,255,0.8); margin-bottom: 7px; line-height: 1.4; }
  .rd-cta-benefit::before { content: '✓'; color: rgba(255,255,255,0.9); font-weight: 700; flex-shrink: 0; }
  .rd-cta-btn { display: block; background: #fff; color: #162040; font-size: 13px; font-weight: 800; text-align: center; padding: 13px; border-radius: 10px; margin-top: 18px; text-decoration: none; }
  .rd-cta-login { text-align: center; font-size: 10px; color: rgba(255,255,255,0.75); margin-top: 10px; cursor: pointer; }

  /* Feedback — override HelpfulButton internal styles */
  .rd-sidebar-col [class*="helpful"], .rd-sidebar-col [class*="Helpful"] { border-radius: 14px; overflow: hidden; border: 1px solid #e8e9ec; background: #fff; }
  .rd-fb-btns { display: flex; gap: 8px; margin-top: 12px; }
  .rd-fb-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px; border-radius: 10px; border: 1px solid #e8e9ec; font-size: 12px; font-weight: 700; color: #374151; background: #fff; cursor: pointer; }

  /* Quick access */
  .rd-quick { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f0f1f3; text-decoration: none; }
  .rd-quick:last-child { border-bottom: none; }
  .rd-quick-icon { width: 30px; height: 30px; background: #f0fdf4; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .rd-quick-label { font-size: 12px; font-weight: 700; color: #0b1829; }
  .rd-quick-sub { font-size: 10px; color: #9ca3af; margin-top: 1px; }
  .rd-quick-arrow { margin-left: auto; font-size: 12px; color: #9ca3af; }
  .rd-quick:hover .rd-quick-label { color: #16a34a; }
  .rd-quick:hover .rd-quick-arrow { color: #16a34a; }

  /* AI card */
  .rd-ai-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 18px 16px 16px; }
  .rd-ai-title { font-size: 13px; font-weight: 900; color: #0b1829; text-transform: uppercase; letter-spacing: 0.04em; line-height: 1.35; margin-bottom: 8px; }
  .rd-ai-desc { font-size: 12px; color: #4b5563; line-height: 1.55; margin-bottom: 14px; }
  .rd-ai-chips { display: flex; flex-direction: column; gap: 7px; margin-bottom: 12px; }
  .rd-ai-chip { background: #fff; border: 1px solid #d1fae5; border-radius: 10px; padding: 9px 12px; font-size: 12px; color: #374151; cursor: pointer; }
  .rd-ai-chip:hover { border-color: #16a34a; color: #15803d; }
  .rd-ai-btn { display: block; width: 100%; background: #fff; border: 1px solid #d1fae5; border-radius: 10px; padding: 11px; font-size: 13px; font-weight: 800; color: #16a34a; text-align: center; cursor: pointer; text-decoration: none; }
  .rd-ai-btn:hover { background: #dcfce7; }

  /* Next steps */
  .rd-next-list { display: flex; flex-direction: column; gap: 8px; }
  .rd-next-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #374151; padding: 10px 12px; background: #f9fafb; border-radius: 8px; border: 1px solid #f0f1f3; text-decoration: none; transition: all 0.15s; }
  .rd-next-item:hover { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
  .rd-next-icon { font-size: 14px; flex-shrink: 0; }
  .rd-next-arrow { margin-left: auto; color: #9ca3af; font-size: 14px; }
  .rd-next-item:hover .rd-next-arrow { color: #16a34a; }
  .rd-bottom-note { display: flex; align-items: center; gap: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 16px; font-size: 13px; color: #15803d; line-height: 1.5; margin-top: 6px; }

  /* Action steps */
  .rd-action-step { display: flex; gap: 14px; margin-bottom: 20px; }
  .rd-action-step:last-child { margin-bottom: 0; }
  .rd-action-num { width: 28px; height: 28px; border-radius: 50%; background: #166534; color: #fff; font-size: 12px; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .rd-action-content { flex: 1; }
  .rd-action-title { font-size: 13px; font-weight: 800; color: #0b1829; margin-bottom: 4px; }
  .rd-action-desc { font-size: 12px; color: #6b7280; line-height: 1.5; margin-bottom: 4px; }
  .rd-action-sub { list-style: none; padding-left: 0; margin: 0; font-size: 12px; color: #374151; line-height: 1.5; }
  .rd-action-sub li { display: flex; align-items: flex-start; gap: 6px; margin-bottom: 3px; }
  .rd-action-sub li::before { content: '✓'; color: #16a34a; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
  .rd-action-code { display: inline-block; background: #0b1829; color: #4ade80; border-radius: 5px; padding: 3px 8px; font-size: 11px; font-family: monospace; margin-top: 4px; }

  /* Interface diagram */
  .rd-iface-wrap { display: flex; align-items: stretch; gap: 0; background: #f8f9fc; border: 1px solid #e8e9ec; border-radius: 12px; overflow: hidden; }
  .rd-iface-left { width: 160px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: space-between; padding: 20px 0 20px 16px; }
  .rd-iface-right { width: 160px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: space-around; padding: 20px 16px 20px 0; }
  .rd-iface-lbl { display: flex; align-items: center; }
  .rd-iface-lbl-r { display: flex; align-items: center; flex-direction: row-reverse; }
  .rd-iface-ltext { flex-shrink: 0; max-width: 116px; background: #fff; border: 1px solid #e8e9ec; border-left: 3px solid #16a34a; border-radius: 8px; padding: 7px 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
  .rd-iface-lbl-r .rd-iface-ltext { border-left: 1px solid #e8e9ec; border-right: 3px solid #16a34a; }
  .rd-iface-lname { font-size: 10px; font-weight: 800; color: #15803d; line-height: 1.2; white-space: nowrap; }
  .rd-iface-ldesc { font-size: 9px; color: #9ca3af; margin-top: 2px; line-height: 1.3; }
  .rd-iface-line { height: 1px; background: rgba(22,163,74,0.3); flex: 1; min-width: 16px; }
  .rd-iface-dot { width: 5px; height: 5px; border-radius: 50%; background: #16a34a; flex-shrink: 0; }
  .rd-iface-img { flex: 1; display: flex; align-items: center; justify-content: center; padding: 16px 0; }
  .rd-iface-img img { width: 100%; border-radius: 8px; border: 1px solid #d1d5db; box-shadow: 0 4px 16px rgba(0,0,0,0.08); display: block; }

  /* RECOMMENDED */
  .rd-rec-section { background: #fff; border-top: 1px solid #e8e9ec; padding: 30px 0 56px; }
  .rd-rec-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .rd-rec-heading { font-size: 12px; font-weight: 900; color: #0b1829; letter-spacing: 0.1em; text-transform: uppercase; }
  .rd-rec-see-all { font-size: 12px; font-weight: 700; color: #6b7280; text-decoration: none; }
  .rd-rec-see-all:hover { color: #16a34a; }
  .rd-rec-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .rd-rec-card { border-radius: 12px; overflow: hidden; border: 1px solid #e8e9ec; background: #fff; text-decoration: none; display: block; transition: box-shadow 0.15s, transform 0.15s; }
  .rd-rec-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.09); transform: translateY(-2px); }
  .rd-rec-thumb { height: 120px; position: relative; overflow: hidden; background: #f0fdf4; }
  .rd-rec-thumb img { width: 100%; height: 100%; object-fit: cover; object-position: center top; display: block; }
  .rd-rec-thumb-tag { position: absolute; bottom: 8px; left: 8px; font-size: 10px; font-weight: 700; color: #fff; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); border-radius: 6px; padding: 3px 8px; }
  .rd-rec-info { padding: 12px 14px 14px; }
  .rd-rec-badges { display: flex; gap: 5px; margin-bottom: 7px; }
  .rd-rc-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 6px; border: 1px solid transparent; }
  .rd-rc-guide { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }
  .rd-rc-level { background: #dbeafe; color: #1d4ed8; border-color: #bfdbfe; }
  .rd-rc-level-mid { background: #fef9c3; color: #a16207; border-color: #fef08a; }
  .rd-rec-title { font-size: 13px; font-weight: 700; color: #0b1829; line-height: 1.4; }
`;

export default async function RehberDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await fetchGuide(slug);
  if (!guide) notFound();

  const [relatedTerms, seriesGuides, recommendedGuides] = await Promise.all([
    fetchRelatedTerms(guide.fields),
    guide.seriesSlug ? fetchSeriesGuides(guide.seriesSlug) : Promise.resolve([]),
    fetchRecommendedGuides(guide.fields, guide.slug),
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
    ...(guide.authorName ? { author: { '@type': 'Person', name: guide.authorName } } : {}),
    publisher: { '@type': 'Organization', name: 'Haritailesi', url: SAHNE_BASE },
  };

  const currentSeriesIdx = seriesGuides.findIndex(s => s.slug === guide.slug);
  const prevSeries = seriesGuides[currentSeriesIdx - 1];
  const nextSeries = seriesGuides[currentSeriesIdx + 1];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />
      <Navbar />
      <main className="rd-main">

        {/* ── HERO ── */}
        <div className="rd-hero">
          <div className="rd-hero-bg">
            <div className="rd-hero-fade" />
          </div>
          <div className="rd-container">
            <div className="rd-hero-inner">
              <div className="rd-hero-left">
                {/* Breadcrumb */}
                <div className="rd-breadcrumb">
                  <Link href="/kutuphane">Meslek Kütüphanesi</Link>
                  <span className="sep">›</span>
                  <Link href="/kutuphane/rehberler">Meslek Atlası</Link>
                  <span className="sep">›</span>
                  <span className="cur">{guide.title}</span>
                </div>

                {/* Badges */}
                <div className="rd-hero-badges">
                  <span className="rd-hbadge rd-hbadge-type">{TYPE_LABELS[guide.type] ?? guide.type}</span>
                  {guide.level && (
                    <span className="rd-hbadge rd-hbadge-level">{LEVEL_LABELS[guide.level] ?? guide.level}</span>
                  )}
                  {guide.isFeatured && (
                    <span className="rd-hbadge rd-hbadge-featured">Öne Çıkan</span>
                  )}
                </div>

                {/* Title */}
                <h1 className="rd-hero-title">{guide.title}</h1>

                {/* Summary */}
                <p className="rd-hero-summary">{guide.summary}</p>

                {/* Meta */}
                <div className="rd-meta">
                  {guide.readingTimeMinutes && (
                    <span className="rd-meta-pill">⏱ {guide.readingTimeMinutes} dk okuma</span>
                  )}
                  {publishedDate && (
                    <span className="rd-meta-pill">📅 {publishedDate}</span>
                  )}
                  <span className="rd-meta-pill">👁 {guide.viewCount.toLocaleString('tr-TR')} görüntülenme</span>
                  {guide.authorName && (
                    <span className="rd-meta-pill">✍️ {guide.authorName}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── PAGE BODY ── */}
        <div className="rd-container">
          <div className="rd-page-body">

            {/* ── MAIN COLUMN ── */}
            <div className="rd-main-col">
              {guide.prerequisites && <PrerequisitesCard prerequisites={guide.prerequisites} />}

              {processedBody ? (
                splitMarkdownSections(processedBody).map((sec, i) => {
                  const isFirst = i === 0;
                  const cleanHeading = isFirst ? 'Özet' : (sec.heading ? stripMarkdown(sec.heading) : null);
                  const { icon, bg } = isFirst
                    ? { icon: '📄', bg: '#f0fdf4' }
                    : getSectionMeta(cleanHeading);
                  const headingLower = cleanHeading?.toLocaleLowerCase('tr-TR') ?? '';
                  const isIface = !isFirst && headingLower.includes('arayüz');
                  const actionSteps = !isFirst && headingLower.includes('ilk adım')
                    ? parseActionSteps(sec.content)
                    : [];
                  const isNextSteps = !isFirst && headingLower.includes('sonraki adım');
                  const nextStepsData = isNextSteps ? parseNextSteps(sec.content) : null;

                  // İlk Adımlar action step'lerinin ## olarak ayrı section açtığı bilinen sub-başlıkları gizle
                  const ACTION_SUBTOPICS = ['harita üretimi', 'basit alan sorgusu', 'shapefile açma', 'kaynaklar'];
                  if (!isFirst && ACTION_SUBTOPICS.some(t => headingLower.includes(t))) return null;

                  return (
                    <div key={i} className="rd-card">
                      {cleanHeading && (
                        <div className="rd-section-hd">
                          <div className="rd-section-icon" style={{ background: bg }}>{icon}</div>
                          <span className="rd-section-title">{cleanHeading}</span>
                        </div>
                      )}
                      {nextStepsData ? (
                        <>
                          <div className="rd-next-list">
                            {nextStepsData.items.map((item, ni) => (
                              <div key={ni} className="rd-next-item">
                                <span className="rd-next-icon">{getNextIcon(item)}</span>
                                <span>{item}</span>
                                <span className="rd-next-arrow">→</span>
                              </div>
                            ))}
                          </div>
                          {nextStepsData.note && (
                            <div className="rd-bottom-note">
                              <span style={{ fontSize: 16, flexShrink: 0 }}>✅</span>
                              <span>{nextStepsData.note}</span>
                            </div>
                          )}
                        </>
                      ) : actionSteps.length > 0 ? (
                        <div>
                          {actionSteps.map((step, si) => (
                            <div key={si} className="rd-action-step">
                              <div className="rd-action-num">{si + 1}</div>
                              <div className="rd-action-content">
                                <div className="rd-action-title">{step.title}</div>
                                {step.descs.map((d, di) => (
                                  <div key={di} className="rd-action-desc">{renderInlineCode(d)}</div>
                                ))}
                                {step.checks.length > 0 && (
                                  <ul className="rd-action-sub">
                                    {step.checks.map((c, ci) => (
                                      <li key={ci}>{renderInlineCode(c)}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : isIface ? (
                        <div className="rd-iface-wrap">
                          <div className="rd-iface-left">
                            {([
                              { name: 'Menü Çubuğu', desc: 'Tüm işlemler' },
                              { name: 'Katmanlar Paneli', desc: 'Veri katmanlarını yönet' },
                              { name: 'Durum Çubuğu', desc: 'Koordinat, ölçek ve proje bilgileri' },
                            ] as { name: string; desc: string }[]).map(l => (
                              <div key={l.name} className="rd-iface-lbl">
                                <div className="rd-iface-ltext">
                                  <div className="rd-iface-lname">{l.name}</div>
                                  <div className="rd-iface-ldesc">{l.desc}</div>
                                </div>
                                <div className="rd-iface-line" />
                                <div className="rd-iface-dot" />
                              </div>
                            ))}
                          </div>
                          <div className="rd-iface-img">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/qgis.png" alt="QGIS Arayüzü" />
                          </div>
                          <div className="rd-iface-right">
                            {([
                              { name: 'Araç Çubukları', desc: 'Sık kullanılan işlemler' },
                              { name: 'Harita Penceresi', desc: 'Görselleştirme alanı' },
                            ] as { name: string; desc: string }[]).map(l => (
                              <div key={l.name} className="rd-iface-lbl-r">
                                <div className="rd-iface-ltext" style={{ textAlign: 'right' }}>
                                  <div className="rd-iface-lname">{l.name}</div>
                                  <div className="rd-iface-ldesc">{l.desc}</div>
                                </div>
                                <div className="rd-iface-line" />
                                <div className="rd-iface-dot" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                      <div className="rd-prose">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {isFirst ? getFirstParagraph(sec.content) : sec.content}
                        </ReactMarkdown>
                      </div>
                      )}
                      {isFirst && guide.level && (
                        <div className="rd-callout">
                          <div className="rd-callout-check">✓</div>
                          <span>
                            Bu rehber <strong>{LEVEL_LABELS[guide.level] ?? guide.level}</strong> seviyesindedir.
                            {guide.level === 'beginner' && ' Hiç deneyiminiz olmasa bile kolayca uygulayabilirsiniz.'}
                            {guide.level === 'intermediate' && ' Temel CBS bilgisine sahip olmanız önerilir.'}
                            {guide.level === 'advanced' && ' İleri düzey CBS ve yazılım deneyimi gerekmektedir.'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="rd-empty">
                  <div className="rd-empty-icon">📖</div>
                  <div className="rd-empty-title">İçerik hazırlanıyor</div>
                  <div className="rd-empty-desc">Bu rehberin detaylı içeriği yakında eklenecek.</div>
                </div>
              )}

              <div className="rd-bottom-note">
                <span style={{ fontSize: 16, flexShrink: 0 }}>✅</span>
                <span>Bu rehber sürekli güncellenmektedir. Öneri ve geri bildiriminiz bizim için değerlidir.</span>
              </div>

            </div>

            {/* ── SIDEBAR ── */}
            <div className="rd-sidebar-col">

              {/* İlgili Terimler */}
              {relatedTerms.length > 0 && (
                <div className="rd-sb-card">
                  <div className="rd-sb-hd">İlgili Terimler</div>
                  <div className="rd-sb-body" style={{ paddingTop: 8, paddingBottom: 8 }}>
                    {relatedTerms.map(t => (
                      <Link key={t.id} href={t.slug ? `/kutuphane/sozluk/${t.slug}` : '/kutuphane/sozluk'} className="rd-term">
                        <div className="rd-term-icon">{getTermIcon(t.term)}</div>
                        <div>
                          <div className="rd-term-name">{t.term}</div>
                          <div className="rd-term-desc">{getShortDesc(t.definition)}</div>
                        </div>
                      </Link>
                    ))}
                    <Link href="/kutuphane/sozluk" className="rd-see-all">Tüm terimleri gör →</Link>
                  </div>
                </div>
              )}

              {/* Seri navigasyonu / TOC */}
              {seriesGuides.length > 1 && (
                <div className="rd-sb-card">
                  <div className="rd-sb-hd">Rehber İçeriği</div>
                  <div className="rd-sb-body" style={{ paddingTop: 8, paddingBottom: 12 }}>
                    {seriesGuides.map((sg, i) => {
                      const isCurrent = sg.slug === guide.slug;
                      return (
                        <Link
                          key={sg.id}
                          href={`/kutuphane/rehberler/${sg.slug}`}
                          className={`rd-toc${isCurrent ? ' current' : ''}`}
                        >
                          <div className={`rd-toc-num${isCurrent ? ' active' : ''}`}>{i + 1}</div>
                          <div className="rd-toc-title">{sg.title}</div>
                        </Link>
                      );
                    })}
                    {(prevSeries ?? nextSeries) && (
                      <div className="rd-series-nav">
                        {prevSeries && (
                          <Link href={`/kutuphane/rehberler/${prevSeries.slug}`} className="rd-nav-btn">← Önceki</Link>
                        )}
                        {nextSeries && (
                          <Link href={`/kutuphane/rehberler/${nextSeries.slug}`} className="rd-nav-btn">Sonraki →</Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rehber İçeriği — TOC */}
              {processedBody && (() => {
                const ACTION_SUBTOPICS = ['harita üretimi', 'basit alan sorgusu', 'shapefile açma', 'kaynaklar'];
                const tocSections = splitMarkdownSections(processedBody)
                  .map(s => s.heading ? stripMarkdown(s.heading) : null)
                  .filter((h): h is string => {
                    if (!h) return false;
                    const hl = h.toLocaleLowerCase('tr-TR');
                    return !ACTION_SUBTOPICS.some(t => hl.includes(t));
                  });
                if (tocSections.length === 0) return null;
                return (
                  <div className="rd-sb-card">
                    <div className="rd-sb-hd">Rehber İçeriği</div>
                    <div className="rd-sb-body" style={{ paddingTop: 8, paddingBottom: 8 }}>
                      <div className="rd-gtoc-items">
                        {tocSections.map((title, idx) => (
                          <div key={idx} className="rd-gtoc-item">
                            <div className="rd-gtoc-num">{idx + 1}</div>
                            <div className="rd-gtoc-title">{title}</div>
                          </div>
                        ))}
                      </div>
                      <div className="rd-gtoc-progress">
                        <span>İlerleme</span>
                        <span>0%</span>
                      </div>
                      <div className="rd-gtoc-bar"><div className="rd-gtoc-bar-fill" /></div>
                    </div>
                  </div>
                );
              })()}

              {/* Topluluğa Katıl — CTA */}
              <div className="rd-cta-card">
                <div className="rd-cta-title">
                  <span style={{ fontSize: 18, lineHeight: 1 }}>👥</span>
                  Topluluğa Katıl
                </div>
                <div className="rd-cta-desc">Binlerce haritacı ile bilgi paylaşın, sorular sorun, deneyim kazanın.</div>
                <div className="rd-cta-benefit">Sorularınıza hızlı yanıt alın</div>
                <div className="rd-cta-benefit">Deneyimlerinizi paylaşın</div>
                <div className="rd-cta-benefit">Kaynaklara erişin</div>
                <Link href="/uye-ol" className="rd-cta-btn">Ücretsiz Üye Ol →</Link>
                <div className="rd-cta-login">Zaten üyeyim, giriş yap</div>
              </div>

              {/* Feedback */}
              <HelpfulButton slug={guide.slug} />

              {/* Hızlı Erişim */}
              <div className="rd-sb-card">
                <div className="rd-sb-hd">Hızlı Erişim</div>
                <div className="rd-sb-body" style={{ paddingTop: 8, paddingBottom: 8 }}>
                  <a href={`/api/guides/${guide.slug}/pdf`} className="rd-quick">
                    <div className="rd-quick-icon">📥</div>
                    <div>
                      <div className="rd-quick-label">PDF İndir</div>
                      <div className="rd-quick-sub">Rehberi PDF olarak indir</div>
                    </div>
                    <span className="rd-quick-arrow">→</span>
                  </a>
                  <a href={`/kutuphane/rehberler/${guide.slug}?print=1`} className="rd-quick">
                    <div className="rd-quick-icon">🖨️</div>
                    <div>
                      <div className="rd-quick-label">Yazdır</div>
                      <div className="rd-quick-sub">Bu sayfayı yazdır</div>
                    </div>
                    <span className="rd-quick-arrow">→</span>
                  </a>
                  <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${SAHNE_BASE}/kutuphane/rehberler/${guide.slug}`)}`} target="_blank" rel="noopener noreferrer" className="rd-quick">
                    <div className="rd-quick-icon">🔗</div>
                    <div>
                      <div className="rd-quick-label">Paylaş</div>
                      <div className="rd-quick-sub">Bu rehberi paylaş</div>
                    </div>
                    <span className="rd-quick-arrow">→</span>
                  </a>
                </div>
              </div>

              {/* AI Sor */}
              <div className="rd-ai-card">
                <div className="rd-ai-title">Bu Rehber Hakkında<br />AI&apos;ya Sor</div>
                <div className="rd-ai-desc">Rehberle ilgili aklınıza takılanları sorun, hemen yanıtlayalım.</div>
                <div className="rd-ai-chips">
                  <div className="rd-ai-chip">Bu adım ne işe yarıyor?</div>
                  <div className="rd-ai-chip">Alternatif yöntem var mı?</div>
                  <div className="rd-ai-chip">Hangi veri formatını kullanmalıyım?</div>
                </div>
                <Link href={`/mutfak/ai?context=guide:${guide.slug}`} className="rd-ai-btn">
                  Kendi sorumu sor →
                </Link>
              </div>

            </div>
          </div>
        </div>

        {/* ── ÖNERİLEN REHBERLER ── */}
        <div className="rd-rec-section">
          <div className="rd-container">
            <div className="rd-rec-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, color: '#f59e0b' }}>☆</span>
                <span className="rd-rec-heading">Size Önerilen Rehberler</span>
              </div>
              <Link href="/kutuphane/rehberler" className="rd-rec-see-all">Tüm rehberler →</Link>
            </div>
            <div className="rd-rec-grid">
              {recommendedGuides.length > 0 ? recommendedGuides.map(g => (
                <Link key={g.id} href={`/kutuphane/rehberler/${g.slug}`} className="rd-rec-card">
                  <div className="rd-rec-thumb">
                    <img src="/ggis_featured.png" alt={g.title} />
                    <span className="rd-rec-thumb-tag">{TYPE_LABELS[g.type] ?? g.type}</span>
                  </div>
                  <div className="rd-rec-info">
                    <div className="rd-rec-badges">
                      <span className="rd-rc-badge rd-rc-guide">{TYPE_LABELS[g.type] ?? 'Rehber'}</span>
                      {g.level && (
                        <span className={`rd-rc-badge ${g.level === 'intermediate' ? 'rd-rc-level-mid' : 'rd-rc-level'}`}>
                          {LEVEL_LABELS[g.level] ?? g.level}
                        </span>
                      )}
                    </div>
                    <div className="rd-rec-title">{g.title}</div>
                  </div>
                </Link>
              )) : (
                /* Fallback: statik kartlar */
                [
                  { slug: 'vektor-veri-duzenleme', title: "QGIS'te Vektör Veri Düzenleme", level: 'beginner', tag: 'Vektör Düzenleme' },
                  { slug: 'mekansal-analiz', title: 'QGIS ile Mekansal Analiz (Buffer, Clip, Intersect)', level: 'intermediate', tag: 'Mekansal Analiz' },
                  { slug: 'styling-semboloji', title: "QGIS'te Veri Styling ve Semboloji", level: 'beginner', tag: 'Styling & Semboloji' },
                  { slug: 'harita-tasarimi', title: "QGIS'te Layout ile Profesyonel Harita Tasarımı", level: 'beginner', tag: 'Harita Tasarımı' },
                ].map(g => (
                  <Link key={g.slug} href={`/kutuphane/rehberler/${g.slug}`} className="rd-rec-card">
                    <div className="rd-rec-thumb">
                      <img src="/ggis_featured.png" alt={g.title} />
                      <span className="rd-rec-thumb-tag">{g.tag}</span>
                    </div>
                    <div className="rd-rec-info">
                      <div className="rd-rec-badges">
                        <span className="rd-rc-badge rd-rc-guide">Rehber</span>
                        <span className={`rd-rc-badge ${g.level === 'intermediate' ? 'rd-rc-level-mid' : 'rd-rc-level'}`}>
                          {LEVEL_LABELS[g.level] ?? g.level}
                        </span>
                      </div>
                      <div className="rd-rec-title">{g.title}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

      </main>
    </>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { SavedSection, LibrarySearchInput } from './_library-client';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface LibraryCounts {
  terms: number;
  guides: number;
  documents: number;
  regulations: number;
}

interface FeaturedTerm { id: string; slug: string | null; term: string; fields: string[]; viewCount: number; }
interface FeaturedGuide { id: string; slug: string | null; title: string; fields: string[]; viewCount: number; }
interface FeaturedRegulation { id: string; slug: string | null; title: string; short_title: string | null; type: string; }
interface FeaturedData { terms: FeaturedTerm[]; guides: FeaturedGuide[]; regulations: FeaturedRegulation[]; }
interface DailyTerm { id: string; slug: string | null; term: string; fullForm: string | null; definition: string; fields: string[]; tags: string[]; }

async function fetchFeatured(): Promise<FeaturedData> {
  try {
    const res = await fetch(`${API}/api/v1/library/featured`, { next: { revalidate: 3600 } });
    if (!res.ok) return { terms: [], guides: [], regulations: [] };
    return res.json() as Promise<FeaturedData>;
  } catch { return { terms: [], guides: [], regulations: [] }; }
}

async function fetchDailyTerm(): Promise<DailyTerm | null> {
  try {
    const res = await fetch(`${API}/api/v1/library/daily-term`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    return res.json() as Promise<DailyTerm>;
  } catch { return null; }
}

async function fetchCounts(): Promise<LibraryCounts> {
  try {
    const res = await fetch(`${API}/api/v1/library/counts`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { terms: 0, guides: 0, documents: 0, regulations: 0 };
    return res.json() as Promise<LibraryCounts>;
  } catch {
    return { terms: 0, guides: 0, documents: 0, regulations: 0 };
  }
}

function fmt(n: number): string {
  return n > 0 ? n.toLocaleString('tr-TR') : '0';
}

const SECTION_DEFS = [
  {
    href: '/kutuphane/soru-cevap',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" />
      </svg>
    ),
    label: 'Soru & Cevap',
    desc: 'Meslektaşların sorularına hızlı ve güvenilir çözüm üretin.',
    statKey: 'qna' as const,
    statLabel: 'soru',
    color: 'from-sky-500 to-blue-600',
    bg: 'bg-sky-50 hover:bg-sky-100/80',
    border: 'border-sky-200 hover:border-sky-400',
    iconBg: 'bg-sky-100 text-sky-600',
    badge: 'bg-sky-100 text-sky-700',
  },
  {
    href: '/kutuphane/sozluk',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    label: 'Meslek Sözlüğü',
    desc: 'Mesleki kavramların doğrulanmış ortak tanımları.',
    statKey: 'terms' as const,
    statLabel: 'terim',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 hover:bg-violet-100/80',
    border: 'border-violet-200 hover:border-violet-400',
    iconBg: 'bg-violet-100 text-violet-600',
    badge: 'bg-violet-100 text-violet-700',
  },
  {
    href: '/kutuphane/rehberler',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    label: 'Rehberler',
    desc: 'Adım adım rehberler, makaleler ve teknik kılavuzlar.',
    statKey: 'guides' as const,
    statLabel: 'makale',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50 hover:bg-emerald-100/80',
    border: 'border-emerald-200 hover:border-emerald-400',
    iconBg: 'bg-emerald-100 text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  {
    href: '/kutuphane/dokumanlar',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    label: 'Doküman Merkezi',
    desc: 'Teknik şartnameler, raporlar ve akademik yayınlar.',
    statKey: 'documents' as const,
    statLabel: 'doküman',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50 hover:bg-amber-100/80',
    border: 'border-amber-200 hover:border-amber-400',
    iconBg: 'bg-amber-100 text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
  },
  {
    href: '/kutuphane/mevzuat',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    label: 'Mevzuat Merkezi',
    desc: 'Kanunlar, yönetmelikler ve teknik tebliğler.',
    statKey: 'regulations' as const,
    statLabel: 'mevzuat',
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50 hover:bg-rose-100/80',
    border: 'border-rose-200 hover:border-rose-400',
    iconBg: 'bg-rose-100 text-rose-600',
    badge: 'bg-rose-100 text-rose-700',
  },
  {
    href: '/kutuphane/sinavlar',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    label: 'Sınav Merkezi',
    desc: 'KPSS, kurum sınavları, çıkmış sorular ve denemeler.',
    statKey: 'exams' as const,
    statLabel: 'soru',
    color: 'from-[#26496b] to-[#1a3350]',
    bg: 'bg-[#26496b]/5 hover:bg-[#26496b]/10',
    border: 'border-[#26496b]/20 hover:border-[#26496b]/50',
    iconBg: 'bg-[#26496b]/10 text-[#26496b]',
    badge: 'bg-[#26496b]/10 text-[#26496b]',
  },
  {
    href: '/kutuphane/yollar',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    label: 'Öğrenme Yolları',
    desc: 'Kuratif adım adım yollar ile alanında sistemli ilerle.',
    statKey: 'yollar' as const,
    statLabel: 'yol',
    color: 'from-teal-500 to-cyan-600',
    bg: 'bg-teal-50 hover:bg-teal-100/80',
    border: 'border-teal-200 hover:border-teal-400',
    iconBg: 'bg-teal-100 text-teal-600',
    badge: 'bg-teal-100 text-teal-700',
  },
];

export default async function KutuphaneHub({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  if (q?.trim()) redirect(`/kutuphane/arama?q=${encodeURIComponent(q.trim())}`);

  const [counts, featured, dailyTerm] = await Promise.all([fetchCounts(), fetchFeatured(), fetchDailyTerm()]);

  const statMap: Record<string, string> = {
    qna: '—',
    guides: fmt(counts.guides),
    terms: fmt(counts.terms),
    documents: fmt(counts.documents),
    regulations: fmt(counts.regulations),
    exams: '3.400+',
    yollar: '—',
  };

  const featuredTotal = featured.terms.length + featured.guides.length + featured.regulations.length;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="bg-[#0b1829] text-white relative min-h-[380px]">
          {/* kutuphane.jpg — sağ taraf, sola geçişli */}
          <div className="absolute inset-0 left-[38%]"
            style={{ backgroundImage: "url('/kutuphane.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, #0b1829 0%, #0b1829 6%, rgba(11,24,41,0.80) 42%, rgba(11,24,41,0.15) 100%)' }} />
          </div>

          <div className="relative max-w-[1100px] mx-auto px-8 pt-12 grid grid-cols-[1fr_380px] items-end">
            {/* Sol */}
            <div className="pb-10">
              <div className="flex items-center gap-1.5 mb-6 text-xs">
                <Link href="/" className="text-white/35 hover:text-white/60 transition-colors">Sahne</Link>
                <span className="text-white/20">›</span>
                <span className="text-white/50">Meslek Kütüphanesi</span>
              </div>

              <h1 className="text-[52px] font-black leading-none tracking-[-1.5px] mb-3.5">
                <span className="text-amber-400">Meslek</span><br />
                Kütüphanesi
              </h1>

              <p className="text-white/[0.48] text-sm leading-relaxed max-w-[400px] mb-6">
                Mesleğimizde üretilen bilginin toplandığı, geliştirildiği ve aktarıldığı yaşayan bilgi platformu.
              </p>

              <LibrarySearchInput stats={[
                { value: '10', label: 'Soru Cevap' },
                { value: fmt(counts.terms), label: 'Terim' },
                { value: fmt(counts.guides), label: 'Rehber' },
                { value: fmt(counts.regulations), label: 'Mevzuat' },
                { value: fmt(counts.documents), label: 'Doküman' },
                { value: '3.400+', label: 'Sınav Sorusu' },
              ]} />
            </div>

            {/* Sağ — Bugün Kütüphanede */}
            <div className="pb-7 flex items-start justify-end -translate-y-[60px]">
              <div className="w-[210px] rounded-[14px] border border-white/[0.13] p-4 backdrop-blur-[14px]"
                style={{ background: 'rgba(8,18,34,0.80)' }}>
                <p className="text-[9px] font-extrabold tracking-[0.18em] uppercase text-white/40 mb-3">Bugün Kütüphanede</p>
                {([
                  { bg: 'rgba(99,102,241,0.2)', icon: '🔷', num: '+12', label: 'Yeni Terim' },
                  { bg: 'rgba(34,197,94,0.2)', icon: '🟩', num: '+4', label: 'Yeni Rehber' },
                  { bg: 'rgba(239,68,68,0.2)', icon: '⚖️', num: '+2', label: 'Yeni Mevzuat' },
                  { bg: 'rgba(234,179,8,0.2)', icon: '📄', num: '+5', label: 'Yeni Doküman' },
                ] as { bg: string; icon: string; num: string; label: string }[]).map((r) => (
                  <div key={r.label} className="flex items-center gap-2.5 py-1.5 border-b border-white/[0.06] last:border-0">
                    <div className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center text-[13px] shrink-0" style={{ background: r.bg }}>{r.icon}</div>
                    <div>
                      <span className="text-sm font-black text-white">{r.num} </span>
                      <span className="text-xs text-white/50">{r.label}</span>
                    </div>
                  </div>
                ))}
                <div className="h-px bg-white/[0.08] my-2.5" />
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {['A', 'B', 'C', '+'].map((l) => (
                      <span key={l} className="w-5 h-5 rounded-full bg-white/15 border-2 flex items-center justify-center text-[8px] text-white/70 font-bold -mr-1.5 last:mr-0" style={{ borderColor: 'rgba(8,18,34,0.8)' }}>{l}</span>
                    ))}
                  </div>
                  <span className="text-[10px] text-white/40 ml-2 leading-tight">
                    <strong className="text-white/80 font-extrabold">43</strong> meslektaş katkı sağladı
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Kütüphane Bölümleri ──────────────────────────────────────────── */}
        <div className="bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

            {/* Bölüm başlığı */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-[3px] h-7 bg-amber-400 rounded-full shrink-0" />
              <div>
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400 mb-0.5">Keşfet</p>
                <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none">Kütüphane Bölümleri</h2>
              </div>
            </div>

            {/* Birincil 3 büyük kart — numaralı */}
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              {SECTION_DEFS.slice(0, 3).map((s, i) => (
                <Link key={s.href} href={s.href}
                  className="group relative flex flex-col rounded-2xl border border-gray-100 hover:border-gray-200 bg-white overflow-hidden hover:shadow-[0_16px_48px_rgba(0,0,0,0.09)] hover:-translate-y-1.5 transition-all duration-300">
                  {/* Dekoratif numara */}
                  <span className="absolute right-2 top-0 text-[88px] font-black text-gray-100 leading-none select-none pointer-events-none transition-colors duration-300 group-hover:text-gray-100/80">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="p-6 flex flex-col gap-5 flex-1 relative">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                      {s.icon}
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <h3 className="font-black text-gray-900 text-base leading-snug">{s.label}</h3>
                      <p className="text-xs text-gray-400 leading-relaxed flex-1">{s.desc}</p>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.badge}`}>
                        {statMap[s.statKey]} {s.statLabel}
                      </span>
                      <span className="text-xs font-bold text-gray-300 group-hover:text-gray-500 transition-all duration-200 group-hover:translate-x-0.5 inline-flex items-center gap-1">
                        Keşfet
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  {/* Hover'da ortaya çıkan alt renkli çizgi */}
                  <div className={`h-[3px] bg-gradient-to-r ${s.color} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
                </Link>
              ))}
            </div>

            {/* İkincil 4 kompakt kart */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {SECTION_DEFS.slice(3).map((s) => (
                <Link key={s.href} href={s.href}
                  className="group flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg} group-hover:scale-105 transition-transform duration-200`}>
                    {s.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 text-[13px] leading-snug">{s.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{statMap[s.statKey]} {s.statLabel}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-200 group-hover:text-gray-400 shrink-0 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Günün Terimi — v6-C koyu lacivert, ince amber sol çizgi ────── */}
        {dailyTerm && (
          <div className="bg-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Link href={`/kutuphane/sozluk/${dailyTerm.slug ?? dailyTerm.id}`}
                className="group flex items-center rounded-[20px] overflow-hidden shadow-[0_8px_40px_rgba(11,24,41,0.3)] hover:shadow-[0_16px_56px_rgba(11,24,41,0.4)] hover:-translate-y-0.5 transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #0b1829 0%, #1a3350 100%)' }}>
                {/* İnce amber sol çizgi */}
                <div className="w-[5px] self-stretch shrink-0 bg-gradient-to-b from-amber-400 to-orange-500" />
                {/* Tarih sütunu */}
                <div className="flex flex-col items-center justify-center gap-1 px-8 py-9 shrink-0">
                  <span className="text-[64px] font-black text-white leading-none tracking-[-3px] select-none">
                    {new Date().getDate()}
                  </span>
                  <span className="text-[10px] font-black text-amber-400 tracking-[0.22em] uppercase">
                    {new Date().toLocaleDateString('tr-TR', { month: 'long' }).toUpperCase()}
                  </span>
                </div>
                {/* İçerik */}
                <div className="flex-1 min-w-0 py-8 pr-10">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-black tracking-[0.18em] uppercase text-amber-400 mb-2.5 block">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0 inline-block" />
                    Günün Terimi
                  </span>
                  <h2 className="text-[36px] font-black text-white leading-none tracking-tight mb-1.5 group-hover:text-amber-400 transition-colors">
                    {dailyTerm.term}
                  </h2>
                  {dailyTerm.fullForm && (
                    <p className="text-xs text-white/40 font-medium mb-3">{dailyTerm.fullForm}</p>
                  )}
                  <p className="text-[13.5px] text-white/60 leading-relaxed line-clamp-2 max-w-2xl">
                    {dailyTerm.definition}
                  </p>
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    {dailyTerm.fields.slice(0, 2).map(f => (
                      <span key={f} className="text-[10px] font-semibold text-white/50 bg-white/[0.08] border border-white/[0.12] px-3 py-1 rounded-full">
                        {f.replace(/_/g, ' ')}
                      </span>
                    ))}
                    <span className="ml-auto text-[12px] font-black text-amber-400 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Tam tanımı oku
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* ── Editörden ────────────────────────────────────────────────────── */}
        {featuredTotal > 0 && (
          <div className="bg-white border-t border-gray-100">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-[3px] h-7 bg-amber-400 rounded-full shrink-0" />
                <div>
                  <p className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400 mb-0.5">Editörden</p>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none">Öne Çıkan İçerikler</h2>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.terms.map(t => (
                  <Link key={t.id} href={`/kutuphane/sozluk/${t.slug ?? t.id}`}
                    className="group flex overflow-hidden rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-200">
                    <div className="w-[4px] shrink-0 bg-[#0b1829]" />
                    <div className="flex flex-col gap-4 flex-1 p-5">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-[10px] font-black tracking-[0.12em] uppercase px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0b1829]" />Terim
                        </span>
                        {t.fields[0] && <span className="text-[10px] text-gray-400 font-medium">{t.fields[0].replace(/_/g, ' ')}</span>}
                      </div>
                      <p className="font-black text-gray-900 text-[15px] leading-snug flex-1">{t.term}</p>
                      <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all inline-block">Tanımı gör →</span>
                    </div>
                  </Link>
                ))}
                {featured.guides.map(g => (
                  <Link key={g.id} href={`/kutuphane/rehberler/${g.slug ?? g.id}`}
                    className="group flex overflow-hidden rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-200">
                    <div className="w-[4px] shrink-0 bg-amber-400" />
                    <div className="flex flex-col gap-4 flex-1 p-5">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-[10px] font-black tracking-[0.12em] uppercase px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Rehber
                        </span>
                        {g.fields[0] && <span className="text-[10px] text-gray-400 font-medium">{g.fields[0].replace(/_/g, ' ')}</span>}
                      </div>
                      <p className="font-black text-gray-900 text-[15px] leading-snug flex-1">{g.title}</p>
                      <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all inline-block">Rehberi oku →</span>
                    </div>
                  </Link>
                ))}
                {featured.regulations.map(r => (
                  <Link key={r.id} href={`/kutuphane/mevzuat/${r.slug ?? r.id}`}
                    className="group flex overflow-hidden rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-200">
                    <div className="w-[4px] shrink-0 bg-gray-400" />
                    <div className="flex flex-col gap-4 flex-1 p-5">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-[10px] font-black tracking-[0.12em] uppercase px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />Mevzuat
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">{r.type}</span>
                      </div>
                      <p className="font-black text-gray-900 text-[15px] leading-snug flex-1">{r.short_title ?? r.title}</p>
                      <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all inline-block">İncele →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Kaydedilenler ─────────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SavedSection />
        </div>

        {/* ── Footer CTA ───────────────────────────────────────────────────── */}
        <div className="border-t border-gray-100 mt-6">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="relative bg-[#0b1829] rounded-3xl px-8 sm:px-12 py-10 overflow-hidden">
              {/* Dekoratif amber halka */}
              <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border border-amber-400/10 pointer-events-none" />
              <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border border-amber-400/8 pointer-events-none" />
              <div className="absolute right-12 bottom-0 w-2 h-2 rounded-full bg-amber-400/40 pointer-events-none" />
              <div className="absolute right-24 bottom-6 w-1.5 h-1.5 rounded-full bg-white/20 pointer-events-none" />

              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <p className="font-black text-white text-xl sm:text-2xl leading-tight tracking-tight">
                    Mesleğimizin yaşayan<br />en büyük bilgi platformu
                  </p>
                  <p className="text-white/40 text-sm mt-2">Katkıda bulun, soru sor, içerik üret.</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link href="/kutuphane/ai"
                    className="bg-white/8 border border-white/15 text-white font-semibold text-sm px-5 py-3 rounded-xl hover:bg-white/15 transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Asistan
                  </Link>
                  <a href={`${process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org'}/uye-ol`}
                    className="bg-amber-400 hover:bg-amber-300 text-[#0b1829] font-black text-sm px-5 py-3 rounded-xl transition-colors">
                    Üye Ol →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </>
  );
}

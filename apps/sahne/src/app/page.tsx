import type React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import TurkeyMap from '@/components/TurkeyMap';
import CommunityPulse from '@/components/CommunityPulse';
import { UpcomingEventBanner } from '@/components/UpcomingEventBanner';
import { cms } from '@/lib/api';

// ─── Module definitions ────────────────────────────────────────────────────────

const MODULES: {
  title: string;
  desc: string;
  href: string;
  tag: string | null;
  estimatedDate?: string;
  hasPage?: boolean;
  teaserGradient?: string;
  external?: boolean;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    title: 'Etkinlikler',
    desc: 'Kongre, workshop ve networking etkinliklerini takip edin, kayıt olun.',
    href: '/etkinlikler',
    tag: null,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Üyeler',
    desc: 'Sektörün farklı alanlarından uzmanları ve öğrencileri tanıyın.',
    href: '/uyeler',
    tag: 'Yakında',
    estimatedDate: 'Haziran 2026',
    hasPage: false,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'bg-violet-50 text-violet-600',
  },
  {
    title: 'Haritailesi Genç',
    desc: 'Üniversite öğrencileri için öğrenci kulüpleri, etkinlikler, eğitimler ve topluluk bağlantıları.',
    href: '/genc',
    tag: null,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
    color: 'bg-emerald-50 text-emerald-700',
  },
  {
    title: 'Mentorluk',
    desc: 'Deneyimli profesyonellerden birebir rehberlik alın veya mentor olun.',
    href: '/mentorluk',
    tag: null,
    hasPage: true,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
    color: 'bg-amber-50 text-amber-600',
  },
  {
    title: 'Mutfak',
    desc: 'Topluluk tartışmaları, iş birliği ve üretim alanı. Üyelere özel.',
    href: process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org',
    tag: 'Üyelere Özel',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    color: 'bg-[var(--color-mavi)]/8 text-[var(--color-mavi)]',
  },
  {
    title: 'Mağaza',
    desc: 'Meslektaşların uygulama ve ürünleri, dijital kaynaklar, üye kitleri ve topluluk içerikleri.',
    href: '/magaza',
    tag: null,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    color: 'bg-purple-50 text-purple-600',
  },
  {
    title: 'Eğitimler',
    desc: 'Vakfın ve vakfın desteklediği online ve yüz yüze eğitim programları, sertifika kursları.',
    href: '/egitim',
    tag: null,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    color: 'bg-teal-50 text-teal-700',
  },
  {
    title: 'Talep & Görüş',
    desc: 'Platform önerileri, şikayet ve taleplerinizi iletin. Topluluğu birlikte geliştirelim.',
    href: '/gorusleriniz',
    tag: null,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
    color: 'bg-gray-100 text-gray-600',
  },
  {
    title: 'Bağış',
    desc: 'Haritailesi topluluğunu ve etkinliklerini destekleyin. Bireysel veya kurumsal bağış yapın.',
    href: '/bagis',
    tag: null,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    color: 'bg-rose-50 text-rose-600',
  },
  {
    title: 'İlan Panosu',
    desc: 'Harita, geomatik ve kadastro sektörüne özel iş ilanları, staj ve proje fırsatları.',
    href: '/ilanlar',
    tag: null,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Reklam & İşbirliği',
    desc: 'Sektör profesyonellerine ulaşın. Sponsorluk, kurumsal üyelik ve içerik iş birlikleri.',
    href: '/isbirligi',
    tag: null,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
    color: 'bg-amber-50 text-amber-600',
  },
  {
    title: 'Forum',
    desc: 'Topluluktan herkese açık sorular, fikirler ve tartışmalar. Katılmak için Mutfak üyesi olun.',
    href: '/forum',
    tag: null,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: 'bg-sky-50 text-sky-600',
  },
  {
    title: 'Yarışmalar',
    desc: 'Fotoğraf, proje ve makale yarışmaları. Başvur, ödüller kazan.',
    href: '/yarismalar',
    tag: null,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'bg-amber-50 text-amber-600',
  },
  {
    title: 'Sınavlar',
    desc: 'KPSS, Gayrimenkul Değerleme, CBS Uzmanlığı ve daha fazlası için çevrimiçi sınav pratiği.',
    href: '/sinavlar',
    tag: null,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    title: 'Anketler',
    desc: 'Topluluk görüşlerini şekillendirin. Aktif anketlere katılın, sonuçları herkesle paylaşıyoruz.',
    href: '/anketler',
    tag: null,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'bg-emerald-50 text-emerald-600',
  },
  // ── Ekosistem (dış platformlar) ───────────────────────────────────────────
  {
    title: 'Haritailesi Vakfı',
    desc: 'Haritailesi Vakfı resmi web sitesi. Misyon, vizyon ve kurumsal bilgiler.',
    href: 'https://haritailesi.org',
    tag: null,
    external: true,
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 28 28" fill="currentColor">
        <path d="M14 2L2 11h3v15h7v-8h4v8h7V11h3L14 2z" />
        <rect x="11" y="16" width="6" height="10" rx="1" fill="white" opacity="0.3" />
      </svg>
    ),
    color: 'bg-[#26496b]/10 text-[#26496b]',
  },
  {
    title: 'Haberita',
    desc: 'Harita, geomatik ve kadastro sektörüne özel haber ve içerik platformu.',
    href: 'https://haberita.com',
    tag: null,
    external: true,
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 28 28" fill="currentColor">
        <rect x="3" y="4" width="5" height="20" rx="1.5" />
        <rect x="3" y="11.5" width="22" height="5" rx="1.5" />
        <rect x="20" y="4" width="5" height="20" rx="1.5" />
      </svg>
    ),
    color: 'bg-orange-50 text-orange-600',
  },
  {
    title: 'Haritakariyer',
    desc: 'Sektöre özel iş ilanları, kariyer fırsatları ve profesyonel bağlantılar.',
    href: 'https://www.linkedin.com/showcase/haritakariyer',
    tag: null,
    external: true,
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 28 28" fill="currentColor">
        <circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 3.5l2.8 9.7h-5.6L14 3.5z" />
        <path d="M14 24.5l-2.8-9.7h5.6L14 24.5z" opacity="0.35" />
        <path d="M24.5 14l-9.7 2.8v-5.6L24.5 14z" opacity="0.35" />
        <path d="M3.5 14l9.7-2.8v5.6L3.5 14z" />
        <circle cx="14" cy="14" r="2.2" fill="white" />
      </svg>
    ),
    color: 'bg-teal-50 text-teal-700',
  },
  {
    title: 'Haritakademi',
    desc: 'Sektör profesyonelleri için eğitim içerikleri, sertifika programları ve akademik kaynaklar.',
    href: 'https://www.linkedin.com/showcase/haritakademi',
    tag: null,
    external: true,
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 28 28" fill="currentColor">
        <path d="M14 3L2 9l12 6 10-5v7h2V9L14 3z" />
        <path d="M7 14.5v5.5c0 2.5 3.1 4 7 4s7-1.5 7-4v-5.5l-7 3.5-7-3.5z" />
      </svg>
    ),
    color: 'bg-cyan-50 text-cyan-700',
  },
  {
    title: 'Haritailesi TV',
    desc: 'Sektörel içerikler, etkinlik kayıtları ve röportajlar. YouTube kanalımız.',
    href: 'https://www.youtube.com/@haritailesi',
    tag: null,
    external: true,
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="24" height="16" rx="2.5" />
        <path d="M10 26h8M14 21v5" />
        <path d="M11.5 10.5l7 4-7 4v-8z" fill="currentColor" stroke="none" />
      </svg>
    ),
    color: 'bg-red-50 text-red-600',
  },
];

const STATS = [
  { label: 'Kayıtlı Üye', value: '500+' },
  { label: 'Yıllık Etkinlik', value: '25+' },
  { label: 'Aktif Mentor', value: '12' },
  { label: 'Soru & Cevap', value: '200+' },
];

// ─── Event type config ────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  kongre: 'Kongre',
  networking: 'Networking',
  odul: 'Ödül Töreni',
  webinar: 'Webinar',
  calistay: 'Çalıştay',
  sempozyum: 'Sempozyum',
  diger: 'Etkinlik',
};

const TYPE_COLORS: Record<string, string> = {
  kongre: 'bg-violet-100 text-violet-700',
  networking: 'bg-blue-100 text-blue-700',
  odul: 'bg-amber-100 text-amber-700',
  webinar: 'bg-teal-100 text-teal-700',
  calistay: 'bg-emerald-100 text-emerald-700',
  sempozyum: 'bg-indigo-100 text-indigo-700',
  diger: 'bg-gray-100 text-gray-600',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SahnePage() {
  const [events, memberCities] = await Promise.all([
    cms.events(),
    cms.memberCities(),
  ]);
  const now = new Date();

  const WEB_URL = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';
  const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

  const sorted = (events ?? []).sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
  const broadcastEvents = sorted.slice(0, 6);
  const nextEvent = sorted.find((e) => new Date(e.dateStart) > now) ?? null;

  return (
    <>
      <Navbar />

      {nextEvent && (
        <UpcomingEventBanner
          title={nextEvent.title}
          slug={nextEvent.slug}
          dateStart={nextEvent.dateStart}
          location={nextEvent.location ?? null}
          typeLabel={TYPE_LABELS[nextEvent.type] ?? nextEvent.type}
        />
      )}

      <main>
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-white dark:bg-[#070c1a] pt-16 pb-20 sm:pt-20 sm:pb-28">
          {/* Gradient blob — scroll-driven parallax */}
          <div
            className="hero-parallax-bg pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] opacity-[0.06] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{ background: 'linear-gradient(to right, #26496b, #66aca9)' }}
            />
          </div>

          {/* Topographic SVG overlay */}
          <div className="hero-topo-in hero-parallax-topo pointer-events-none absolute inset-0 -z-10 flex items-center justify-center" aria-hidden="true">
            <svg viewBox="0 0 800 500" className="w-full max-w-4xl opacity-[0.06]" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="400" cy="250" rx="380" ry="230" stroke="#26496b" strokeWidth="1.2" />
              <ellipse cx="400" cy="250" rx="300" ry="180" stroke="#26496b" strokeWidth="1.2" />
              <ellipse cx="400" cy="250" rx="220" ry="130" stroke="#26496b" strokeWidth="1.2" />
              <ellipse cx="400" cy="250" rx="150" ry="88" stroke="#26496b" strokeWidth="1.2" />
              <ellipse cx="400" cy="250" rx="90" ry="54" stroke="#66aca9" strokeWidth="1.2" />
              <ellipse cx="400" cy="250" rx="45" ry="28" stroke="#66aca9" strokeWidth="1.2" />
              <ellipse cx="400" cy="250" rx="18" ry="11" stroke="#66aca9" strokeWidth="1.2" />
            </svg>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-mavi)]/8 text-[var(--color-mavi)] text-xs font-semibold mb-6 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-teal)]" />
              Haritailesi Sahne
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-slate-50 tracking-tight max-w-3xl mx-auto leading-tight">
              Sektörün üretimi,{' '}
              <span style={{ color: 'var(--color-teal)' }}>gözler önünde.</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Harita, geomatik ve kadastro topluluğunun projelerini, etkinliklerini ve üyelerini keşfedin.
              Sahne; üretimin görünür olduğu, bağlantıların kurulduğu ve etkinin başladığı yer.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/etkinlikler"
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors shadow-sm"
              >
                Keşfet
              </Link>
              <Link
                href={`${WEB_URL}/uye-ol` as `https://${string}`}
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-[var(--color-mavi)] border-2 border-[var(--color-mavi)] hover:bg-[var(--color-mavi)]/5 rounded-xl transition-colors"
              >
                Topluluğa Katıl
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats bar ─────────────────────────────────────────────────── */}
        <section className="border-y border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-slate-800">
              {STATS.map((s) => (
                <div key={s.label} className="px-6 py-8 text-center">
                  <div className="text-3xl font-bold text-[var(--color-mavi)] dark:text-blue-400">{s.value}</div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Yayın Akışı ───────────────────────────────────────────────── */}
        <section className="py-20 sm:py-28 dark:bg-[#070c1a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-red-600">Yayın Akışı</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">Güncel etkinlikler</h2>
              </div>
              <Link href="/etkinlikler" className="text-sm font-medium text-[var(--color-mavi)] hover:underline shrink-0">
                Tüm etkinlikleri gör →
              </Link>
            </div>

            {broadcastEvents.length > 0 ? (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="bg-gray-900 dark:bg-slate-800 text-gray-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider px-6 py-3 grid grid-cols-[110px_1fr_auto] gap-4">
                    <span>Tarih / Saat</span>
                    <span>İçerik</span>
                    <span className="text-right">Konum</span>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-slate-800">
                    {broadcastEvents.map((event) => {
                      const isPast = new Date(event.dateStart) < now;
                      const typeLabel = TYPE_LABELS[event.type] ?? event.type;
                      const typeColor = TYPE_COLORS[event.type] ?? TYPE_COLORS['diger'];
                      const date = new Date(event.dateStart);
                      return (
                        <Link
                          key={event.id}
                          href={`/etkinlikler/${event.slug}`}
                          className={`grid grid-cols-[110px_1fr_auto] gap-4 items-center px-6 py-4 transition-colors ${
                            isPast
                              ? 'bg-gray-50/50 dark:bg-slate-900/30 opacity-60'
                              : 'bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-gray-400 dark:text-slate-500">
                              {date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                            </div>
                            <div className="text-sm font-bold text-gray-900 dark:text-slate-100">
                              {date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColor}`}>{typeLabel}</span>
                            </div>
                            <div className={`text-sm font-semibold text-gray-900 dark:text-slate-100 truncate ${isPast ? 'line-through' : ''}`}>
                              {event.title}
                            </div>
                          </div>
                          <div className="text-right text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">
                            {event.location ?? '—'}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-3">
                  {broadcastEvents.map((event) => {
                    const isPast = new Date(event.dateStart) < now;
                    const typeLabel = TYPE_LABELS[event.type] ?? event.type;
                    const typeColor = TYPE_COLORS[event.type] ?? TYPE_COLORS['diger'];
                    const date = new Date(event.dateStart);
                    return (
                      <Link
                        key={event.id}
                        href={`/etkinlikler/${event.slug}`}
                        className={`block rounded-2xl border p-4 ${
                          isPast
                            ? 'bg-gray-50/50 border-gray-100 dark:bg-slate-900/30 dark:border-slate-800 opacity-60'
                            : 'bg-white border-gray-100 dark:bg-slate-900 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColor}`}>{typeLabel}</span>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-bold text-gray-900 dark:text-slate-100">
                              {date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} · {date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        <div className={`text-sm font-semibold text-gray-900 dark:text-slate-100 ${isPast ? 'line-through' : ''}`}>
                          {event.title}
                        </div>
                        {event.location && (
                          <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">{event.location}</div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-16 text-center">
                <p className="text-gray-400 dark:text-slate-500 text-sm">Yaklaşan etkinlik bulunmuyor.</p>
                <Link href="/etkinlikler" className="mt-3 inline-block text-sm font-medium text-[var(--color-mavi)] hover:underline">
                  Geçmiş etkinlikleri gör →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── Community Pulse ───────────────────────────────────────────── */}
        <CommunityPulse />

        {/* ── Modules grid ──────────────────────────────────────────────── */}
        <section className="py-20 sm:py-28 dark:bg-[#070c1a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">Sahne Modülleri</h2>
              <p className="mt-3 text-gray-500 dark:text-slate-400 max-w-xl mx-auto">
                Topluluğun farklı katmanlarını keşfedin. Projeden mentorlüğa, etkinlikten içeriğe.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {MODULES.map((m) => {
                const isComingSoon = m.tag === 'Yakında';

                const cardInner = isComingSoon ? (
                  <>
                    {/* Teaser banner */}
                    <div className={`relative h-28 bg-gradient-to-br ${m.teaserGradient ?? 'from-gray-400 to-gray-600'} overflow-hidden`}>
                      {/* Dot pattern */}
                      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id={`dots-${m.title}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1.5" fill="white" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#dots-${m.title})`} />
                      </svg>
                      {/* Large faded icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white opacity-20 scale-[3]">{m.icon}</div>
                      </div>
                      {/* Bottom fade */}
                      <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-white dark:from-slate-900 to-transparent" />
                      {/* Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-amber-600 dark:text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                          Yakında
                        </span>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.color}`}>
                          {m.icon}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">{m.title}</h3>
                          {m.estimatedDate && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{m.estimatedDate}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed flex-1">{m.desc}</p>
                      <div className="mt-5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Tahmini lansman: {m.estimatedDate ?? 'Yakında'}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${m.color}`}>
                        {m.icon}
                      </div>
                      {m.tag && (
                        <span className="bg-[var(--color-mavi)]/10 text-[var(--color-mavi)] text-xs font-medium px-2.5 py-1 rounded-full">
                          {m.tag}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-1.5">{m.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed flex-1">{m.desc}</p>
                    <div className="mt-5 flex items-center gap-1.5 text-sm font-medium text-[var(--color-mavi)] dark:text-blue-400 group-hover:gap-2.5 transition-all">
                      {m.external ? 'Ziyaret Et' : 'İncele'}
                      {m.external ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </>
                );

                const baseClass = isComingSoon
                  ? 'relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden'
                  : 'group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700 transition-all p-6';

                if (isComingSoon && !m.hasPage) {
                  return <div key={m.title} className={baseClass}>{cardInner}</div>;
                }

                if (m.external) {
                  return (
                    <a key={m.title} href={m.href} target="_blank" rel="noopener noreferrer" className={baseClass}>
                      {cardInner}
                    </a>
                  );
                }

                return (
                  <Link key={m.title} href={m.href} className={baseClass}>
                    {cardInner}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Turkey Map ────────────────────────────────────────────────── */}
        <section className="py-20 sm:py-28 dark:bg-[#070c1a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-teal)] mb-3">
                Türkiye Haritasında Biz
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
                Haritailesi üyeleri tüm Türkiye&apos;de.
              </h2>
              <p className="mt-3 text-gray-500 dark:text-slate-400 max-w-lg mx-auto">
                {memberCities.length > 0
                  ? `Toplamda ${memberCities.reduce((s, m) => s + m.count, 0)} üye, ${memberCities.length} şehirde aktif.`
                  : 'Haritailesi üyeleri tüm Türkiye\'de.'}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 sm:p-8">
              <TurkeyMap members={memberCities} />
            </div>
          </div>
        </section>

        {/* ── What is Sahne ─────────────────────────────────────────────── */}
        <section className="py-20 sm:py-28 bg-gray-50 dark:bg-slate-950 border-y border-gray-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-teal)] mb-3">
                  Sahne nedir?
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-5 leading-snug">
                  Üretimin vitrini değil,<br />etkisinin başladığı yer.
                </h2>
                <div className="space-y-4 text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                  <p>
                    Sahne, Haritailesi topluluğunun dışa açık katmanıdır. Burada üyeler projelerini paylaşır,
                    etkinliklere erişilir, mentorlarla tanışılır.
                  </p>
                  <p>
                    Sosyal medya gürültüsünden uzak; sektöre değer katan içerikler, gerçek kişiler
                    ve somut çıktılar. Harita, geomatik ve kadastro dünyasının vitrininde sizi bekliyoruz.
                  </p>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`${WEB_URL}/uye-ol/bireysel` as `https://${string}`}
                    className="px-6 py-3 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors"
                  >
                    Bireysel Üye Ol
                  </Link>
                  <Link
                    href={`${WEB_URL}/hakkimizda` as `https://${string}`}
                    className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 rounded-xl transition-colors"
                  >
                    Haritailesi Hakkında
                  </Link>
                </div>
              </div>

              {/* Feature list */}
              <div className="space-y-4">
                {[
                  {
                    title: 'Yarı açık vitrin',
                    desc: 'Topluluk projeleri ve etkinlikleri herkese açık; detaylar ve etkileşim üyelere özel.',
                  },
                  {
                    title: 'Modül geçiş ekranı',
                    desc: 'Sahne üzerinden Mutfak (özel topluluk), mentorluk ve diğer modüllere erişirsiniz.',
                  },
                  {
                    title: 'Sektöre özgü',
                    desc: 'Harita, geomatik, kadastro, CBS ve ilgili sektörler — başka hiçbir gürültü yok.',
                  },
                  {
                    title: 'Üretim kültürü',
                    desc: 'Pasif tüketim değil, aktif üretim. İçerik, proje ve katkıyla büyüyen topluluk.',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-[var(--color-teal)]/15 text-[var(--color-teal)] flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{item.title}</div>
                      <div className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Membership tiers ──────────────────────────────────────────── */}
        <section className="py-20 sm:py-28 dark:bg-[#070c1a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-3">Üyelik Tipleri</h2>
            <p className="text-gray-500 dark:text-slate-400 max-w-xl mx-auto mb-12">
              Her aşama için bir yer var. Öğrenciden profesyonele, bireyden kuruma.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                {
                  tier: 'Haritailesi Genç',
                  who: 'Öğrenciler',
                  price: 'Ücretsiz',
                  priceColor: 'text-emerald-600',
                  features: ['Sahne erişimi', 'Etkinlik katılımı', 'Mesleğin Gelecekleri başvurusu'],
                  cta: 'Başvur',
                  href: `${WEB_URL}/meslegin-gelecekleri/basvuru`,
                },
                {
                  tier: 'Mesleğin Değer Ortağı',
                  who: 'Profesyoneller',
                  price: '1.750 ₺/yıl',
                  priceColor: 'text-[var(--color-mavi)]',
                  features: ['Sahne + Mutfak erişimi', 'Mentorluk programı', 'Üye dizini', 'Proje paylaşımı'],
                  cta: 'Üye Ol',
                  href: `${WEB_URL}/uye-ol/bireysel`,
                  highlight: true,
                },
                {
                  tier: 'Kurumsal',
                  who: 'Şirketler & Kurumlar',
                  price: 'İletişime Geçin',
                  priceColor: 'text-[var(--color-altin)]',
                  features: ['Marka görünürlüğü', 'Etkinlik sponsorluğu', 'Ekip üyeliği', 'Özel destek'],
                  cta: 'İletişim',
                  href: `${WEB_URL}/uye-ol/kurumsal`,
                },
              ].map((t) => (
                <div
                  key={t.tier}
                  className={`relative flex flex-col rounded-2xl border p-6 text-left bg-white dark:bg-slate-900 ${
                    t.highlight
                      ? 'border-[var(--color-mavi)] shadow-md ring-1 ring-[var(--color-mavi)]/20'
                      : 'border-gray-100 dark:border-slate-800 shadow-sm'
                  }`}
                >
                  {t.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-[var(--color-mavi)] text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Popüler
                      </span>
                    </div>
                  )}
                  <div className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t.who}</div>
                  <div className="text-base font-bold text-gray-900 dark:text-slate-100 mb-2">{t.tier}</div>
                  <div className={`text-2xl font-bold mb-5 ${t.priceColor}`}>{t.price}</div>
                  <ul className="space-y-2 flex-1 mb-6">
                    {t.features.map((f) => (
                      <li key={f} className="flex gap-2 text-sm text-gray-600 dark:text-slate-400">
                        <svg className="w-4 h-4 text-[var(--color-teal)] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={t.href}
                    className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      t.highlight
                        ? 'bg-[var(--color-mavi)] text-white hover:bg-[var(--color-mavi-acik)]'
                        : 'border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {t.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ────────────────────────────────────────────────── */}
        <section className="bg-[var(--color-mavi)] py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Haritailesi topluluğuna katılın.
            </h2>
            <p className="text-white/70 mb-8 max-w-lg mx-auto">
              Sektörün geleceğini birlikte şekillendiren profesyoneller ve öğrencilerle tanışın.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`${WEB_URL}/uye-ol` as `https://${string}`}
                className="px-8 py-3.5 bg-white text-[var(--color-mavi)] font-semibold text-sm rounded-xl hover:bg-gray-100 transition-colors"
              >
                Üye Ol
              </Link>
              <a
                href={MUTFAK_URL}
                className="px-8 py-3.5 border-2 border-white/40 text-white font-semibold text-sm rounded-xl hover:border-white/70 hover:bg-white/5 transition-colors"
              >
                Zaten üyeyim — Mutfak&apos;a Gir
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="bg-gray-900 text-gray-400 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pb-8 border-b border-gray-800">
              <div>
                <div className="text-white font-semibold mb-3">Haritailesi Sahne</div>
                <p className="text-sm leading-relaxed">
                  Harita, geomatik ve kadastro sektörü topluluğunun yarı açık platformu.
                </p>
              </div>
              <div>
                <div className="text-white font-semibold mb-3">Modüller</div>
                <ul className="space-y-2 text-sm">
                  {[
                    { label: 'Etkinlikler', href: '/etkinlikler' },
                    { label: 'Üyeler', href: '/uyeler' },
                    { label: 'Mentorluk', href: '/mentorluk' },
                    { label: 'Soru & Cevap', href: '/soru-cevap' },
                  ].map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="hover:text-white transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-white font-semibold mb-3">Haritailesi</div>
                <ul className="space-y-2 text-sm">
                  {[
                    { label: 'Ana Site', href: WEB_URL },
                    { label: 'Hakkımızda', href: `${WEB_URL}/hakkimizda` },
                    { label: 'Üye Ol', href: `${WEB_URL}/uye-ol` },
                    { label: 'İletişim', href: `${WEB_URL}/iletisim` },
                  ].map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="hover:text-white transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <span>© {new Date().getFullYear()} Haritailesi Vakfı. Tüm hakları saklıdır.</span>
              <div className="flex gap-4">
                <Link href={`${WEB_URL}/hakkimizda/tuzuk`} className="hover:text-white transition-colors">KVKK</Link>
                <Link href={`${WEB_URL}/iletisim`} className="hover:text-white transition-colors">İletişim</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

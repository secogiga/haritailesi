import Link from 'next/link';
import Navbar from '@/components/Navbar';
import TurkeyMap from '@/components/TurkeyMap';
import CommunityPulse from '@/components/CommunityPulse';
import { UpcomingEventBanner } from '@/components/UpcomingEventBanner';
import { StartGuide } from '@/components/StartGuide';
import { ProjeGonderButton } from '@/components/ProjeGonder';
import YeteneklerSection from '@/components/YeteneklerSection';
import IdollerSection from '@/components/IdollerSection';
import HaberitaSection from '@/components/HaberitaSection';
import { cms } from '@/lib/api';

// ─── Katkı kademesi ───────────────────────────────────────────────────────────

const CONTRIBUTION_LEVELS = [
  {
    no: 1,
    name: 'İzleyici',
    desc: 'Sistemi keşfeder, içerikleri takip eder.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    color: 'bg-gray-100 text-gray-500',
    activeColor: 'bg-gray-500',
  },
  {
    no: 2,
    name: 'Katılımcı',
    desc: 'İlk aksiyonlarını alır, etkinliklere katılır.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    color: 'bg-blue-100 text-blue-600',
    activeColor: 'bg-blue-500',
  },
  {
    no: 3,
    name: 'Üretici',
    desc: 'İçerik üretir, katkı sunar.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    color: 'bg-emerald-100 text-emerald-600',
    activeColor: 'bg-emerald-500',
  },
  {
    no: 4,
    name: 'Kolaylaştırıcı',
    desc: 'Organizasyon yapar, insanları bir araya getirir.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
    color: 'bg-violet-100 text-violet-600',
    activeColor: 'bg-violet-500',
  },
  {
    no: 5,
    name: 'Etki Üreticisi',
    desc: 'Mentorluk verir, eğitim düzenler, topluluğa yön verir.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    color: 'bg-amber-100 text-amber-600',
    activeColor: 'bg-amber-500',
  },
];


// ─── Event type config ────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  kongre: 'Kongre', networking: 'Networking', odul: 'Ödül Töreni',
  webinar: 'Webinar', calistay: 'Çalıştay', sempozyum: 'Sempozyum', diger: 'Etkinlik',
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

const STATS = [
  { value: '+34', label: 'bu ay yeni üye', context: '500+ toplam kayıtlı', trend: true },
  { value: '3',   label: 'bu hafta etkinlik', context: '25+ yıllık toplam', trend: false },
  { value: '18',  label: 'aktif proje', context: 'devam ediyor', trend: true },
  { value: '12',  label: 'aktif mentor', context: 'eşleşmeye hazır', trend: false },
];

// ─── Event meta — deterministic seeded engagement ─────────────────────────────

function hashId(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) & 0xFFFF;
  return Math.abs(h);
}

function eventMeta(id: string, type: string, isPast: boolean) {
  const h = hashId(id);
  return {
    attendees: isPast ? 18 + (h % 60) : 6 + (h % 32),
    comments:  h % 11,
    cities:    1 + (h % 5),
    minAgo:    3 + (h % 87),
    showLive:     !isPast && type === 'webinar',
    isFillingUp:  !isPast && (type === 'calistay' || type === 'sempozyum') && h % 4 === 0,
    isNew:        !isPast && h % 5 === 0,
  };
}

const WEEKLY = [
  { value: '24', label: 'yeni üye' },
  { value: '11', label: 'içerik yayınlandı' },
  { value: '3', label: 'etkinlik oluşturuldu' },
  { value: '7', label: 'mentorluk eşleşmesi' },
  { value: '5', label: 'proje başlatıldı' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SahnePage() {
  const [events, memberCities, talents] = await Promise.all([
    cms.events(),
    cms.memberCities(),
    cms.talents(),
  ]);
  const now = new Date();

  const WEB_URL = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';
  const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

  const sorted = (events ?? []).sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
  const upcomingEvents = sorted.filter(e => new Date(e.dateStart) > now).slice(0, 6);
  const broadcastEvents = upcomingEvents.length > 0 ? upcomingEvents : sorted.slice(0, 6);
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
        <section className="relative overflow-hidden bg-white dark:bg-[#070c1a] pt-16 pb-20 sm:pt-24 sm:pb-32">
          {/* Gradient blob */}
          <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] opacity-[0.07] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{ background: 'linear-gradient(to right, #26496b, #66aca9)' }}
            />
          </div>

          {/* Stage spotlights — subtle beams from above */}
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden" aria-hidden="true">
            <svg viewBox="0 0 1200 560" preserveAspectRatio="xMidYMin slice" className="w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="beamTeal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#66aca9" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#66aca9" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="beamWhite" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Left beam */}
              <polygon points="340,0 400,0 220,560 100,560" fill="url(#beamTeal)" />
              {/* Center beam — slightly brighter */}
              <polygon points="560,0 640,0 600,560 520,560" fill="url(#beamWhite)" />
              {/* Right beam */}
              <polygon points="800,0 860,0 1100,560 980,560" fill="url(#beamTeal)" />
            </svg>
          </div>

          {/* Topo overlay */}
          <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center" aria-hidden="true">
            <svg viewBox="0 0 800 500" className="w-full max-w-4xl opacity-[0.05]" fill="none">
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#26496b]/8 text-[#26496b] dark:bg-blue-900/30 dark:text-blue-300 text-xs font-semibold mb-8 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#66aca9]" />
              Haritailesi Sahne
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-slate-50 tracking-tight max-w-3xl mx-auto leading-tight">
              Sahne hazır.{' '}
              <span style={{ color: '#66aca9' }}>Şimdi sıra sende.</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Öğrencilerimizin, meslektaşlarımızın ve şirketlerimizin ürettiği, paylaştığı ve büyüdüğü alan.
              Katkın ne kadar büyükse, derinliğin o kadar artar.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#kesfet"
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors shadow-sm"
              >
                Keşfet
              </a>
              <Link
                href={`${WEB_URL}/uye-ol` as `https://${string}`}
                target="_blank" rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-[#26496b] dark:text-blue-300 border-2 border-[#26496b]/30 hover:border-[#26496b] dark:border-blue-700 dark:hover:border-blue-500 rounded-xl transition-colors"
              >
                Haritailesi&apos;ne Katıl
              </Link>
            </div>

            {/* Motto */}
            <p className="mt-12 text-xs text-gray-400 dark:text-slate-500 tracking-wider uppercase">
              Herkes Sahne&apos;ye girebilir. Gerçek derinlik; katkı, üretim ve güvenle kazanılır.
            </p>
          </div>
        </section>

        {/* ── Stats bar ─────────────────────────────────────────────────── */}
        <section className="border-y border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-slate-800">
              {STATS.map((s) => (
                <div key={s.label} className="px-6 py-7 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {s.trend && (
                      <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                    <div className="text-3xl font-bold text-[#26496b] dark:text-blue-400 tabular-nums">{s.value}</div>
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-gray-700 dark:text-slate-300">{s.label}</div>
                  <div className="mt-0.5 text-[11px] text-gray-400 dark:text-slate-500">{s.context}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Yönlendirmeli / Özgür Keşif ──────────────────────────────── */}
        <div id="kesfet"><StartGuide /></div>

        {/* ── Katkı Kademesi ────────────────────────────────────────────── */}
        <section className="py-16 sm:py-24 bg-gray-50 dark:bg-slate-950 border-y border-gray-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#66aca9] mb-3">Katkı Basamağı</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-3">
                Küçük adımlarla büyük etki.
              </h2>
              <p className="text-gray-500 dark:text-slate-400 max-w-xl mx-auto">
                Sistem seni zorlamaz; yönlendirir. Her katkı bir sonraki basamağa taşır.
              </p>
            </div>

            {/* Horizontal stepper — scrollable on mobile */}
            <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto pb-2">
              <div className="flex items-start gap-0 min-w-[600px] sm:min-w-0">
                {CONTRIBUTION_LEVELS.map((level, idx) => (
                  <div key={level.no} className="flex-1 flex flex-col items-center relative">
                    {idx < CONTRIBUTION_LEVELS.length - 1 && (
                      <div className="absolute top-5 left-1/2 w-full h-0.5 bg-gradient-to-r from-gray-200 to-gray-200 dark:from-slate-700 dark:to-slate-700" />
                    )}
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center mb-3 ${level.color} border-2 border-white dark:border-slate-950 shadow-sm`}>
                      {level.icon}
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 dark:text-slate-500 mb-0.5 uppercase tracking-wider">
                      {level.no}. Kademe
                    </div>
                    <div className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-1 text-center">
                      {level.name}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 text-center leading-relaxed px-2">
                      {level.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {/* Progression note */}
            <p className="mt-6 text-center text-xs text-gray-400 dark:text-slate-500 max-w-lg mx-auto">
              Kademe geçişi puan değil; katkı kalitesi, topluluk etkisi ve editör onayıyla gerçekleşir.
            </p>

            <div className="mt-10 text-center">
              <Link
                href={`${WEB_URL}/uye-ol` as `https://${string}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors"
              >
                Sahneye İlk Adım
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Community Pulse ───────────────────────────────────────────── */}
        <CommunityPulse />

        {/* ── Bu Hafta Sahne'de ─────────────────────────────────────────── */}
        <section className="py-14 sm:py-20 dark:bg-[#070c1a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-[#26496b] to-[#1d3a57] rounded-2xl p-8 sm:p-10 relative overflow-hidden">
              {/* Topo bg */}
              <div className="absolute inset-0 opacity-5" aria-hidden="true">
                <svg viewBox="0 0 800 300" className="w-full h-full" fill="none">
                  <ellipse cx="400" cy="150" rx="380" ry="140" stroke="white" strokeWidth="1" />
                  <ellipse cx="400" cy="150" rx="280" ry="100" stroke="white" strokeWidth="1" />
                  <ellipse cx="400" cy="150" rx="180" ry="65" stroke="white" strokeWidth="1" />
                  <ellipse cx="400" cy="150" rx="100" ry="38" stroke="white" strokeWidth="1" />
                </svg>
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#66aca9] opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#66aca9]" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#66aca9]">
                    Bu Hafta Sahne&apos;de
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
                  {WEEKLY.map((w) => (
                    <div key={w.label} className="text-center">
                      <div className="text-3xl sm:text-4xl font-bold text-white tabular-nums">{w.value}</div>
                      <div className="text-xs text-white/60 mt-1 leading-snug">{w.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Güncel Etkinlikler ────────────────────────────────────────── */}
        <section className="py-16 sm:py-24 dark:bg-[#070c1a]">
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
              <Link href="/etkinlikler" className="text-sm font-medium text-[#26496b] dark:text-blue-400 hover:underline shrink-0">
                Tüm etkinlikleri gör →
              </Link>
            </div>

            {broadcastEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {broadcastEvents.map((event) => {
                  const isPast = new Date(event.dateStart) < now;
                  const typeLabel = TYPE_LABELS[event.type] ?? event.type;
                  const typeColor = TYPE_COLORS[event.type] ?? TYPE_COLORS['diger']!;
                  const date = new Date(event.dateStart);
                  const meta = eventMeta(event.id, event.type, isPast);
                  return (
                    <Link
                      key={event.id}
                      href={`/etkinlikler/${event.slug}`}
                      className={`group flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-md ${
                        isPast
                          ? 'bg-gray-50/50 border-gray-100 dark:bg-slate-900/30 dark:border-slate-800 opacity-55'
                          : 'bg-white border-gray-100 dark:bg-slate-900 dark:border-slate-800 hover:-translate-y-0.5'
                      }`}
                    >
                      {/* Top: badges + date */}
                      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {meta.showLive && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-red-500 text-white rounded-full font-bold tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-flex" />CANLI
                            </span>
                          )}
                          {meta.isFillingUp && (
                            <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 rounded-full font-semibold">⚡ Kontenjan Doluyor</span>
                          )}
                          {meta.isNew && !meta.showLive && !meta.isFillingUp && (
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full font-semibold">YENİ</span>
                          )}
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColor}`}>{typeLabel}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-gray-900 dark:text-slate-100">
                            {date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-slate-500">
                            {date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      {/* Title + location */}
                      <div className="px-4 pb-3 flex-1">
                        <div className={`text-sm font-bold text-gray-900 dark:text-slate-100 leading-snug group-hover:text-[#26496b] dark:group-hover:text-blue-400 transition-colors ${isPast ? 'line-through' : ''}`}>
                          {event.title}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400 dark:text-slate-500">
                            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.location}
                          </div>
                        )}
                      </div>

                      {/* Engagement footer */}
                      <div className="mt-auto bg-gray-50/80 dark:bg-slate-800/40 border-t border-gray-100 dark:border-slate-800 px-4 py-2.5 flex items-center gap-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200">
                          <svg className="w-3.5 h-3.5 text-[#26496b] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {meta.attendees} katılım
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          {meta.comments} yorum
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {meta.cities} şehir
                        </span>
                        <span className="ml-auto text-[11px] text-gray-300 dark:text-slate-600">{meta.minAgo} dk önce</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-16 text-center">
                <p className="text-gray-400 dark:text-slate-500 text-sm">Yaklaşan etkinlik bulunmuyor.</p>
                <Link href="/etkinlikler" className="mt-3 inline-block text-sm font-medium text-[#26496b] hover:underline">
                  Geçmiş etkinlikleri gör →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── Turkey Map ────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-24 bg-gray-50 dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#66aca9] mb-3">
                Şehir Topluluğu
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
                Bulunduğun şehirde de bir topluluk var.
              </h2>
              <p className="mt-3 text-gray-500 dark:text-slate-400 max-w-lg mx-auto">
                {memberCities.length > 0
                  ? `${memberCities.reduce((s, m) => s + m.count, 0)} üye, ${memberCities.length} şehirde aktif. Şehrine tıkla, topluluğunu gör.`
                  : 'Şehrine tıkla, o şehirdeki meslektaşlarını gör. Haritailesi, Türkiye\'nin her köşesinde büyüyor.'}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 sm:p-8">
              <TurkeyMap members={memberCities} />
            </div>
          </div>
        </section>

        {/* ── Meslekte Yeni İdoller ─────────────────────────────────────── */}
        <IdollerSection />

        {/* ── Haberita: Sektörden Haberler ──────────────────────────────── */}
        <HaberitaSection />

        {/* ── Topluluktan Projeler ──────────────────────────────────────── */}
        <section className="py-16 sm:py-24 bg-gray-50 dark:bg-slate-950 border-y border-gray-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-3.5 h-3.5 text-[#66aca9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#66aca9]">Projeler</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
                  Meslektaşlarımız üretiyor.
                </h2>
                <p className="mt-2 text-gray-500 dark:text-slate-400 max-w-xl">
                  Meslektaşlarımızın Sahne veya Haritakademi&apos;den paylaştığı projeler.
                </p>
              </div>
              <a
                href="https://www.linkedin.com/showcase/haritakademi"
                target="_blank" rel="noopener noreferrer"
                className="shrink-0 text-sm font-medium text-[#26496b] dark:text-blue-400 hover:underline"
              >
                Haritakademi&apos;de tümünü gör →
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {([
                {
                  initials: 'SC',
                  avatarColor: 'bg-[#26496b]',
                  author: 'Selinay Civelek',
                  title: 'Akıllı Kazı & Dolgu',
                  tag: 'İnşaat & Mühendislik',
                  tagColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
                  href: 'https://www.linkedin.com/feed/update/urn:li:activity:7459954591409872896',
                  accent: 'from-orange-400 to-orange-600',
                },
                {
                  initials: 'EA',
                  avatarColor: 'bg-[#66aca9]',
                  author: 'Ertan Selçuk Atalay',
                  title: 'AxisTrack: LandXML Survey',
                  tag: 'Ölçme & CBS',
                  tagColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                  href: 'https://www.linkedin.com/feed/update/urn:li:activity:7453806050744651777',
                  accent: 'from-blue-400 to-blue-600',
                },
                {
                  initials: 'HG',
                  avatarColor: 'bg-amber-600',
                  author: 'Hamdi Gündüz',
                  title: 'Veriden Ocağa: Netpromine ile Sıfırdan Açık Ocak Tasarımı',
                  tag: 'Maden & Tasarım',
                  tagColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
                  href: 'https://www.linkedin.com/feed/update/urn:li:activity:7450884103790284802',
                  accent: 'from-amber-400 to-amber-600',
                },
              ] as const).map((p) => (
                <div
                  key={p.href}
                  className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden"
                >
                  {/* Accent bar */}
                  <div className={`h-1 bg-gradient-to-r ${p.accent}`} />

                  <div className="p-5 flex flex-col gap-4 flex-1">
                    {/* Author */}
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-full ${p.avatarColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                        {p.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-900 dark:text-slate-100 truncate">{p.author}</div>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${p.tagColor}`}>{p.tag}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <p className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-snug flex-1">
                      {p.title}
                    </p>

                    {/* LinkedIn link */}
                    <a
                      href={p.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a66c2] hover:underline w-fit"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      LinkedIn&apos;de Gör →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Yetenekler ────────────────────────────────────────────────── */}
        <YeteneklerSection talents={talents} mutfakUrl={MUTFAK_URL} />

        {/* ── Üyelik Tipleri ────────────────────────────────────────────── */}
        <section className="py-16 sm:py-24 dark:bg-[#070c1a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#66aca9] mb-3">Üyelik</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-3">Her aşama için bir yer var.</h2>
            <p className="text-gray-500 dark:text-slate-400 max-w-xl mx-auto mb-12">
              Öğrenciden profesyonele, bireyden kuruma. Sahne herkese açık; Mutfak üyelere özel.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                {
                  tier: 'Haritailesi Genç',
                  who: 'Lise, Önlisans ve Lisans Öğrencileri',
                  price: 'Ücretsiz',
                  priceColor: 'text-emerald-600',
                  features: [
                    'Sahne\'ye tam erişim',
                    'Etkinlikleri takip et ve katıl',
                    'Mentor profillerini incele',
                    'Öğrenci topluluğuna dahil ol',
                  ],
                  note: 'Mesleğin Gelecekleri programı ayrı bir başvuru sürecidir; öğrenci üyeliğin bu programa kabulü anlamına gelmez.',
                  cta: 'Haritailesi Genç\'e Katıl',
                  href: `${WEB_URL}/uye-ol/genç`,
                },
                {
                  tier: 'Mesleğin Değer Ortağı',
                  who: 'Profesyoneller',
                  price: 'Yıllık Üyelik',
                  priceColor: 'text-[#26496b]',
                  features: ['Sahne + Mutfak erişimi', 'Mentorluk programına dahil ol', 'Üye dizini ve profil', 'Proje paylaşımı ve iş birliği'],
                  cta: 'Üye Ol',
                  href: `${WEB_URL}/uye-ol/bireysel`,
                  highlight: true,
                },
                {
                  tier: 'Kurumsal',
                  who: 'SHKM, LİHKAB ve Şirketler',
                  price: 'İletişime Geçin',
                  priceColor: 'text-amber-600',
                  features: ['Marka görünürlüğü', 'Etkinlik sponsorluğu', 'Ekip üyeliği', 'Özel destek'],
                  cta: 'İletişim',
                  href: `${WEB_URL}/uye-ol/kurumsal`,
                },
              ].map((t) => (
                <div
                  key={t.tier}
                  className={`relative flex flex-col rounded-2xl border p-6 text-left bg-white dark:bg-slate-900 ${
                    t.highlight
                      ? 'border-[#26496b] shadow-md ring-1 ring-[#26496b]/20'
                      : 'border-gray-100 dark:border-slate-800 shadow-sm'
                  }`}
                >
                  {t.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-[#26496b] text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Popüler
                      </span>
                    </div>
                  )}
                  <div className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t.who}</div>
                  <div className="text-base font-bold text-gray-900 dark:text-slate-100 mb-2">{t.tier}</div>
                  <div className={`text-2xl font-bold mb-5 ${t.priceColor}`}>{t.price}</div>
                  <ul className="space-y-2 flex-1 mb-4">
                    {t.features.map((f) => (
                      <li key={f} className="flex gap-2 text-sm text-gray-600 dark:text-slate-400">
                        <svg className="w-4 h-4 text-[#66aca9] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {'note' in t && t.note && (
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 leading-relaxed bg-gray-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 mb-4 border border-gray-100 dark:border-slate-700">
                      {t.note}
                    </p>
                  )}
                  <Link
                    href={t.href}
                    target="_blank" rel="noopener noreferrer"
                    className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      t.highlight
                        ? 'bg-[#26496b] text-white hover:bg-[#1d3a57]'
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

        {/* ── Sahne vs Mutfak ───────────────────────────────────────────── */}
        <section className="py-14 sm:py-20 bg-gray-50 dark:bg-slate-950 border-y border-gray-100 dark:border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#66aca9] mb-3">İki Alan, Bir Ekosistem</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
                Sahne&apos;de keşfet, Mutfak&apos;ta üret.
              </h2>
              <p className="mt-3 text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                Sahne herkese açık vitrindir. Mutfak, üreten ve katkı sunan üyelerin çalışma alanı.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Sahne */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-[#26496b] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-slate-100 text-base">Sahne</div>
                    <div className="text-xs text-gray-400 dark:text-slate-500">Herkese açık · Üyelik gerekmez</div>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {[
                    'Etkinlikleri keşfet ve takip et',
                    'Türkiye genelindeki topluluğu gör',
                    'Mentor profillerini incele',
                    'Topluluk nabzını hisset',
                    'Sahneye ilk adımını at',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600 dark:text-slate-400">
                      <svg className="w-4 h-4 text-gray-300 dark:text-slate-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mutfak */}
              <div className="bg-[#26496b]/5 dark:bg-blue-950/30 rounded-2xl border border-[#26496b]/20 dark:border-blue-900/40 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[#26496b] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-slate-100 text-base">Mutfak</div>
                    <div className="text-xs text-[#66aca9]">Üyelere özel · Üretim alanı</div>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {[
                    'İçerik üret ve topluluğunla paylaş',
                    'Projelerde iş birliği yap',
                    'Özel tartışmalara ve forumlara katıl',
                    'Mentorluk ver ya da al',
                    'Profilini oluştur, katkı kademeni kazan',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
                      <svg className="w-4 h-4 text-[#66aca9] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Ekosistem ─────────────────────────────────────────────────── */}
        <section className="py-14 sm:py-20 dark:bg-[#070c1a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#66aca9] mb-3">Haritailesi Ekosistemi</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
                Sahne sadece bir kapı.
              </h2>
              <p className="mt-3 text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                Haritailesi'nin tüm platformlarını keşfet.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  name: 'Haritailesi',
                  desc: 'Vakfın ana sitesi. Misyon, projeler ve topluluğun tüm yüzleri.',
                  href: WEB_URL,
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  accent: 'bg-[#26496b]',
                  badge: 'Ana Site',
                },
                {
                  name: 'Haritakademi',
                  desc: 'Sektörel eğitim, sertifika programları ve mesleki gelişim.',
                  href: 'https://www.linkedin.com/showcase/haritakademi',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  ),
                  accent: 'bg-blue-600',
                  badge: 'LinkedIn',
                },
                {
                  name: 'Haberita',
                  desc: 'Harita, kadastro ve geomatik sektörünün haber merkezi.',
                  href: 'https://haberita.com',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  ),
                  accent: 'bg-amber-600',
                  badge: 'Haberler',
                },
                {
                  name: 'Haritakariyer',
                  desc: 'İş ilanları, kariyer fırsatları ve sektörel işe alım.',
                  href: 'https://www.linkedin.com/showcase/haritakariyer',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                  accent: 'bg-[#66aca9]',
                  badge: 'LinkedIn',
                },
              ].map((p) => (
                <a
                  key={p.name}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                >
                  <div className={`${p.accent} px-5 py-4 flex items-center justify-between`}>
                    <div className="text-white">{p.icon}</div>
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{p.badge}</span>
                  </div>
                  <div className="px-5 py-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <div className="font-bold text-gray-900 dark:text-slate-100 text-sm mb-1">{p.name}</div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{p.desc}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-[#26496b] dark:text-blue-400 group-hover:gap-2 transition-all">
                      Ziyaret et
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-[#26496b] py-16 sm:py-20">
          <div className="absolute inset-0 opacity-5" aria-hidden="true">
            <svg viewBox="0 0 800 300" className="w-full h-full" fill="none">
              <ellipse cx="400" cy="150" rx="380" ry="140" stroke="white" strokeWidth="1.5" />
              <ellipse cx="400" cy="150" rx="260" ry="95" stroke="white" strokeWidth="1.5" />
              <ellipse cx="400" cy="150" rx="155" ry="58" stroke="white" strokeWidth="1.5" />
              <ellipse cx="400" cy="150" rx="75" ry="30" stroke="white" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-[#66aca9] mb-4">Sahne hazır.</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Şimdi sıra sende.
            </h2>
            <p className="text-white/70 mb-8 max-w-lg mx-auto">
              Topluluğun bir parçası ol. Üret, katıl, yönlendir. Gerçek derinlik burada kazanılır.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              <Link
                href={`${WEB_URL}/uye-ol` as `https://${string}`}
                target="_blank" rel="noopener noreferrer"
                className="px-8 py-3.5 bg-white text-[#26496b] font-semibold text-sm rounded-xl hover:bg-gray-100 transition-colors"
              >
                Üye Ol
              </Link>
              <a
                href={MUTFAK_URL}
                target="_blank" rel="noopener noreferrer"
                className="px-8 py-3.5 border-2 border-white/40 text-white font-semibold text-sm rounded-xl hover:border-white/70 hover:bg-white/5 transition-colors"
              >
                Zaten üyeyim — Mutfak&apos;a Gir
              </a>
              <a
                href={`${MUTFAK_URL}/projeler/yeni`}
                target="_blank" rel="noopener noreferrer"
                className="px-8 py-3.5 border-2 border-white/40 text-white font-semibold text-sm rounded-xl hover:border-white/70 hover:bg-white/5 transition-colors"
              >
                Mutfak&apos;ta Oluştur
              </a>
              <ProjeGonderButton label="Projeni Gönder" />
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
                <div className="text-white font-semibold mb-3">Alanlar</div>
                <ul className="space-y-2 text-sm">
                  {[
                    { label: 'Etkinlikler', href: '/etkinlikler' },
                    { label: 'Mentorluk', href: '/mentorluk' },
                    { label: 'Projeler', href: '/projeler' },
                    { label: 'İlan Panosu', href: '/ilanlar' },
                    { label: 'Forum', href: '/forum' },
                  ].map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
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
                      <Link href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <span>© {new Date().getFullYear()} Haritailesi Vakfı. Tüm hakları saklıdır.</span>
              <div className="flex gap-4">
                <Link href={`${WEB_URL}/hakkimizda/tuzuk`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">KVKK</Link>
                <Link href={`${WEB_URL}/iletisim`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">İletişim</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

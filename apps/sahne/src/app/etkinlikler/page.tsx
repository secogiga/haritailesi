import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { PageActionTracker } from '@/components/PageActionTracker';
import { EtkinlikGonderButton } from '@/components/EtkinlikGonder';
import { cms } from '@/lib/api';
import { EventFilters } from './_filters';
import { HeroNewsletterBanner } from '@/components/HeroNewsletterBanner';

export const metadata: Metadata = {
  title: 'Etkinlikler',
  description: 'Haritailesi topluluk etkinlikleri: kongre, webinar, workshop ve networking buluşmaları.',
};

const TYPE_LABELS: Record<string, string> = {
  kongre: 'Kongre', networking: 'Networking', odul: 'Ödül',
  webinar: 'Webinar', calistay: 'Çalıştay', sempozyum: 'Sempozyum', diger: 'Etkinlik',
};

const TYPE_DOT: Record<string, string> = {
  kongre: 'bg-violet-500', networking: 'bg-sky-500', odul: 'bg-amber-500',
  webinar: 'bg-teal-500', calistay: 'bg-emerald-500', sempozyum: 'bg-indigo-500', diger: 'bg-slate-400',
};

export default async function EtkinliklerPage() {
  const allEvents = (await cms.events().catch(() => null)) ?? [];
  const now = new Date();
  const upcoming = allEvents
    .filter(e => new Date(e.dateStart) >= now && !e.isCancelled)
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
  const totalAttendees = allEvents.reduce((sum, e) => sum + (e.attendeeCount ?? 0), 0);
  const types = [...new Set(allEvents.map(e => e.type))];

  // Sağ panel için ilk 3 yaklaşan etkinlik
  const previewEvents = upcoming.slice(0, 3).map(e => {
    const d = new Date(e.dateStart);
    return {
      ...e,
      dayStr: d.toLocaleDateString('tr-TR', { day: '2-digit', timeZone: 'Europe/Istanbul' }),
      monthStr: d.toLocaleDateString('tr-TR', { month: 'short', timeZone: 'Europe/Istanbul' }).toUpperCase().replace('.', ''),
    };
  });

  return (
    <>
      <Navbar />
      <PageActionTracker actionId="v-etkinlikler" />
      <main className="min-h-screen bg-[#f8fafc] dark:bg-[#080d18]">

        {/* ── Hero ── */}
        <section className="relative bg-[#0c1824] overflow-hidden">
          {/* Doku */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#26496b]/30 via-transparent to-[#66aca9]/15 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-14 sm:pt-16 sm:pb-20">
            <div className="flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-16">

              {/* Sol — Başlık */}
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#66aca9] mb-5 bg-[#66aca9]/10 border border-[#66aca9]/20 px-3.5 py-1.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Haritailesi Etkinlikler
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-5">
                  Buluş,<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#66aca9] to-[#4d9996]">Bağlan.</span>
                </h1>

                <p className="text-slate-400 text-base sm:text-lg max-w-md leading-relaxed mb-7">
                  Kongre, workshop, webinar ve networking — topluluğun buluşma noktası.
                </p>

                <div className="flex items-center gap-4">
                  <EtkinlikGonderButton label="Etkinliğini Duyur" variant="outline" />
                  {totalAttendees > 0 && (
                    <span className="text-sm text-slate-500">{totalAttendees}+ katılım</span>
                  )}
                </div>
              </div>

              {/* Sağ — Yaklaşan etkinlikler önizleme */}
              <div className="shrink-0 lg:w-[440px] xl:w-[480px]">
                <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg">
                  {/* Başlık */}
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-slate-700">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-400">
                      Yaklaşan · {upcoming.length} etkinlik
                    </span>
                  </div>

                  {/* Etkinlik listesi */}
                  {previewEvents.length > 0 ? (
                    <div className="divide-y divide-gray-50 dark:divide-slate-700">
                      {previewEvents.map(e => (
                        <div key={e.id} className="flex items-center gap-4 px-5 py-4">
                          <div className="shrink-0 w-11 text-center">
                            <p className="text-xl font-black text-gray-900 dark:text-white leading-none tabular-nums">{e.dayStr}</p>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mt-0.5">{e.monthStr}</p>
                          </div>
                          <div className={`w-0.5 h-8 ${TYPE_DOT[e.type] ?? 'bg-slate-300'} rounded-full shrink-0`} />
                          <p className="text-sm text-gray-700 dark:text-slate-200 font-semibold leading-snug line-clamp-2 flex-1">{e.title}</p>
                        </div>
                      ))}
                      {upcoming.length > 3 && (
                        <div className="px-5 py-3">
                          <p className="text-[11px] text-gray-400 dark:text-slate-500">+{upcoming.length - 3} etkinlik daha</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-5 py-6 text-center">
                      <p className="text-sm text-gray-400 dark:text-slate-500">Yaklaşan etkinlik yok</p>
                    </div>
                  )}

                  {/* Newsletter banner */}
                  <div className="border-t border-gray-100 dark:border-slate-700">
                    <HeroNewsletterBanner
                      count={250}
                      bannerSub="etkinlik ve kongre duyurularını ilk öğreniyor"
                      modalTitle="Etkinlikleri kaçırma"
                      modalSub="Kongre, webinar ve buluşma duyuruları doğrudan e-postana gelsin."
                      variant="light"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Kategori şeridi */}
            {types.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-10 pt-6 border-t border-white/6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Kategoriler</span>
                {types.map(t => (
                  <span key={t} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/5 text-slate-400 border border-white/6">
                    {TYPE_LABELS[t] ?? t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Alt dalga */}
          <div
            className="absolute bottom-0 left-0 right-0 h-8 bg-[#f8fafc] dark:bg-[#080d18]"
            style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }}
          />
        </section>


        {/* ── İçerik ── */}
        {allEvents.length === 0 ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#26496b]/8 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-[#26496b]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-2">Henüz etkinlik yok</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Etkinlikler yakında burada görünecek.</p>
          </div>
        ) : (
          <EventFilters events={allEvents} />
        )}
      </main>
    </>
  );
}

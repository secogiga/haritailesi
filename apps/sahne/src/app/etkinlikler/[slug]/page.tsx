import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { cms, type EventSpeaker, type EventSession, type EventDiscussion } from '@/lib/api';
import { EtkinlikKayitFormu } from '@/components/EtkinlikKayitFormu';
import { DiscussionSection } from '@/components/DiscussionSection';
import { ShareMenu } from '@/components/ShareMenu';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface Props {
  params: Promise<{ slug: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  kongre: 'Kongre', networking: 'Networking', odul: 'Ödül Töreni',
  webinar: 'Webinar', calistay: 'Çalıştay', sempozyum: 'Sempozyum', diger: 'Etkinlik',
};

const TYPE_COLORS: Record<string, string> = {
  kongre: 'bg-violet-100 text-violet-700', networking: 'bg-sky-100 text-sky-700',
  odul: 'bg-amber-100 text-amber-700', webinar: 'bg-teal-100 text-teal-700',
  calistay: 'bg-emerald-100 text-emerald-700', sempozyum: 'bg-indigo-100 text-indigo-700',
  diger: 'bg-gray-100 text-gray-600',
};

const TYPE_HEADER_GRAD: Record<string, string> = {
  kongre: 'from-violet-700 to-violet-500', networking: 'from-sky-700 to-sky-500',
  odul: 'from-amber-600 to-yellow-500', webinar: 'from-teal-700 to-teal-500',
  calistay: 'from-emerald-700 to-emerald-500', sempozyum: 'from-indigo-700 to-indigo-500',
  diger: 'from-slate-700 to-slate-500',
};

function googleCalendarUrl(title: string, start: string, end: string | null, location: string | null, description: string | null) {
  const fmt = (d: string) => new Date(d).toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  const dates = `${fmt(start)}/${fmt(end ?? start)}`;
  const p = new URLSearchParams({ action: 'TEMPLATE', text: title, dates,
    ...(location ? { location } : {}), ...(description ? { details: description } : {}),
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

function icalUrl(title: string, start: string, end: string | null, location: string | null, description: string | null) {
  const fmt = (d: string) => new Date(d).toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`, `DTEND:${fmt(end ?? start)}`, `SUMMARY:${title}`,
    location ? `LOCATION:${location}` : '', description ? `DESCRIPTION:${description}` : '',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines)}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await cms.event(slug);
  if (!event) return { title: 'Etkinlik Bulunamadı' };
  return { title: event.title, description: event.description ?? undefined };
}

export default async function EtkinlikDetayPage({ params }: Props) {
  const { slug } = await params;
  const event = await cms.event(slug);
  if (!event || !event.isPublished) notFound();

  const [speakers, sessions, regQuestions, sponsors, discussion] = await Promise.all([
    cms.eventSpeakers(event.id).catch(() => null),
    cms.eventSessions(event.id).catch(() => null),
    cms.eventRegistrationQuestions(event.id).catch(() => null),
    cms.eventSponsors(event.id).catch(() => null),
    event.mutfakPostId ? cms.eventDiscussion(event.mutfakPostId).catch(() => null) : Promise.resolve(null),
  ]);

  const typeLabel = TYPE_LABELS[event.type] ?? event.type;
  const typeColor = TYPE_COLORS[event.type] ?? TYPE_COLORS['diger']!;
  const headerGrad = TYPE_HEADER_GRAD[event.type] ?? TYPE_HEADER_GRAD['diger']!;
  const isPast = new Date(event.dateStart) < new Date();
  const isFull = event.maxCapacity != null && event.attendeeCount >= event.maxCapacity;
  const isOnline = !!event.meetingUrl && !event.location;
  const fillPct = event.maxCapacity ? Math.min(100, (event.attendeeCount / event.maxCapacity) * 100) : 0;

  const startDate = new Date(event.dateStart);
  const formattedDate = startDate.toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul',
  });
  const formattedTime = startDate.toLocaleTimeString('tr-TR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul',
  });
  const formattedEndDate = event.dateEnd
    ? new Date(event.dateEnd).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' })
    : null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen dark:bg-[#070c1a]">

        {/* Hero — kapak görseli veya gradient */}
        {event.coverImageKey ? (
          <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
            <img
              src={`${API_URL}/api/v1/media?key=${encodeURIComponent(event.coverImageKey!)}`}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
              <Link href="/etkinlikler" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Tüm Etkinlikler
              </Link>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeColor}`}>{typeLabel}</span>
                {isOnline && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/90 text-white">Online</span>}
                {isPast && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">Geçmiş</span>}
                {event.isCancelled && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/90 text-white">İptal Edildi</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">{event.title}</h1>
            </div>
          </div>
        ) : (
          <div className={`relative bg-gradient-to-br ${headerGrad} overflow-hidden`}>
            <div className="absolute inset-0 opacity-10">
              <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                <circle cx="160" cy="20" r="80" fill="white" />
                <circle cx="30" cy="90" r="60" fill="white" />
              </svg>
            </div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
              <Link href="/etkinlikler" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Tüm Etkinlikler
              </Link>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">{typeLabel}</span>
                {isOnline && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/80 text-white">Online</span>}
                {isPast && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">Geçmiş</span>}
                {event.isCancelled && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-400/80 text-white">İptal Edildi</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight max-w-3xl">{event.title}</h1>
            </div>
          </div>
        )}

        {/* İçerik + Sidebar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

            {/* Sol — Ana içerik */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              {event.description && (
                <p className="text-lg text-gray-600 dark:text-slate-400 leading-relaxed mb-8 font-medium">
                  {event.description}
                </p>
              )}
              {event.body && (
                <div className="prose prose-gray dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-[var(--color-mavi)]">
                  <div dangerouslySetInnerHTML={{ __html: event.body }} />
                </div>
              )}
              {!event.description && !event.body && (
                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-10 text-center">
                  <p className="text-gray-400 dark:text-slate-500">Etkinlik detayları yakında eklenecektir.</p>
                </div>
              )}

              {/* Konuşmacılar */}
              {speakers && speakers.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-5">Konuşmacılar</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {speakers.map((sp: EventSpeaker) => (
                      <div key={sp.id} className="flex gap-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4">
                        {sp.avatarUrl ? (
                          <img src={sp.avatarUrl} alt={sp.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-[var(--color-mavi)] text-white flex items-center justify-center text-xl font-bold shrink-0">
                            {sp.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-slate-100 leading-snug">{sp.name}</p>
                          {sp.title && <p className="text-sm text-gray-500 dark:text-slate-400">{sp.title}</p>}
                          {sp.affiliation && <p className="text-sm text-gray-400 dark:text-slate-500">{sp.affiliation}</p>}
                          {sp.bio && <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-3">{sp.bio}</p>}
                          {sp.linkedinUrl && (
                            <a href={sp.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#0a66c2] hover:underline mt-1.5 font-medium">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                              LinkedIn
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gündem */}
              {sessions && sessions.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-5">Program</h2>
                  <div className="space-y-2">
                    {sessions.map((ss: EventSession) => {
                      const isBreak = ss.sessionType === 'break';
                      return (
                        <div key={ss.id} className={`flex gap-4 rounded-2xl px-5 py-4 ${isBreak ? 'bg-gray-50 dark:bg-slate-800/30' : 'bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700'}`}>
                          {ss.startTime && (
                            <div className="text-center w-16 shrink-0 pt-0.5">
                              <p className="text-sm font-bold text-[var(--color-mavi)] dark:text-blue-400">
                                {new Date(ss.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })}
                              </p>
                              {ss.endTime && (
                                <p className="text-[11px] text-gray-400">
                                  {new Date(ss.endTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })}
                                </p>
                              )}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                ss.sessionType === 'keynote' ? 'bg-amber-100 text-amber-700' :
                                ss.sessionType === 'panel' ? 'bg-indigo-100 text-indigo-700' :
                                ss.sessionType === 'workshop' ? 'bg-emerald-100 text-emerald-700' :
                                ss.sessionType === 'break' ? 'bg-gray-100 text-gray-500' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {ss.sessionType === 'keynote' ? 'Açılış' : ss.sessionType === 'panel' ? 'Panel' :
                                 ss.sessionType === 'workshop' ? 'Atölye' : ss.sessionType === 'break' ? 'Ara' : 'Sunum'}
                              </span>
                              {ss.hall && <span className="text-[10px] text-gray-400">📍 {ss.hall}</span>}
                            </div>
                            <p className={`font-semibold leading-snug ${isBreak ? 'text-gray-400 dark:text-slate-500' : 'text-gray-900 dark:text-slate-100'}`}>{ss.title}</p>
                            {ss.speakerName && (
                              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                                {ss.speakerName}
                                {ss.speakerAffiliation ? ` — ${ss.speakerAffiliation}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sponsorlar */}
              {sponsors && sponsors.length > 0 && (
                <div className="mt-10 pt-8 border-t border-gray-100 dark:border-slate-800">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6">Sponsorlar</h2>
                  {/* Tier gruplarına ayır ve sırala */}
                  {(['platin', 'altin', 'gumus', 'bronz'] as const).map(tier => {
                    const TIER_META: Record<string, { label: string; size: string }> = {
                      platin: { label: '💎 Platin Sponsor', size: 'h-20' },
                      altin: { label: '🥇 Altın Sponsor', size: 'h-16' },
                      gumus: { label: '🥈 Gümüş Sponsor', size: 'h-12' },
                      bronz: { label: '🥉 Bronz Sponsor', size: 'h-10' },
                    };
                    const group = sponsors.filter(s => s.tier === tier);
                    if (!group.length) return null;
                    const meta = TIER_META[tier]!;
                    return (
                      <div key={tier} className="mb-6">
                        <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">{meta.label}</p>
                        <div className="flex flex-wrap items-center gap-4">
                          {group.map(sp => (
                            sp.websiteUrl ? (
                              <a key={sp.id} href={sp.websiteUrl} target="_blank" rel="noopener noreferrer"
                                className={`${meta.size} flex items-center bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 px-4 hover:shadow-md transition-shadow`}>
                                {sp.logoKey ? (
                                  <img src={`${API_URL}/api/v1/media?key=${encodeURIComponent(sp.logoKey)}`} alt={sp.companyName} className="max-h-full max-w-[140px] object-contain" />
                                ) : (
                                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{sp.companyName}</span>
                                )}
                              </a>
                            ) : (
                              <div key={sp.id} className={`${meta.size} flex items-center bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 px-4`}>
                                {sp.logoKey ? (
                                  <img src={`${API_URL}/api/v1/media?key=${encodeURIComponent(sp.logoKey)}`} alt={sp.companyName} className="max-h-full max-w-[140px] object-contain" />
                                ) : (
                                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{sp.companyName}</span>
                                )}
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {/* Diğer tier'lar (özel vb.) */}
                  {(() => {
                    const other = sponsors.filter(s => !['platin', 'altin', 'gumus', 'bronz'].includes(s.tier));
                    if (!other.length) return null;
                    return (
                      <div className="mb-6">
                        <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Destekçiler</p>
                        <div className="flex flex-wrap items-center gap-3">
                          {other.map(sp => (
                            <div key={sp.id} className="h-9 flex items-center bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-700 px-3">
                              {sp.logoKey ? (
                                <img src={`${API_URL}/api/v1/media?key=${encodeURIComponent(sp.logoKey)}`} alt={sp.companyName} className="max-h-full max-w-[100px] object-contain" />
                              ) : (
                                <span className="text-xs font-medium text-gray-600 dark:text-slate-400">{sp.companyName}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Mutfak Tartışma Odası */}
              {discussion && (
                <DiscussionSection
                  discussion={discussion}
                  mutfakPostId={event.mutfakPostId!}
                />
              )}

              {/* Sosyal Paylaşım */}
              <div className="mt-10 pt-8 border-t border-gray-100 dark:border-slate-800">
                <ShareMenu title={event.title} />
              </div>
            </div>

            {/* Sağ — Sidebar */}
            <div className="order-1 lg:order-2">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden sticky top-6">
                {/* Sidebar header */}
                <div className={`bg-gradient-to-r ${headerGrad} px-5 py-4`}>
                  <p className="text-xs font-bold text-white/70 uppercase tracking-widest">
                    {isPast ? 'Geçmiş Etkinlik' : event.isCancelled ? 'İptal Edildi' : 'Etkinlik Detayları'}
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  {/* Tarih */}
                  <div className="flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <svg className="w-4.5 h-4.5 text-gray-500 dark:text-slate-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Tarih & Saat</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{formattedDate}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{formattedTime}
                        {formattedEndDate && formattedEndDate !== formattedDate && ` – ${formattedEndDate}`}
                      </p>
                    </div>
                  </div>

                  {/* Lokasyon */}
                  {event.location && (
                    <div className="flex gap-3 items-start">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Konum</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{event.location}</p>
                      </div>
                    </div>
                  )}

                  {/* Online rozet */}
                  {isOnline && (
                    <div className="flex gap-3 items-start">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Format</p>
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Online Etkinlik</p>
                      </div>
                    </div>
                  )}

                  {/* Kapasite */}
                  {event.maxCapacity != null && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">Kapasite</span>
                        <span className={`font-semibold ${isFull ? 'text-orange-500' : 'text-gray-600 dark:text-slate-400'}`}>
                          {event.attendeeCount} / {event.maxCapacity}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${isFull ? 'bg-orange-400' : 'bg-[var(--color-mavi)]'}`}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                      {isFull && (
                        <p className="text-xs text-orange-500 font-medium mt-1">Kapasite dolmuştur.</p>
                      )}
                    </div>
                  )}

                  {/* Ücretli etkinlik fiyat bilgisi */}
                  {(event.price ?? 0) > 0 && (
                    <div className="flex items-center justify-between py-2 px-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                      <div>
                        <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Bilet Fiyatı</p>
                        <p className="text-lg font-black text-amber-700 dark:text-amber-300">₺{((event.price ?? 0) / 100).toFixed(2)}</p>
                      </div>
                      <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9a2 2 0 10-4 0v5a2 2 0 01-2 2h6m-6-4h4m8 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}

                  {/* Kayıt ve katılım butonları */}
                  {!isPast && !event.isCancelled && (
                    <div className="border-t border-gray-100 dark:border-slate-800 pt-4 space-y-2.5">
                      {!isFull && (
                        <>
                          {(event.price ?? 0) > 0 && event.paymentUrl ? (
                            <a
                              href={event.paymentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors shadow-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              Ödeme Yaparak Kayıt Ol
                            </a>
                          ) : (
                            <EtkinlikKayitFormu
                              eventId={event.id}
                              eventTitle={event.title}
                              questions={regQuestions ?? []}
                              label="Kayıt Ol & Bilet Al"
                            />
                          )}
                        </>
                      )}
                      {event.meetingUrl && (
                        <a
                          href={event.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Online Katıl
                        </a>
                      )}
                    </div>
                  )}

                  {/* Takvime ekle */}
                  {!isPast && (
                    <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
                      <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-2">Takvime Ekle</p>
                      <div className="flex gap-2">
                        <a
                          href={googleCalendarUrl(event.title, event.dateStart, event.dateEnd, event.location, event.description)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Google
                        </a>
                        <a
                          href={icalUrl(event.title, event.dateStart, event.dateEnd, event.location, event.description)}
                          download={`${event.slug}.ics`}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          iCal
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}

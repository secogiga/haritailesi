import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cms, type EventSpeaker, type EventSession } from '@/lib/api';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const TYPE_LABELS: Record<string, string> = {
  kongre: 'Kongre', networking: 'Networking', odul: 'Ödül Töreni',
  webinar: 'Webinar', calistay: 'Çalıştay', sempozyum: 'Sempozyum', diger: 'Etkinlik',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await cms.event(slug);
  return {
    title: event?.title ?? 'Etkinlik',
    description: event?.description ?? undefined,
  };
}

function googleCalendarUrl(title: string, start: string, end: string | null, location: string | null, description: string | null) {
  const fmt = (d: string) => new Date(d).toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  const dates = `${fmt(start)}/${fmt(end ?? start)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates,
    ...(location ? { location } : {}),
    ...(description ? { details: description } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function icalUrl(title: string, start: string, end: string | null, location: string | null, description: string | null) {
  const fmt = (d: string) => new Date(d).toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end ?? start)}`,
    `SUMMARY:${title}`,
    location ? `LOCATION:${location}` : '',
    description ? `DESCRIPTION:${description}` : '',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines)}`;
}

export default async function EtkinlikDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await cms.event(slug);
  if (!event) notFound();

  const [speakers, sessions, sponsors] = await Promise.all([
    cms.eventSpeakers(event.id).catch(() => null),
    cms.eventSessions(event.id).catch(() => null),
    cms.eventSponsors(event.id).catch(() => null),
  ]);

  const isFull = event.maxCapacity != null && event.attendeeCount >= event.maxCapacity;
  const isOnline = !!event.meetingUrl && !event.location;
  const isPast = new Date(event.dateStart) < new Date();

  return (
    <main>
      {/* Hero — kapak görseli veya mavi gradient */}
      <section className="relative bg-[var(--color-mavi)] text-white overflow-hidden">
        {event.coverImageKey && (
          <div className="absolute inset-0">
            <img
              src={`${API_URL}/api/v1/media?key=${encodeURIComponent(event.coverImageKey!)}`}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[var(--color-mavi)]/80" />
          </div>
        )}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link href="/etkinlikler" className="text-white/60 hover:text-white text-sm mb-6 inline-flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Tüm Etkinlikler
          </Link>

          {/* Rozetler */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
              {TYPE_LABELS[event.type] ?? event.type}
            </span>
            {isOnline && (
              <span className="px-3 py-1 bg-emerald-500/80 rounded-full text-xs font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Online
              </span>
            )}
            {event.isCancelled && (
              <span className="px-3 py-1 bg-red-500/80 rounded-full text-xs font-semibold">İptal Edildi</span>
            )}
            {isPast && !event.isCancelled && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">Geçmiş</span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-5 leading-tight">{event.title}</h1>

          <div className="flex flex-wrap gap-5 text-white/80 text-sm">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(event.dateStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {event.dateEnd && ` – ${new Date(event.dateEnd).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.location}
              </span>
            )}
            {event.maxCapacity != null && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.attendeeCount} / {event.maxCapacity} katılımcı
                {isFull && ' · Dolu'}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Kapasite bar (kapasiteli etkinliklerde) */}
      {event.maxCapacity != null && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>{event.attendeeCount} kişi katılıyor</span>
              <span className={isFull ? 'text-orange-600 font-medium' : ''}>{isFull ? 'Kapasite doldu' : `${event.maxCapacity - event.attendeeCount} yer kaldı`}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${isFull ? 'bg-orange-400' : 'bg-[var(--color-mavi)]'}`}
                style={{ width: `${Math.min(100, (event.attendeeCount / event.maxCapacity) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* İçerik */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Aksiyon butonları */}
          {!event.isCancelled && (
            <div className="flex flex-wrap gap-3 mb-10">
              {event.registrationUrl && !isFull && !isPast && (
                <a
                  href={event.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-mavi)] text-white font-semibold rounded-xl hover:bg-[var(--color-mavi-acik)] transition-colors"
                >
                  Kayıt Ol
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              {event.meetingUrl && !isPast && (
                <a
                  href={event.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Toplantıya Katıl
                </a>
              )}
              {/* Takvime ekle */}
              {!isPast && (
                <div className="flex items-center gap-2">
                  <a
                    href={googleCalendarUrl(event.title, event.dateStart, event.dateEnd, event.location, event.description)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Google Takvim
                  </a>
                  <a
                    href={icalUrl(event.title, event.dateStart, event.dateEnd, event.location, event.description)}
                    download={`${event.slug}.ics`}
                    className="inline-flex items-center gap-2 px-4 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    iCal
                  </a>
                </div>
              )}
            </div>
          )}

          {/* İçerik */}
          {event.body ? (
            <div className="prose prose-lg prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: event.body }} />
          ) : event.description ? (
            <p className="text-lg text-gray-700 leading-relaxed">{event.description}</p>
          ) : (
            <p className="text-gray-500">Etkinlik detayları yakında eklenecektir.</p>
          )}

          {/* Konuşmacılar */}
          {speakers && speakers.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Konuşmacılar</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {speakers.map((sp: EventSpeaker) => (
                  <div key={sp.id} className="flex gap-4 bg-gray-50 rounded-2xl p-4">
                    {sp.avatarUrl ? (
                      <img src={sp.avatarUrl} alt={sp.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[var(--color-mavi)] text-white flex items-center justify-center text-xl font-bold shrink-0">
                        {sp.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 leading-snug">{sp.name}</p>
                      {sp.title && <p className="text-sm text-gray-500">{sp.title}</p>}
                      {sp.affiliation && <p className="text-sm text-gray-400">{sp.affiliation}</p>}
                      {sp.bio && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-3">{sp.bio}</p>}
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

          {/* Program */}
          {sessions && sessions.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Program</h2>
              <div className="space-y-2">
                {sessions.map((ss: EventSession) => (
                  <div key={ss.id} className="flex gap-4 bg-gray-50 rounded-2xl px-5 py-4">
                    {ss.startTime && (
                      <div className="text-center w-16 shrink-0 pt-0.5">
                        <p className="text-sm font-bold text-[var(--color-mavi)]">
                          {new Date(ss.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })}
                        </p>
                        {ss.endTime && <p className="text-[11px] text-gray-400">{new Date(ss.endTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })}</p>}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {ss.sessionType === 'keynote' ? 'Açılış' : ss.sessionType === 'panel' ? 'Panel' : ss.sessionType === 'break' ? 'Ara' : 'Sunum'}
                        </span>
                        {ss.hall && <span className="text-[10px] text-gray-400">📍 {ss.hall}</span>}
                      </div>
                      <p className="font-semibold text-gray-900 leading-snug">{ss.title}</p>
                      {ss.speakerName && <p className="text-sm text-gray-500 mt-0.5">{ss.speakerName}{ss.speakerAffiliation ? ` — ${ss.speakerAffiliation}` : ''}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sponsorlar */}
          {sponsors && sponsors.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Sponsorlar</h2>
              {(['altin', 'gumus', 'bronz'] as const).map(tier => {
                const meta: Record<string, { label: string; h: string }> = {
                  altin: { label: '🥇 Altın Sponsor', h: 'h-16' },
                  gumus: { label: '🥈 Gümüş Sponsor', h: 'h-12' },
                  bronz: { label: '🥉 Bronz Sponsor', h: 'h-10' },
                };
                const group = sponsors.filter(s => s.tier === tier);
                if (!group.length) return null;
                return (
                  <div key={tier} className="mb-6">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{meta[tier]!.label}</p>
                    <div className="flex flex-wrap items-center gap-4">
                      {group.map(sp => (
                        <div key={sp.id} className={`${meta[tier]!.h} flex items-center bg-white rounded-xl border border-gray-100 px-4 ${sp.websiteUrl ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}
                          onClick={() => sp.websiteUrl && window.open(sp.websiteUrl, '_blank', 'noopener')}>
                          {sp.logoKey
                            ? <img src={`${API_URL}/api/v1/media?key=${encodeURIComponent(sp.logoKey)}`} alt={sp.companyName} className="max-h-full max-w-[140px] object-contain" />
                            : <span className="text-sm font-semibold text-gray-700">{sp.companyName}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {(() => {
                const other = sponsors.filter(s => !['altin', 'gumus', 'bronz'].includes(s.tier));
                if (!other.length) return null;
                return (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Destekçiler</p>
                    <div className="flex flex-wrap gap-3">
                      {other.map(sp => (
                        <div key={sp.id} className="h-9 flex items-center bg-gray-50 rounded-lg border border-gray-100 px-3">
                          {sp.logoKey
                            ? <img src={`${API_URL}/api/v1/media?key=${encodeURIComponent(sp.logoKey)}`} alt={sp.companyName} className="max-h-full max-w-[100px] object-contain" />
                            : <span className="text-xs font-medium text-gray-600">{sp.companyName}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Sosyal Paylaşım */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-500 mb-3">Bu etkinliği paylaş</p>
            <div className="flex gap-2">
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://haritailesi.org/etkinlikler/${event.slug}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0a66c2] hover:bg-[#004182] rounded-xl transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}&url=${encodeURIComponent(`https://haritailesi.org/etkinlikler/${event.slug}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-xl transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.736l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                X (Twitter)
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

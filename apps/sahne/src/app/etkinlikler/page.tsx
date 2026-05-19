import Link from 'next/link';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { cms, type CmsEvent } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Etkinlikler',
  description: 'Haritailesi topluluk etkinlikleri: kongre, webinar, workshop ve networking buluşmaları.',
};

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

export default async function EtkinliklerPage() {
  const allEvents = (await cms.events().catch(() => null)) ?? [];
  const now = new Date();
  const upcoming = allEvents.filter((e) => new Date(e.dateStart) >= now);
  const past = allEvents.filter((e) => new Date(e.dateStart) < now);

  return (
    <>
      <Navbar />
      <main className="min-h-screen dark:bg-[#070c1a]">
        {/* Hero */}
        <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-teal)] mb-3">
              Sahne Modülleri
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">
              Etkinlikler
            </h1>
            <p className="text-gray-500 dark:text-slate-400 max-w-2xl">
              Kongre, workshop ve networking etkinliklerini takip edin, kayıt olun.
            </p>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-5 flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  Yaklaşan Etkinlikler
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {upcoming.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-5">
                  Geçmiş Etkinlikler
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 opacity-70">
                  {past.map((event) => (
                    <EventCard key={event.id} event={event} past />
                  ))}
                </div>
              </div>
            )}

            {allEvents.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Henüz etkinlik yok</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">Etkinlikler yakında burada görünecek.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function EventCard({ event, past = false }: { event: CmsEvent; past?: boolean }) {
  const typeLabel = TYPE_LABELS[event.type] ?? event.type;
  const typeColor = TYPE_COLORS[event.type] ?? TYPE_COLORS['diger'];

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700 transition-all p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeColor}`}>
          {typeLabel}
        </span>
        <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">
          {new Date(event.dateStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
      <h2 className={`text-base font-semibold text-gray-900 dark:text-slate-100 mb-2 leading-snug flex-1 ${past ? 'line-through decoration-gray-300' : ''}`}>
        {event.title}
      </h2>
      {event.location && (
        <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1 mt-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {event.location}
        </p>
      )}
      {event.description && (
        <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mt-3 line-clamp-2">
          {event.description}
        </p>
      )}
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center gap-3">
        {event.registrationUrl && !past && (
          <a
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] px-4 py-1.5 rounded-lg transition-colors"
          >
            Kayıt Ol
          </a>
        )}
        <Link
          href={`/etkinlikler/${event.slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-mavi)] dark:text-blue-400 hover:gap-2 transition-all"
        >
          Detaylar
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

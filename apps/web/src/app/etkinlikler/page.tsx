import type { Metadata } from 'next';
import Link from 'next/link';
import { cms, type CmsEvent } from '@/lib/api';

export const metadata: Metadata = { title: 'Etkinlikler' };

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
  kongre: 'bg-blue-100 text-blue-700',
  networking: 'bg-teal-100 text-teal-700',
  odul: 'bg-amber-100 text-amber-700',
  webinar: 'bg-purple-100 text-purple-700',
  calistay: 'bg-orange-100 text-orange-700',
  sempozyum: 'bg-indigo-100 text-indigo-700',
  diger: 'bg-gray-100 text-gray-600',
};

function EventCard({ event, isPast = false }: { event: CmsEvent; isPast?: boolean }) {
  return (
    <Link
      href={`/etkinlikler/${event.slug}`}
      className={`group bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow p-6 ${isPast ? 'border-gray-100 opacity-75 hover:opacity-100' : 'border-gray-100'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[event.type] ?? TYPE_COLORS.diger}`}>
          {TYPE_LABELS[event.type] ?? event.type}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(event.dateStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>
      <h3 className={`text-lg font-bold leading-snug transition-colors ${isPast ? 'text-gray-700 group-hover:text-[var(--color-mavi)]' : 'text-gray-900 group-hover:text-[var(--color-mavi)]'}`}>
        {event.title}
      </h3>
      {event.location && (
        <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {event.location}
        </p>
      )}
      {event.description && (
        <p className="text-sm text-gray-600 mt-3 line-clamp-2">{event.description}</p>
      )}
    </Link>
  );
}

export default async function EtkinliklerPage() {
  const events = await cms.events();
  const now = new Date();

  const upcoming = (events ?? [])
    .filter((e) => new Date(e.dateStart) >= now)
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());

  const past = (events ?? [])
    .filter((e) => new Date(e.dateStart) < now)
    .sort((a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime());

  return (
    <main>
      <section className="bg-[var(--color-mavi)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-3">Etkinlikler</h1>
          <p className="text-white/70 text-lg">Kongreler, networking buluşmaları ve ödül törenleri</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">

          {/* Yaklaşan */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <h2 className="text-xl font-bold text-gray-900">Yaklaşan Etkinlikler</h2>
            </div>
            {upcoming.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-10 text-center">
                <p className="text-gray-500">Yaklaşan etkinlik bulunmamaktadır.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>

          {/* Geçmiş */}
          {past.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Geçmiş Etkinlikler</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {past.map((event) => (
                  <EventCard key={event.id} event={event} isPast />
                ))}
              </div>
            </div>
          )}

        </div>
      </section>
    </main>
  );
}

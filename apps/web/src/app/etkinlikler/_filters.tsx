'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { CmsEvent } from '@/lib/api';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const TYPE_LABELS: Record<string, string> = {
  kongre: 'Kongre', networking: 'Networking', odul: 'Ödül Töreni',
  webinar: 'Webinar', calistay: 'Çalıştay', sempozyum: 'Sempozyum', diger: 'Etkinlik',
};
const TYPE_COLORS: Record<string, string> = {
  kongre: 'bg-blue-100 text-blue-700', networking: 'bg-teal-100 text-teal-700',
  odul: 'bg-amber-100 text-amber-700', webinar: 'bg-purple-100 text-purple-700',
  calistay: 'bg-orange-100 text-orange-700', sempozyum: 'bg-indigo-100 text-indigo-700',
  diger: 'bg-gray-100 text-gray-600',
};

function EventCard({ event, isPast = false }: { event: CmsEvent; isPast?: boolean }) {
  const isFull = event.maxCapacity != null && event.attendeeCount >= event.maxCapacity;
  const isOnline = !!event.meetingUrl && !event.location;

  return (
    <Link
      href={`/etkinlikler/${event.slug}`}
      className={`group bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col ${isPast ? 'border-gray-100 opacity-75 hover:opacity-100' : 'border-gray-100'}`}
    >
      {event.coverImageKey ? (
        <div className="h-44 overflow-hidden shrink-0">
          <img
            src={`${API_URL}/api/v1/media?key=${encodeURIComponent(event.coverImageKey!)}`}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className={`h-2 shrink-0 ${isPast ? 'bg-gray-200' : 'bg-[var(--color-mavi)]'}`} />
      )}

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[event.type] ?? TYPE_COLORS.diger}`}>
            {TYPE_LABELS[event.type] ?? event.type}
          </span>
          {isOnline && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Online
            </span>
          )}
          {event.isCancelled && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">İptal</span>}
          {isFull && !isPast && !event.isCancelled && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-600">Dolu</span>}
        </div>

        <p className="text-xs text-gray-400 mb-1.5">
          {new Date(event.dateStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h3 className="text-base font-bold leading-snug text-gray-900 group-hover:text-[var(--color-mavi)] transition-colors mb-2">
          {event.title}
        </h3>
        {event.location && (
          <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.location}
          </p>
        )}
        {event.description && <p className="text-sm text-gray-500 line-clamp-2 mt-1">{event.description}</p>}

        {event.maxCapacity != null && (
          <div className="mt-auto pt-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>{event.attendeeCount} katılımcı</span>
              <span>{event.maxCapacity} kapasite</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${isFull ? 'bg-orange-400' : 'bg-[var(--color-mavi)]'}`}
                style={{ width: `${Math.min(100, (event.attendeeCount / event.maxCapacity) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export function EventFilters({ events }: { events: CmsEvent[] }) {
  const [typeFilter, setTypeFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'online' | 'yuzyuze'>('all');

  const now = new Date();

  const filtered = useMemo(() => events.filter((e) => {
    if (typeFilter && e.type !== typeFilter) return false;
    if (formatFilter === 'online' && !(!!e.meetingUrl && !e.location)) return false;
    if (formatFilter === 'yuzyuze' && !e.location) return false;
    return true;
  }), [events, typeFilter, formatFilter]);

  const upcoming = filtered.filter(e => new Date(e.dateStart) >= now && !e.isCancelled)
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
  const past = filtered.filter(e => new Date(e.dateStart) < now || e.isCancelled)
    .sort((a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime());

  const types = [...new Set(events.map(e => e.type))];

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filtreler */}
        <div className="flex flex-wrap gap-2 mb-10">
          {/* Tür */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setTypeFilter('')}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${!typeFilter ? 'bg-[var(--color-mavi)] text-white border-[var(--color-mavi)]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
            >
              Tümü
            </button>
            {types.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${typeFilter === t ? 'bg-[var(--color-mavi)] text-white border-[var(--color-mavi)]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
              >
                {TYPE_LABELS[t] ?? t}
              </button>
            ))}
          </div>

          {/* Format */}
          <div className="flex gap-1.5 ml-auto">
            {(['all', 'online', 'yuzyuze'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFormatFilter(f)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${formatFilter === f ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
              >
                {f === 'all' ? 'Tüm Format' : f === 'online' ? '🖥 Online' : '📍 Yüz Yüze'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-14">
          {/* Yaklaşan */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <h2 className="text-xl font-bold text-gray-900">Yaklaşan Etkinlikler</h2>
              <span className="text-sm text-gray-400">{upcoming.length} etkinlik</span>
            </div>
            {upcoming.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-10 text-center">
                <p className="text-gray-500">Bu kriterlere uygun yaklaşan etkinlik bulunmamaktadır.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcoming.map(e => <EventCard key={e.id} event={e} />)}
              </div>
            )}
          </div>

          {/* Geçmiş */}
          {past.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Geçmiş Etkinlikler</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {past.map(e => <EventCard key={e.id} event={e} isPast />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

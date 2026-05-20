'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mutfakApi, type CmsEvent } from '@/lib/api';
import { useToken } from '@/hooks/useToken';
import { useAuth } from '@/contexts/AuthContext';

const EVENT_TYPE_LABELS: Record<string, string> = {
  kongre: 'Kongre',
  networking: 'Networking',
  odul: 'Ödül',
  diger: 'Diğer',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  kongre: 'bg-blue-50 text-blue-700 border-blue-200',
  networking: 'bg-teal-50 text-teal-700 border-teal-200',
  odul: 'bg-amber-50 text-amber-700 border-amber-200',
  diger: 'bg-gray-50 text-gray-600 border-gray-200',
};

function formatEventDate(start: string, end: string | null) {
  const s = new Date(start);
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: 'Europe/Istanbul',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  const startStr = s.toLocaleDateString('tr-TR', opts);
  if (!end) return startStr;
  const e = new Date(end);
  if (s.toDateString() === e.toDateString()) return startStr;
  return `${startStr} – ${e.toLocaleDateString('tr-TR', opts)}`;
}

function formatEventTime(iso: string) {
  return new Date(iso).toLocaleTimeString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isPast(iso: string) {
  return new Date(iso) < new Date();
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({
  event,
  isRsvpd,
  onRsvp,
  onCancelRsvp,
  rsvpBusy,
}: {
  event: CmsEvent;
  isRsvpd: boolean;
  onRsvp: (id: string) => void;
  onCancelRsvp: (id: string) => void;
  rsvpBusy: boolean;
}) {
  const past = isPast(event.dateStart);
  const typeColor = EVENT_TYPE_COLORS[event.type] ?? EVENT_TYPE_COLORS.diger;
  const typeLabel = EVENT_TYPE_LABELS[event.type] ?? event.type;
  const isFull = event.maxCapacity != null && event.attendeeCount >= event.maxCapacity;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {event.coverImageKey && (
        <div className="h-36 bg-gray-100 overflow-hidden">
          <img
            src={`/api/v1/media/${event.coverImageKey}`}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border ${typeColor}`}>
                {typeLabel}
              </span>
              {event.isCancelled && (
                <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
                  İptal Edildi
                </span>
              )}
              {past && !event.isCancelled && (
                <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                  Geçmiş
                </span>
              )}
              {isFull && !past && !event.isCancelled && (
                <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200">
                  Dolu
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 leading-snug">{event.title}</h3>

            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatEventDate(event.dateStart, event.dateEnd)}
                {' · '}
                {formatEventTime(event.dateStart)}
              </p>
              {event.location && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {event.location}
                </p>
              )}
            </div>

            {event.description && (
              <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">{event.description}</p>
            )}

            {event.attendeeCount > 0 && (
              <p className="mt-1.5 text-xs text-gray-400">
                {event.attendeeCount} katılımcı
                {event.maxCapacity != null && ` / ${event.maxCapacity} kapasite`}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {!past && !event.isCancelled && (
            isRsvpd ? (
              <button
                disabled={rsvpBusy}
                onClick={() => onCancelRsvp(event.id)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#26496b] bg-[#26496b]/8 border border-[#26496b]/20 rounded-xl hover:bg-[#26496b]/12 transition-colors disabled:opacity-60"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Katılıyorum
              </button>
            ) : isFull ? (
              <span className="px-4 py-2 text-sm font-medium text-gray-400 border border-gray-200 rounded-xl cursor-not-allowed">
                Kapasite Dolu
              </span>
            ) : (
              <button
                disabled={rsvpBusy}
                onClick={() => onRsvp(event.id)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56] transition-colors disabled:opacity-60"
              >
                Katıl
              </button>
            )
          )}

          {event.meetingUrl && !past && (
            <a
              href={event.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Toplantıya Gir
            </a>
          )}

          {event.registrationUrl && (
            <a
              href={event.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Kayıt Ol
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────

export default function EtkinliklerPage() {
  const { user } = useAuth();
  const token = useToken();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('');
  const [rsvpBusyId, setRsvpBusyId] = useState<string | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', typeFilter],
    queryFn: () => mutfakApi.listEvents(typeFilter || undefined),
    staleTime: 5 * 60_000,
  });

  const { data: myRsvps = [] } = useQuery({
    queryKey: ['my-rsvps'],
    queryFn: () => mutfakApi.getMyRsvps(token),
    enabled: !!token,
    staleTime: 5 * 60_000,
  });

  const rsvpSet = new Set(myRsvps);

  async function handleRsvp(eventId: string) {
    if (!token) return;
    setRsvpBusyId(eventId);
    try {
      await mutfakApi.rsvpEvent(eventId, token);
      void queryClient.invalidateQueries({ queryKey: ['my-rsvps'] });
    } finally {
      setRsvpBusyId(null);
    }
  }

  async function handleCancelRsvp(eventId: string) {
    if (!token) return;
    setRsvpBusyId(eventId);
    try {
      await mutfakApi.cancelRsvpEvent(eventId, token);
      void queryClient.invalidateQueries({ queryKey: ['my-rsvps'] });
    } finally {
      setRsvpBusyId(null);
    }
  }

  const upcoming = events.filter((e) => !isPast(e.dateStart));
  const past = events.filter((e) => isPast(e.dateStart));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 font-display">Etkinlikler</h1>
        <p className="text-sm text-gray-500 mt-0.5">Topluluk buluşmaları, kongreler ve networkinglere katılın</p>
      </div>

      {/* Tür filtresi */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'kongre', 'networking', 'odul', 'diger'].map((t) => (
          <button
            key={t || 'all'}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              typeFilter === t
                ? 'bg-[#26496b] text-white border-[#26496b]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {t ? (EVENT_TYPE_LABELS[t] ?? t) : 'Tümü'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-1" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <p className="text-sm font-medium text-gray-500 mb-1">Etkinlik bulunamadı</p>
          <p className="text-xs text-gray-400">Yakında yeni etkinlikler duyurulacak.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 pl-1">
                Yaklaşan Etkinlikler
              </p>
              <div className="space-y-3">
                {upcoming.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isRsvpd={rsvpSet.has(event.id)}
                    onRsvp={(id) => void handleRsvp(id)}
                    onCancelRsvp={(id) => void handleCancelRsvp(id)}
                    rsvpBusy={rsvpBusyId === event.id}
                  />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 pl-1">
                Geçmiş Etkinlikler
              </p>
              <div className="space-y-3">
                {past.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isRsvpd={rsvpSet.has(event.id)}
                    onRsvp={(id) => void handleRsvp(id)}
                    onCancelRsvp={(id) => void handleCancelRsvp(id)}
                    rsvpBusy={rsvpBusyId === event.id}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

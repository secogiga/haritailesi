'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mutfakApi, type CmsEvent } from '@/lib/api';
import { useToken } from '@/hooks/useToken';
import { useAuth } from '@/contexts/AuthContext';

type Session = { id: string; title: string; sessionType: string; startTime: string | null; endTime: string | null; speakerName: string | null; hall: string | null; sortOrder: number };

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
  favoritedSessions,
  onFavorite,
}: {
  event: CmsEvent & { sessions?: Session[] | undefined };
  isRsvpd: boolean;
  onRsvp: (id: string) => void;
  onCancelRsvp: (id: string) => void;
  rsvpBusy: boolean;
  favoritedSessions: Set<string>;
  onFavorite: (sessionId: string) => void;
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
            src={`/api/v1/media?key=${encodeURIComponent(event.coverImageKey!)}`}
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

        {/* Program (sessions) */}
        {event.sessions && event.sessions.length > 0 && (
          <div className="mt-3 border-t border-gray-100 pt-3 space-y-1.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Program</p>
            {event.sessions.map((ss: Session) => (
              <div key={ss.id} className="flex items-start gap-2.5">
                {ss.startTime && (
                  <span className="text-[10px] font-medium text-[#26496b] w-10 shrink-0 mt-0.5">
                    {new Date(ss.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-gray-800 leading-snug truncate">{ss.title}</p>
                    <button
                      onClick={() => onFavorite(ss.id)}
                      disabled={!onFavorite}
                      className={`shrink-0 p-1 rounded transition-colors ${favoritedSessions.has(ss.id) ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
                      title={favoritedSessions.has(ss.id) ? 'Favoriden çıkar' : 'Favoriye ekle'}
                    >
                      <svg className="w-3.5 h-3.5" fill={favoritedSessions.has(ss.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  </div>
                  {ss.speakerName && <p className="text-[10px] text-gray-400 truncate">{ss.speakerName}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

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

type RegQuestion = { id: string; question: string; questionType: string; options: string[] | null; isRequired: boolean };

function RsvpQuestionsModal({
  questions, onSubmit, onClose, busy,
}: {
  questions: RegQuestion[];
  onSubmit: (answers: Record<string, string>) => void;
  onClose: () => void;
  busy: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const set = (id: string, v: string) => setAnswers(a => ({ ...a, [id]: v }));
  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] bg-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Katılım Bilgileri</h3>
            <p className="text-xs text-gray-400 mt-0.5">Lütfen aşağıdaki soruları yanıtlayın.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {questions.map(q => (
            <div key={q.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {q.question}{q.isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              {q.questionType === 'select' && q.options ? (
                <select className={inp} value={answers[q.id] ?? ''} onChange={e => set(q.id, e.target.value)}>
                  <option value="">Seçin…</option>
                  {q.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : q.questionType === 'checkbox' ? (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={answers[q.id] === 'evet'} onChange={e => set(q.id, e.target.checked ? 'evet' : 'hayır')} className="rounded" />
                  Evet
                </label>
              ) : (
                <input type="text" className={inp} value={answers[q.id] ?? ''} onChange={e => set(q.id, e.target.value)} placeholder="Yanıtınız…" />
              )}
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">İptal</button>
          <button
            disabled={busy}
            onClick={() => {
              const missing = questions.filter(q => q.isRequired && !answers[q.id]?.trim());
              if (missing.length) return;
              onSubmit(answers);
            }}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1e3a56] rounded-xl disabled:opacity-60"
          >
            {busy ? 'Kaydediliyor…' : 'Katıl'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EtkinliklerPage() {
  const { user } = useAuth();
  const token = useToken();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('');
  const [rsvpBusyId, setRsvpBusyId] = useState<string | null>(null);
  const [questionModal, setQuestionModal] = useState<{ eventId: string; questions: RegQuestion[] } | null>(null);
  const [favoritedSessions, setFavoritedSessions] = useState<Set<string>>(new Set());
  const [eventSessions, setEventSessions] = useState<Record<string, Session[]>>({});

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

  async function doRsvp(eventId: string, answers?: Record<string, string>) {
    if (!token) return;
    setRsvpBusyId(eventId);
    try {
      const result = await mutfakApi.rsvpEvent(eventId, token) as { attendanceId?: string };
      // Cevaplar varsa kaydet
      if (answers && result?.attendanceId) {
        const answerList = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
        if (answerList.length) {
          await mutfakApi.submitRegistrationAnswers(result.attendanceId, answerList, token).catch(() => {});
        }
      }
      void queryClient.invalidateQueries({ queryKey: ['my-rsvps'] });
    } finally {
      setRsvpBusyId(null);
      setQuestionModal(null);
    }
  }

  async function handleToggleFavorite(sessionId: string) {
    if (!token) return;
    try {
      const res = await mutfakApi.toggleSessionFavorite(sessionId, token);
      setFavoritedSessions(prev => {
        const next = new Set(prev);
        if (res.favorited) next.add(sessionId); else next.delete(sessionId);
        return next;
      });
    } catch { /* ignore */ }
  }

  // Etkinliklerin session'larını yükle
  useEffect(() => {
    if (!events.length) return;
    events.forEach(ev => {
      if (eventSessions[ev.id]) return;
      const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
      fetch(`${API_URL}/api/v1/cms/events/${ev.id}/sessions`)
        .then(r => r.ok ? r.json() as Promise<Session[]> : [])
        .then(sessions => {
          if (sessions.length) setEventSessions(prev => ({ ...prev, [ev.id]: sessions }));
          // Favori bilgisi
          if (token && sessions.length) {
            mutfakApi.getMySessionFavorites(ev.id, token)
              .then(ids => setFavoritedSessions(prev => new Set([...prev, ...ids])))
              .catch(() => {});
          }
        })
        .catch(() => {});
    });
  }, [events, token]); // eslint-disable-line

  async function handleRsvp(eventId: string) {
    if (!token) return;
    // Kayıt soruları var mı kontrol et
    const questions = await mutfakApi.getEventRegistrationQuestions(eventId).catch(() => []) ?? [];
    if (questions.length > 0) {
      setQuestionModal({ eventId, questions });
    } else {
      await doRsvp(eventId);
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
      {questionModal && (
        <RsvpQuestionsModal
          questions={questionModal.questions}
          busy={rsvpBusyId === questionModal.eventId}
          onClose={() => setQuestionModal(null)}
          onSubmit={(answers) => void doRsvp(questionModal.eventId, answers)}
        />
      )}
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
                    event={{ ...event, ...(eventSessions[event.id] ? { sessions: eventSessions[event.id] } : {}) }}
                    isRsvpd={rsvpSet.has(event.id)}
                    onRsvp={(id) => void handleRsvp(id)}
                    onCancelRsvp={(id) => void handleCancelRsvp(id)}
                    rsvpBusy={rsvpBusyId === event.id}
                    favoritedSessions={favoritedSessions}
                    onFavorite={(sid) => void handleToggleFavorite(sid)}
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
                    event={{ ...event, ...(eventSessions[event.id] ? { sessions: eventSessions[event.id] } : {}) }}
                    isRsvpd={rsvpSet.has(event.id)}
                    onRsvp={(id) => void handleRsvp(id)}
                    onCancelRsvp={(id) => void handleCancelRsvp(id)}
                    rsvpBusy={rsvpBusyId === event.id}
                    favoritedSessions={favoritedSessions}
                    onFavorite={(sid) => void handleToggleFavorite(sid)}
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

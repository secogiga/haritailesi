'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { CmsEvent } from '@/lib/api';
import { useSahneAuth } from '@/contexts/SahneAuthContext';
import { EtkinlikGonderButton } from '@/components/EtkinlikGonder';

const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';
const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

// ─── Tür konfigürasyonu ───────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  kongre: 'Kongre', networking: 'Networking', odul: 'Ödül Töreni',
  webinar: 'Webinar', calistay: 'Çalıştay', sempozyum: 'Sempozyum', diger: 'Etkinlik',
};

const TYPE_CONFIG: Record<string, { bg: string; pill: string; dot: string }> = {
  kongre:     { bg: 'bg-violet-600',  dot: 'bg-violet-500',  pill: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  networking: { bg: 'bg-sky-600',     dot: 'bg-sky-500',     pill: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
  odul:       { bg: 'bg-amber-500',   dot: 'bg-amber-500',   pill: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  webinar:    { bg: 'bg-teal-600',    dot: 'bg-teal-500',    pill: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
  calistay:   { bg: 'bg-emerald-600', dot: 'bg-emerald-500', pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  sempozyum:  { bg: 'bg-indigo-600',  dot: 'bg-indigo-500',  pill: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  diger:      { bg: 'bg-slate-600',   dot: 'bg-slate-400',   pill: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
};

function getConf(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG['diger']!;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useEventFavorites() {
  const [favs, setFavs] = useState<string[]>([]);
  useEffect(() => {
    try { const s = localStorage.getItem('hls_event_favs'); if (s) setFavs(JSON.parse(s) as string[]); } catch {}
  }, []);
  const toggle = useCallback((id: string) => {
    setFavs(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try { localStorage.setItem('hls_event_favs', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  return { favs, toggle, isFav: (id: string) => favs.includes(id) };
}

function useEventReminders() {
  const [reminders, setReminders] = useState<string[]>([]);
  useEffect(() => {
    try { const s = localStorage.getItem('hls_event_reminders'); if (s) setReminders(JSON.parse(s) as string[]); } catch {}
  }, []);
  const toggle = useCallback((id: string) => {
    setReminders(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try { localStorage.setItem('hls_event_reminders', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  return { reminders, toggle, hasReminder: (id: string) => reminders.includes(id) };
}

// ─── Tarih yardımcısı ─────────────────────────────────────────────────────────

function parseDate(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString('tr-TR', { day: '2-digit', timeZone: 'Europe/Istanbul' }),
    month: d.toLocaleDateString('tr-TR', { month: 'short', timeZone: 'Europe/Istanbul' }).toUpperCase().replace('.', ''),
    year: d.toLocaleDateString('tr-TR', { year: 'numeric', timeZone: 'Europe/Istanbul' }),
    full: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }),
    time: d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }),
    daysUntil: Math.ceil((d.getTime() - Date.now()) / 86400000),
  };
}

// ─── Öne Çıkan Kart ──────────────────────────────────────────────────────────

function FeaturedCard({
  event, isFav, onFavToggle, hasReminder, onReminderToggle,
}: {
  event: CmsEvent; isFav: boolean; onFavToggle: () => void;
  hasReminder: boolean; onReminderToggle: () => void;
}) {
  const { user } = useSahneAuth();
  const conf = getConf(event.type);
  const date = parseDate(event.dateStart);
  const isFull = event.maxCapacity != null && event.attendeeCount >= event.maxCapacity;
  const isOnline = !!event.meetingUrl && !event.location;

  function guard(fn: () => void) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      if (!user) { window.location.href = `${MUTFAK_URL}/giris`; return; }
      fn();
    };
  }

  return (
    <Link
      href={`/etkinlikler/${event.slug}`}
      className="group relative flex flex-col md:flex-row bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-[#26496b]/8 transition-all duration-300"
    >
      {/* Görsel */}
      <div className={`relative md:w-72 lg:w-80 shrink-0 min-h-[200px] bg-gradient-to-br ${conf.bg === 'bg-violet-600' ? 'from-violet-600 to-violet-500' : conf.bg === 'bg-sky-600' ? 'from-sky-600 to-sky-500' : conf.bg === 'bg-teal-600' ? 'from-teal-600 to-teal-500' : conf.bg === 'bg-emerald-600' ? 'from-emerald-600 to-emerald-500' : conf.bg === 'bg-indigo-600' ? 'from-indigo-600 to-indigo-500' : conf.bg === 'bg-amber-500' ? 'from-amber-500 to-amber-400' : 'from-slate-600 to-slate-500'} overflow-hidden`}>
        {event.coverImageKey ? (
          <>
            <img
              src={`${API_URL}/api/v1/media?key=${encodeURIComponent(event.coverImageKey)}`}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 opacity-15">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
              <circle cx="80" cy="20" r="55" fill="white" />
              <circle cx="5" cy="90" r="40" fill="white" />
            </svg>
          </div>
        )}

        {/* Tarih rozeti */}
        <div className="absolute top-4 left-4 bg-white/95 dark:bg-slate-900/90 rounded-2xl px-3.5 py-2.5 text-center shadow backdrop-blur-sm">
          <p className="text-2xl font-black text-gray-900 dark:text-slate-100 leading-none">{date.day}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">{date.month} {date.year}</p>
        </div>

        {/* Öne Çıkan etiketi */}
        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/20">
          Öne Çıkan
        </div>
      </div>

      {/* İçerik */}
      <div className="flex flex-col flex-1 p-6 lg:p-8">
        {/* Etiketler */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${conf.pill}`}>
            {TYPE_LABELS[event.type] ?? event.type}
          </span>
          {isOnline && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Online
            </span>
          )}
          {date.daysUntil >= 0 && date.daysUntil <= 7 && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              {date.daysUntil === 0 ? 'Bugün!' : date.daysUntil === 1 ? 'Yarın!' : `${date.daysUntil} gün kaldı`}
            </span>
          )}
          {event.isCancelled && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-700">İptal Edildi</span>
          )}
        </div>

        <h2 className="text-xl lg:text-2xl font-black text-gray-900 dark:text-slate-100 leading-tight mb-3 group-hover:text-[#26496b] dark:group-hover:text-blue-400 transition-colors">
          {event.title}
        </h2>

        {event.description && (
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-5 line-clamp-2 flex-1">
            {event.description}
          </p>
        )}

        {/* Meta */}
        <div className="space-y-1.5 mb-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <svg className="w-3.5 h-3.5 shrink-0 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {date.full} · {date.time}
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
              <svg className="w-3.5 h-3.5 shrink-0 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {event.location}
            </div>
          )}
          {event.attendeeCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
              <svg className="w-3.5 h-3.5 shrink-0 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
              </svg>
              {event.attendeeCount} katılımcı{event.maxCapacity ? ` / ${event.maxCapacity}` : ''}
            </div>
          )}
        </div>

        {/* Kapasite bar */}
        {event.maxCapacity && (
          <div className="mb-5">
            <div className="w-full h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isFull ? 'bg-orange-400' : conf.bg}`}
                style={{ width: `${Math.min(100, (event.attendeeCount / event.maxCapacity) * 100)}%` }}
              />
            </div>
            {isFull && <p className="text-xs text-orange-600 font-semibold mt-1">Kapasite doldu</p>}
          </div>
        )}

        {/* Eylemler */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-50 dark:border-slate-800 mt-auto">
          <div className="flex items-center gap-2">
            {event.registrationUrl && !event.isCancelled && !isFull && (
              <span
                onClick={e => { e.preventDefault(); window.open(event.registrationUrl!, '_blank', 'noopener'); }}
                className={`px-4 py-2 text-sm font-bold text-white ${conf.bg} rounded-xl cursor-pointer hover:opacity-90 transition-opacity`}
              >
                Kayıt Ol
              </span>
            )}
            <button
              onClick={guard(onReminderToggle)}
              title={hasReminder ? 'Hatırlatmayı kaldır' : 'Hatırlatma kur'}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${hasReminder ? 'bg-amber-400 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-amber-500'}`}
            >
              <svg className="w-4 h-4" fill={hasReminder ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button
              onClick={guard(onFavToggle)}
              title={isFav ? 'Favoriden çıkar' : 'Favorile'}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isFav ? 'bg-rose-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-rose-500'}`}
            >
              <svg className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-[#26496b] dark:text-blue-400 group-hover:gap-3 transition-all">
            Detaylar
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Etkinlik Listesi Satırı ──────────────────────────────────────────────────

function EventRow({
  event, isFav, onFavToggle, hasReminder, onReminderToggle,
}: {
  event: CmsEvent; isFav: boolean; onFavToggle: () => void;
  hasReminder: boolean; onReminderToggle: () => void;
}) {
  const { user } = useSahneAuth();
  const conf = getConf(event.type);
  const date = parseDate(event.dateStart);
  const isOnline = !!event.meetingUrl && !event.location;

  function guard(fn: () => void) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      if (!user) { window.location.href = `${MUTFAK_URL}/giris`; return; }
      fn();
    };
  }

  return (
    <Link
      href={`/etkinlikler/${event.slug}`}
      className="group flex items-center gap-4 sm:gap-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-px transition-all duration-200 px-4 sm:px-5 py-3.5 sm:py-4"
    >
      {/* Tarih bloku */}
      <div className={`shrink-0 w-12 h-12 ${conf.bg} rounded-xl flex flex-col items-center justify-center`}>
        <span className="text-sm font-black text-white leading-none tabular-nums">{date.day}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/65 mt-0.5">{date.month}</span>
      </div>

      {/* İçerik */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm sm:text-[15px] text-gray-900 dark:text-slate-100 truncate group-hover:text-[#26496b] dark:group-hover:text-blue-400 transition-colors">
          {event.title}
        </p>
        <div className="flex items-center gap-2 sm:gap-3 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400 dark:text-slate-500">{date.time}</span>
          {event.location && (
            <>
              <span className="text-gray-200 dark:text-slate-700 text-xs">·</span>
              <span className="text-xs text-gray-400 dark:text-slate-500 truncate">{event.location}</span>
            </>
          )}
          {isOnline && (
            <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-md">
              Online
            </span>
          )}
          {date.daysUntil >= 0 && date.daysUntil <= 3 && (
            <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400">
              {date.daysUntil === 0 ? '• Bugün' : date.daysUntil === 1 ? '• Yarın' : `• ${date.daysUntil} gün`}
            </span>
          )}
          {event.isCancelled && (
            <span className="text-[10px] font-bold text-red-500">İptal</span>
          )}
        </div>
      </div>

      {/* Tip */}
      <span className={`hidden sm:inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${conf.pill}`}>
        {TYPE_LABELS[event.type] ?? event.type}
      </span>

      {/* Eylemler */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={guard(onReminderToggle)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${hasReminder ? 'bg-amber-400 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-amber-500'}`}
        >
          <svg className="w-3.5 h-3.5" fill={hasReminder ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        <button
          onClick={guard(onFavToggle)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isFav ? 'bg-rose-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-rose-500'}`}
        >
          <svg className="w-3.5 h-3.5" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20">
            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
          </svg>
        </button>
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-[#26496b] dark:group-hover:bg-blue-600 transition-colors">
          <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

// ─── Geçmiş Etkinlik Satırı ───────────────────────────────────────────────────

function PastRow({ event }: { event: CmsEvent }) {
  const conf = getConf(event.type);
  const date = parseDate(event.dateStart);
  return (
    <Link
      href={`/etkinlikler/${event.slug}`}
      className="group flex items-center gap-4 py-3.5 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-50 dark:border-slate-800 last:border-0"
    >
      <div className={`w-2 h-2 rounded-full ${conf.dot} shrink-0 opacity-40`} />
      <div className="w-16 shrink-0">
        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 tabular-nums">{date.day} {date.month}</p>
        <p className="text-[10px] text-gray-300 dark:text-slate-600">{date.year}</p>
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${conf.pill} opacity-70`}>
        {TYPE_LABELS[event.type] ?? event.type}
      </span>
      <p className="text-sm text-gray-500 dark:text-slate-400 group-hover:text-gray-700 dark:group-hover:text-slate-200 transition-colors truncate flex-1">
        {event.title}
      </p>
      {event.location && (
        <span className="text-xs text-gray-400 dark:text-slate-500 hidden sm:block shrink-0">📍 {event.location}</span>
      )}
      <svg className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-gray-400 dark:group-hover:text-slate-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

// ─── Hatırlatma Toast ─────────────────────────────────────────────────────────

function ReminderToast({ events, reminders }: { events: CmsEvent[]; reminders: string[] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const toRemind = useMemo(() => {
    const now = Date.now();
    return events.filter(e => {
      if (!reminders.includes(e.id) || dismissed.includes(e.id)) return false;
      const ms = new Date(e.dateStart).getTime() - now;
      return ms > 0 && ms < 48 * 3600 * 1000;
    });
  }, [events, reminders, dismissed]);
  if (toRemind.length === 0) return null;
  const e = toRemind[0]!;
  const hrs = Math.round((new Date(e.dateStart).getTime() - Date.now()) / 3600000);
  const conf = getConf(e.type);
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
      <div className={`flex items-center gap-3 ${conf.bg} text-white rounded-2xl px-4 py-3.5 shadow-2xl`}>
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold opacity-80">{hrs <= 1 ? 'Etkinlik başlıyor!' : `${hrs} saat sonra`}</p>
          <p className="text-xs opacity-70 truncate">{e.title}</p>
        </div>
        <Link href={`/etkinlikler/${e.slug}`} className="text-xs font-bold opacity-80 hover:opacity-100 transition-opacity shrink-0">Detay →</Link>
        <button
          onClick={() => setDismissed(d => [...d, e.id])}
          className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────

export function EventFilters({ events }: { events: CmsEvent[] }) {
  const { user, isLoading } = useSahneAuth();
  const [typeFilter, setTypeFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'online' | 'yuzyuze'>('all');
  const [showOnlyFavs, setShowOnlyFavs] = useState(false);
  const { favs, toggle: toggleFav, isFav } = useEventFavorites();
  const { reminders, toggle: toggleReminder, hasReminder } = useEventReminders();

  const now = new Date();
  const types = [...new Set(events.map(e => e.type))];

  const filtered = useMemo(() => events.filter(e => {
    if (typeFilter && e.type !== typeFilter) return false;
    if (formatFilter === 'online' && !(!!e.meetingUrl && !e.location)) return false;
    if (formatFilter === 'yuzyuze' && !e.location) return false;
    if (showOnlyFavs && !favs.includes(e.id)) return false;
    return true;
  }), [events, typeFilter, formatFilter, showOnlyFavs, favs]);

  const upcoming = filtered
    .filter(e => new Date(e.dateStart) >= now && !e.isCancelled)
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
  const past = filtered
    .filter(e => new Date(e.dateStart) < now || e.isCancelled)
    .sort((a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime());

  const featuredEvent = upcoming[0];
  const listEvents = upcoming.slice(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 -mt-[20px]">


      {!isLoading && user && (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl px-5 py-3 mb-10">
          <div className="w-7 h-7 rounded-full bg-[#26496b] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(user.profile?.displayName ?? user.email)[0]?.toUpperCase()}
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-400 flex-1">
            Merhaba, <span className="font-semibold text-gray-900 dark:text-slate-100">{user.profile?.displayName?.split(' ')[0] ?? 'üye'}</span>!
            {upcoming.length > 0 && <span className="text-gray-400 dark:text-slate-500"> · {upcoming.length} yaklaşan etkinlik</span>}
          </p>
          <EtkinlikGonderButton />
        </div>
      )}

      {/* ── Filtreler ── */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 mb-10 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => { setTypeFilter(''); setShowOnlyFavs(false); }}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              !typeFilter && !showOnlyFavs
                ? 'bg-[#26496b] text-white border-[#26496b] shadow-sm'
                : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-gray-300'
            }`}
          >
            Tümü
          </button>
          {types.map(t => {
            const conf = getConf(t);
            const active = typeFilter === t && !showOnlyFavs;
            return (
              <button
                key={t}
                onClick={() => { setTypeFilter(typeFilter === t ? '' : t); setShowOnlyFavs(false); }}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                  active
                    ? `${conf.bg} text-white border-transparent`
                    : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-gray-300'
                }`}
              >
                {TYPE_LABELS[t] ?? t}
              </button>
            );
          })}
          {favs.length > 0 && (
            <button
              onClick={() => { setShowOnlyFavs(!showOnlyFavs); setTypeFilter(''); }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                showOnlyFavs
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-white dark:bg-slate-900 text-rose-500 border-rose-200 dark:border-rose-800 hover:border-rose-300'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
              Favorilerim ({favs.length})
            </button>
          )}
        </div>

        <div className="flex gap-1 ml-auto bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
          {(['all', 'online', 'yuzyuze'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFormatFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                formatFilter === f
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
              }`}
            >
              {f === 'all' ? 'Tümü' : f === 'online' ? '🖥 Online' : '📍 Yüz Yüze'}
            </button>
          ))}
        </div>


      </div>

      {/* ── İçerik ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
          <p className="text-3xl mb-3">📅</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Sonuç bulunamadı</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">Farklı bir filtre deneyin.</p>
        </div>
      ) : (
        <div className="space-y-12">

          {/* Yaklaşan etkinlikler */}
          {upcoming.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <h2 className="text-xl font-black text-gray-900 dark:text-slate-100">Yaklaşan Etkinlikler</h2>
                <span className="text-sm text-gray-400 dark:text-slate-500 tabular-nums">{upcoming.length}</span>
              </div>

              <div className="space-y-3">
                {/* Öne çıkan */}
                {featuredEvent && (
                  <FeaturedCard
                    event={featuredEvent}
                    isFav={isFav(featuredEvent.id)}
                    onFavToggle={() => toggleFav(featuredEvent.id)}
                    hasReminder={hasReminder(featuredEvent.id)}
                    onReminderToggle={() => toggleReminder(featuredEvent.id)}
                  />
                )}

                {/* Liste */}
                {listEvents.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {listEvents.map(e => (
                      <EventRow
                        key={e.id}
                        event={e}
                        isFav={isFav(e.id)}
                        onFavToggle={() => toggleFav(e.id)}
                        hasReminder={hasReminder(e.id)}
                        onReminderToggle={() => toggleReminder(e.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Geçmiş */}
          {past.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Geçmiş
              </h2>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                {past.map(e => <PastRow key={e.id} event={e} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <ReminderToast events={events} reminders={reminders} />
    </div>
  );
}

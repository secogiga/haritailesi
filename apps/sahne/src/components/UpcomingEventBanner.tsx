'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Props {
  title: string;
  slug: string;
  dateStart: string;
  location: string | null;
  typeLabel: string;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function getCountdown(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export function UpcomingEventBanner({ title, slug, dateStart, location, typeLabel }: Props) {
  const target = new Date(dateStart);
  const [countdown, setCountdown] = useState(getCountdown(target));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(target));
    }, 1000);
    return () => clearInterval(interval);
  }, [dateStart]);

  if (!countdown) return null;

  return (
    <div className="bg-[var(--color-mavi)] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Yaklaşan</span>
        </div>

        <Link href={`/etkinlikler/${slug}`} className="flex-1 min-w-0 text-center sm:text-left">
          <span className="text-xs font-medium text-white/60 mr-2">{typeLabel}</span>
          <span className="text-sm font-semibold text-white truncate">{title}</span>
          {location && <span className="text-xs text-white/50 ml-2">· {location}</span>}
        </Link>

        <div className="flex items-center gap-3 shrink-0">
          {countdown.days > 0 && (
            <div className="text-center">
              <div className="text-lg font-bold text-white leading-none">{countdown.days}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">gün</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-lg font-bold text-white leading-none">{pad(countdown.hours)}</div>
            <div className="text-[10px] text-white/50 uppercase tracking-wider">sa</div>
          </div>
          <div className="text-white/40 font-bold -mt-1">:</div>
          <div className="text-center">
            <div className="text-lg font-bold text-white leading-none">{pad(countdown.minutes)}</div>
            <div className="text-[10px] text-white/50 uppercase tracking-wider">dk</div>
          </div>
          <div className="text-white/40 font-bold -mt-1">:</div>
          <div className="text-center">
            <div className="text-lg font-bold text-white tabular-nums leading-none">{pad(countdown.seconds)}</div>
            <div className="text-[10px] text-white/50 uppercase tracking-wider">sn</div>
          </div>
        </div>
      </div>
    </div>
  );
}

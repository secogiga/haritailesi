'use client';

import { useQuery } from '@tanstack/react-query';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const SAHNE_URL = process.env['NEXT_PUBLIC_SAHNE_URL'] ?? 'http://localhost:3002';

interface CmsEvent {
  id: string;
  slug: string;
  title: string;
  type: string;
  dateStart: string;
  location: string | null;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  webinar: 'Webinar',
  workshop: 'Workshop',
  conference: 'Konferans',
  meetup: 'Buluşma',
  online: 'Online',
};

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

async function fetchUpcomingEvents(): Promise<CmsEvent[]> {
  const res = await fetch(`${API_URL}/api/v1/cms/events`, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const events = (await res.json()) as CmsEvent[];
  const now = Date.now();
  return events
    .filter((e) => new Date(e.dateStart).getTime() >= now)
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime())
    .slice(0, 3);
}

export function SahneWidget() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['sahne-upcoming-events'],
    queryFn: fetchUpcomingEvents,
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">
          Bu Hafta Sahne&apos;de
        </p>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className="px-4 py-3 border-t border-white/10">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
          Bu Hafta Sahne&apos;de
        </p>
        <a
          href={SAHNE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-[#66aca9] hover:text-[#66aca9]/80 transition-colors"
        >
          Tümü →
        </a>
      </div>
      <div className="space-y-1.5">
        {events.map((e) => (
          <a
            key={e.id}
            href={`${SAHNE_URL}/etkinlikler/${e.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 group"
          >
            <span className="shrink-0 mt-0.5 text-[10px] font-bold text-[#66aca9] w-10 leading-tight">
              {formatEventDate(e.dateStart)}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-white/70 group-hover:text-white transition-colors truncate leading-tight">
                {e.title}
              </p>
              {(EVENT_TYPE_LABELS[e.type] ?? e.type) && (
                <p className="text-[10px] text-white/30 leading-tight">
                  {EVENT_TYPE_LABELS[e.type] ?? e.type}
                  {e.location ? ` · ${e.location}` : ''}
                </p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

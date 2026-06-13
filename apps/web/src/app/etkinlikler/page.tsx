import type { Metadata } from 'next';
import { cms } from '@/lib/api';
import { EventFilters } from './_filters';

export const metadata: Metadata = { title: 'Etkinlikler' };

export default async function EtkinliklerPage() {
  const events = await cms.events();
  const all = events ?? [];
  const upcoming = all.filter(e => new Date(e.dateStart) >= new Date() && !e.isCancelled);

  return (
    <main>
      <section className="bg-[var(--color-mavi)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-3">Etkinlikler</h1>
          <p className="text-white/70 text-lg">Kongreler, networking buluşmaları ve ödül törenleri</p>
          <div className="flex gap-4 mt-6 text-sm text-white/70">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {upcoming.length} yaklaşan
            </span>
            <span>{all.length} toplam etkinlik</span>
          </div>
        </div>
      </section>

      <EventFilters events={all} />
    </main>
  );
}

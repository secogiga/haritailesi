import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { cms } from '@/lib/api';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await cms.event(slug);
  if (!event) return { title: 'Etkinlik Bulunamadı' };
  return {
    title: event.title,
    description: event.description ?? undefined,
  };
}

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

export default async function EtkinlikDetayPage({ params }: Props) {
  const { slug } = await params;
  const event = await cms.event(slug);
  if (!event || !event.isPublished) notFound();

  const typeLabel = TYPE_LABELS[event.type] ?? event.type;
  const typeColor = TYPE_COLORS[event.type] ?? TYPE_COLORS['diger'];
  const isPast = new Date(event.dateStart) < new Date();

  return (
    <>
      <Navbar />
      <main className="min-h-screen dark:bg-[#070c1a]">
        <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-10 sm:py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/etkinlikler"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-slate-500 hover:text-[var(--color-mavi)] dark:hover:text-blue-400 transition-colors mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tüm Etkinlikler
            </Link>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeColor}`}>
                {typeLabel}
              </span>
              {isPast && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                  Geçmiş Etkinlik
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              {event.title}
            </h1>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex gap-2 text-gray-500 dark:text-slate-400">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  {new Date(event.dateStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {event.dateEnd && ` – ${new Date(event.dateEnd).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                </span>
              </div>
              {event.location && (
                <div className="flex gap-2 text-gray-500 dark:text-slate-400">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{event.location}</span>
                </div>
              )}
            </dl>

            {!isPast && (
              <div className="mt-6 flex flex-wrap gap-3">
                {event.registrationUrl && (
                  <a
                    href={event.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors"
                  >
                    Etkinliğe Kayıt Ol
                  </a>
                )}
                {event.meetingUrl && (
                  <a
                    href={event.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[var(--color-mavi)] border-2 border-[var(--color-mavi)] hover:bg-[var(--color-mavi)] hover:text-white rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                    Online Katıl
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {(event.description || event.body) && (
          <section className="py-10 sm:py-14">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              {event.description && (
                <p className="text-gray-600 dark:text-slate-400 text-base leading-relaxed">
                  {event.description}
                </p>
              )}
              {event.body && (
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: event.body }} />
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

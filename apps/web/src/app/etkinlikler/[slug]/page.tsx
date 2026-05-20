import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cms } from '@/lib/api';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await cms.event(slug);
  return { title: event?.title ?? 'Etkinlik' };
}

export default async function EtkinlikDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await cms.event(slug);
  if (!event) notFound();

  return (
    <main>
      <section className="bg-[var(--color-mavi)] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/etkinlikler" className="text-white/60 hover:text-white text-sm mb-4 inline-block">← Tüm Etkinlikler</Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
          <div className="flex flex-wrap gap-4 text-white/80 text-sm">
            <span>
              {new Date(event.dateStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            {event.location && <span>· {event.location}</span>}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {event.registrationUrl && (
            <div className="mb-8">
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-mavi)] text-white font-semibold rounded-xl hover:bg-[var(--color-mavi-acik)] transition-colors"
              >
                Kayıt Ol
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {event.body ? (
            <div className="prose prose-lg prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: event.body }} />
          ) : event.description ? (
            <p className="text-lg text-gray-700 leading-relaxed">{event.description}</p>
          ) : (
            <p className="text-gray-500">Etkinlik detayları yakında eklenecektir.</p>
          )}
        </div>
      </section>
    </main>
  );
}

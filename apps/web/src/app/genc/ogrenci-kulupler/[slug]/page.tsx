import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface Club {
  id: string; name: string; slug: string; university: string; city: string;
  memberCount: number; description: string | null; activities: string | null;
  contactName: string; contactEmail: string; contactPhone: string | null; website: string | null;
}

interface NewsItem {
  id: string; title: string; summary: string | null; body: string | null;
  publishedAt: string; createdAt: string;
}

interface EventItem {
  id: string; title: string; description: string | null; eventDate: string;
  location: string | null; registrationUrl: string | null;
}

async function fetchClub(slug: string): Promise<Club | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/student-clubs/slug/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json() as Promise<Club>;
  } catch { return null; }
}

async function fetchClubNews(id: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/student-clubs/${id}/news`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json() as Promise<NewsItem[]>;
  } catch { return []; }
}

async function fetchClubEvents(id: string): Promise<EventItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/student-clubs/${id}/club-events`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json() as Promise<EventItem[]>;
  } catch { return []; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const club = await fetchClub(slug);
  if (!club) return { title: 'Kulüp Bulunamadı' };
  return {
    title: `${club.name} — Öğrenci Kulüpleri`,
    description: club.description ?? undefined,
  };
}

const CLUB_STYLES: Record<string, { bg: string; text: string; ring: string; hero: string }> = {
  'itu-haritacilik-jeodezi':   { bg: 'bg-blue-50',    text: 'text-blue-700',    ring: 'ring-blue-200',   hero: 'from-blue-900 to-blue-700' },
  'odtu-cbs-toplulugu':        { bg: 'bg-emerald-50',  text: 'text-emerald-700', ring: 'ring-emerald-200', hero: 'from-emerald-900 to-emerald-700' },
  'iyte-jeodezi-fotogrametri': { bg: 'bg-purple-50',   text: 'text-purple-700',  ring: 'ring-purple-200', hero: 'from-purple-900 to-purple-700' },
};

function getStyle(slug: string) {
  return CLUB_STYLES[slug] ?? { bg: 'bg-gray-50', text: 'text-gray-700', ring: 'ring-gray-200', hero: 'from-gray-800 to-gray-600' };
}

function ClubIcon({ slug }: { slug: string }) {
  if (slug === 'itu-haritacilik-jeodezi') return (
    <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
      <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="2.5" fill="currentColor" />
      <line x1="20" y1="4" x2="20" y2="36" stroke="currentColor" strokeWidth="1.5" />
      <line x1="4" y1="20" x2="36" y2="20" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
  if (slug === 'odtu-cbs-toplulugu') return (
    <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
      <rect x="4" y="8" width="32" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 16h32M4 24h32M16 8v24M24 8v24" stroke="currentColor" strokeWidth="1" />
      <rect x="10" y="12" width="6" height="4" rx="0.5" fill="currentColor" opacity="0.7" />
      <rect x="24" y="20" width="6" height="4" rx="0.5" fill="currentColor" opacity="0.7" />
    </svg>
  );
  if (slug === 'iyte-jeodezi-fotogrametri') return (
    <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
      <path d="M20 4L8 12v8l12 16 12-16v-8L20 4z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12l12 8 12-8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 20v12" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="3" fill="currentColor" />
    </svg>
  );
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
      <path d="M20 6l14 14-14 14L6 20z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="4" fill="currentColor" />
    </svg>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function ClubDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = await fetchClub(slug);
  if (!club) notFound();

  const [news, events] = await Promise.all([
    fetchClubNews(club.id),
    fetchClubEvents(club.id),
  ]);

  const style = getStyle(slug);
  const upcomingEvents = events.filter(e => new Date(e.eventDate) >= new Date());
  const pastEvents = events.filter(e => new Date(e.eventDate) < new Date());

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className={`bg-gradient-to-br ${style.hero} text-white py-14 px-4 relative overflow-hidden`}>
        <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none" aria-hidden="true">
          <defs>
            <pattern id="topo3" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <ellipse cx="60" cy="60" rx="55" ry="40" fill="none" stroke="white" strokeWidth="1" />
              <ellipse cx="60" cy="60" rx="38" ry="26" fill="none" stroke="white" strokeWidth="1" />
              <ellipse cx="60" cy="60" rx="22" ry="14" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#topo3)" />
        </svg>
        <div className="max-w-4xl mx-auto relative">
          <Link href="/genc/ogrenci-kulupler" className="inline-flex items-center gap-1 text-white/50 text-xs font-medium mb-6 hover:text-white/80 transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Öğrenci Kulüpleri
          </Link>
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 text-white">
              <div className="w-9 h-9 sm:w-11 sm:h-11"><ClubIcon slug={slug} /></div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">{club.name}</h1>
              <p className="text-white/70 text-sm mt-1">{club.university} · {club.city}</p>
              {club.memberCount > 0 && (
                <p className="text-white/60 text-xs mt-2 font-medium">{club.memberCount} aktif üye</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        {/* About */}
        {(club.description || club.activities) && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 text-base mb-4">Hakkında</h2>
            {club.description && (
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{club.description}</p>
            )}
            {club.activities && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Faaliyetler</p>
                <p className="text-gray-600 text-sm leading-relaxed">{club.activities}</p>
              </div>
            )}
          </section>
        )}

        {/* News */}
        <section id="haberler" className="scroll-mt-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 text-lg">Haberler</h2>
            <span className="text-xs text-gray-400">{news.length} haber</span>
          </div>
          {news.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">Henüz haber yok.</div>
          ) : (
            <div className="space-y-4">
              {news.map(n => (
                <div key={n.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug">{n.title}</h3>
                    <span className="text-xs text-gray-400 shrink-0">{formatDate(n.publishedAt)}</span>
                  </div>
                  {n.summary && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{n.summary}</p>}
                  {n.body && n.body !== n.summary && (
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed border-t border-gray-50 pt-3">{n.body}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Events */}
        <section id="etkinlikler" className="scroll-mt-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 text-lg">Etkinlikler</h2>
            <span className="text-xs text-gray-400">{upcomingEvents.length} yaklaşan</span>
          </div>

          {events.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">Henüz etkinlik yok.</div>
          ) : (
            <div className="space-y-3">
              {/* Upcoming */}
              {upcomingEvents.map(e => {
                const d = new Date(e.eventDate);
                return (
                  <div key={e.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4`}>
                    <div className={`shrink-0 w-14 h-14 rounded-2xl ${style.bg} flex flex-col items-center justify-center`}>
                      <p className={`text-lg font-bold ${style.text} leading-none`}>{d.getDate()}</p>
                      <p className={`text-[10px] font-semibold ${style.text} uppercase`}>{d.toLocaleString('tr-TR', { month: 'short' })}</p>
                      <p className="text-[9px] text-gray-400">{d.getFullYear()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug">{e.title}</h3>
                      {e.description && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{e.description}</p>}
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        {e.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {e.location}
                          </span>
                        )}
                        {e.registrationUrl && (
                          <a href={e.registrationUrl} target="_blank" rel="noopener noreferrer"
                            className={`text-xs font-semibold px-3 py-1 rounded-lg ${style.bg} ${style.text} hover:opacity-80 transition-opacity`}>
                            Kayıt Ol →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Past events collapsed */}
              {pastEvents.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-5 mb-3">Geçmiş Etkinlikler</p>
                  {pastEvents.map(e => {
                    const d = new Date(e.eventDate);
                    return (
                      <div key={e.id} className="opacity-50 bg-white rounded-2xl border border-gray-100 p-4 flex gap-3 mb-2">
                        <div className="shrink-0 w-10 h-10 rounded-xl bg-gray-100 flex flex-col items-center justify-center">
                          <p className="text-sm font-bold text-gray-600 leading-none">{d.getDate()}</p>
                          <p className="text-[9px] text-gray-400 uppercase">{d.toLocaleString('tr-TR', { month: 'short' })}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 leading-snug">{e.title}</p>
                          {e.location && <p className="text-xs text-gray-500 mt-0.5">{e.location}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Contact */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 text-base mb-4">İletişim</h2>
          <div className="space-y-3">
            {club.contactName && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700 font-medium">{club.contactName}</p>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <a href={`mailto:${club.contactEmail}`} className="text-sm text-[#26496b] hover:underline">{club.contactEmail}</a>
            </div>
            {club.contactPhone && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <a href={`tel:${club.contactPhone}`} className="text-sm text-gray-700">{club.contactPhone}</a>
              </div>
            )}
            {club.website && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <a href={club.website} target="_blank" rel="noopener noreferrer" className="text-sm text-[#26496b] hover:underline">{club.website}</a>
              </div>
            )}
          </div>
        </section>

        <div className="text-center">
          <Link href="/genc/ogrenci-kulupler" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Tüm Kulüpler
          </Link>
        </div>
      </div>
    </main>
  );
}

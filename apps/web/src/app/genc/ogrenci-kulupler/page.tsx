'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import Link from 'next/link';

const ClubMap = lazy(() => import('@/components/ClubMap'));

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface Club {
  id: string; name: string; slug: string; university: string; city: string;
  memberCount: number; description: string | null; activities: string | null;
  contactEmail: string; contactPhone: string | null; website: string | null;
}

interface NewsItem {
  id: string; clubId: string; clubName: string; clubSlug: string;
  title: string; summary: string | null; body: string | null;
  publishedAt: string; createdAt: string;
}

interface EventItem {
  id: string; clubId: string; clubName: string; clubSlug: string;
  title: string; description: string | null; eventDate: string;
  location: string | null; registrationUrl: string | null; createdAt: string;
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
      <rect x="17" y="16" width="6" height="4" rx="0.5" fill="currentColor" opacity="0.4" />
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

const CLUB_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  'itu-haritacilik-jeodezi': { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200' },
  'odtu-cbs-toplulugu': { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  'iyte-jeodezi-fotogrametri': { bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-200' },
};

function clubStyle(slug: string) {
  return CLUB_STYLES[slug] ?? { bg: 'bg-gray-50', text: 'text-gray-700', ring: 'ring-gray-200' };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'long' });
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'kulupler' | 'haberler' | 'etkinlikler' | 'iletisim';

const EMPTY_APPLY = { name: '', university: '', city: '', contactName: '', contactEmail: '', contactPhone: '', website: '', description: '', activities: '' };

export default function OgrenciKulupler() {
  const [tab, setTab] = useState<Tab>('kulupler');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [showApply, setShowApply] = useState(false);
  const [applyForm, setApplyForm] = useState(EMPTY_APPLY);
  const [applying, setApplying] = useState(false);
  const [applyDone, setApplyDone] = useState(false);
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [cRes, nRes, eRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/student-clubs`),
        fetch(`${API_URL}/api/v1/student-clubs/news`),
        fetch(`${API_URL}/api/v1/student-clubs/club-events`),
      ]);
      const [c, n, e] = await Promise.all([
        cRes.ok ? (cRes.json() as Promise<Club[]>) : Promise.resolve([]),
        nRes.ok ? (nRes.json() as Promise<NewsItem[]>) : Promise.resolve([]),
        eRes.ok ? (eRes.json() as Promise<EventItem[]>) : Promise.resolve([]),
      ]);
      setClubs(c);
      setNews(n);
      setEvents(e);
      setLoading(false);
    }
    void load();
  }, []);

  const totalMembers = clubs.reduce((s, c) => s + (c.memberCount ?? 0), 0);

  async function submitApply(e: React.FormEvent) {
    e.preventDefault();
    setApplying(true); setApplyError('');
    try {
      const slug = applyForm.name.toLowerCase()
        .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
        .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      const res = await fetch(`${API_URL}/api/v1/student-clubs/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...applyForm, slug }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})) as { message?: string }; throw new Error(err.message ?? 'Hata'); }
      setApplyDone(true);
      setApplyForm(EMPTY_APPLY);
    } catch (err) { setApplyError((err as Error).message); }
    finally { setApplying(false); }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'kulupler', label: 'Öğrenci Kulüpleri' },
    { id: 'haberler', label: 'Haberler' },
    { id: 'etkinlikler', label: 'Etkinlikler' },
    { id: 'iletisim', label: 'İnteraktif İletişim' },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-[#26496b] text-white py-14 px-4 relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" aria-hidden="true">
          <defs>
            <pattern id="topo2" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <ellipse cx="60" cy="60" rx="55" ry="40" fill="none" stroke="white" strokeWidth="1" />
              <ellipse cx="60" cy="60" rx="38" ry="26" fill="none" stroke="white" strokeWidth="1" />
              <ellipse cx="60" cy="60" rx="22" ry="14" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#topo2)" />
        </svg>
        <div className="max-w-3xl mx-auto text-center relative">
          <Link href="/genc" className="inline-flex items-center gap-1 text-white/50 text-xs font-medium mb-4 hover:text-white/80 transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Haritailesi Genç
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Öğrenci Kulüpleri</h1>
          <p className="text-white/70 text-sm max-w-xl mx-auto leading-relaxed">
            Türkiye'deki üniversitelerde harita, geomatik ve kadastro alanında faaliyet gösteren öğrenci kulüpleri.
          </p>
          {clubs.length > 0 && (
            <div className="flex items-center justify-center gap-8 mt-8">
              <div className="text-center"><p className="text-2xl font-bold">{clubs.length}</p><p className="text-white/50 text-xs mt-0.5">Kulüp</p></div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center"><p className="text-2xl font-bold">{news.length}</p><p className="text-white/50 text-xs mt-0.5">Haber</p></div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center"><p className="text-2xl font-bold">{events.length}</p><p className="text-white/50 text-xs mt-0.5">Etkinlik</p></div>
            </div>
          )}
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto scrollbar-none">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`whitespace-nowrap px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-[#26496b] text-[#26496b]'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-[#26496b] border-t-transparent animate-spin" />
          </div>
        ) : (

          // ── Tab 1: Kulüpler ──────────────────────────────────────────────
          tab === 'kulupler' ? (
            <div className="space-y-4">
              {clubs.map(club => {
                const style = clubStyle(club.slug);
                const isOpen = expanded === club.id;
                const clubNews = news.filter(n => n.clubId === club.id).slice(0, 2);
                const clubEvents = events.filter(e => e.clubId === club.id).slice(0, 2);
                return (
                  <div key={club.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Club header row */}
                    <div className="p-5 flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl ${style.bg} ${style.text} flex items-center justify-center shrink-0 ring-1 ${style.ring}`}>
                        <div className="w-8 h-8"><ClubIcon slug={club.slug} /></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-gray-900 text-base leading-snug">{club.name}</h2>
                        <p className="text-sm text-gray-500">{club.university} · {club.city}</p>
                        <div className={`inline-flex items-center gap-2.5 text-xs font-medium mt-1 ${style.text}`}>
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                            {news.filter(n => n.clubId === club.id).length} haber
                          </span>
                          <span className="opacity-40">·</span>
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {events.filter(e => e.clubId === club.id).length} etkinlik
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/genc/ogrenci-kulupler/${club.slug}`}
                          className={`hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 rounded-lg ${style.bg} ${style.text} hover:opacity-80 transition-opacity`}
                        >
                          Kulüp Sayfası →
                        </Link>
                        <button
                          onClick={() => setExpanded(isOpen ? null : club.id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {isOpen ? 'Kapat' : 'Detay'}
                          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div className="border-t border-gray-50 px-5 py-5 space-y-5 bg-gray-50/50">
                        {club.description && (
                          <p className="text-sm text-gray-600 leading-relaxed">{club.description}</p>
                        )}
                        {club.activities && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Faaliyetler</p>
                            <p className="text-sm text-gray-600 leading-relaxed">{club.activities}</p>
                          </div>
                        )}

                        {/* Recent news preview */}
                        {clubNews.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Son Haberler</p>
                              <Link href={`/genc/ogrenci-kulupler/${club.slug}#haberler`} className="text-xs text-[#26496b] font-medium hover:underline">
                                Tüm Haberler →
                              </Link>
                            </div>
                            <div className="space-y-2">
                              {clubNews.map(n => (
                                <div key={n.id} className="bg-white rounded-xl border border-gray-100 p-3">
                                  <p className="text-sm font-medium text-gray-800 leading-snug">{n.title}</p>
                                  {n.summary && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.summary}</p>}
                                  <p className="text-[10px] text-gray-400 mt-1">{formatDate(n.publishedAt)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Upcoming events preview */}
                        {clubEvents.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Yaklaşan Etkinlikler</p>
                              <Link href={`/genc/ogrenci-kulupler/${club.slug}#etkinlikler`} className="text-xs text-[#26496b] font-medium hover:underline">
                                Tüm Etkinlikler →
                              </Link>
                            </div>
                            <div className="space-y-2">
                              {clubEvents.map(e => (
                                <div key={e.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-start gap-3">
                                  <div className={`text-center shrink-0 w-10 h-10 rounded-xl ${style.bg} flex flex-col items-center justify-center`}>
                                    <p className={`text-xs font-bold ${style.text} leading-none`}>
                                      {new Date(e.eventDate).getDate()}
                                    </p>
                                    <p className={`text-[9px] font-medium ${style.text} uppercase`}>
                                      {new Date(e.eventDate).toLocaleString('tr-TR', { month: 'short' })}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800 leading-snug">{e.title}</p>
                                    {e.location && <p className="text-xs text-gray-500 mt-0.5">{e.location}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Contact + links */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <Link
                            href={`/genc/ogrenci-kulupler/${club.slug}`}
                            className={`sm:hidden text-xs font-semibold px-3 py-1.5 rounded-lg ${style.bg} ${style.text}`}
                          >
                            Kulüp Sayfası →
                          </Link>
                          <a href={`mailto:${club.contactEmail}`} className="text-xs text-[#26496b] hover:underline">
                            {club.contactEmail}
                          </a>
                          {club.website && (
                            <a href={club.website} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                              Web ↗
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Apply CTA */}
              <div className="mt-6 bg-[#26496b] rounded-2xl overflow-hidden">
                {applyDone ? (
                  <div className="p-7 text-center text-white">
                    <div className="text-3xl mb-3">✓</div>
                    <h3 className="font-bold text-base mb-1">Başvurunuz Alındı</h3>
                    <p className="text-white/70 text-sm">Ekibimiz inceleyip sizinle iletişime geçecek.</p>
                    <button onClick={() => { setApplyDone(false); setShowApply(false); }}
                      className="mt-4 text-xs text-white/60 hover:text-white underline">Yeni başvuru</button>
                  </div>
                ) : !showApply ? (
                  <div className="p-7 text-center text-white">
                    <h3 className="font-bold text-base mb-2">Kulübünüzü Ekleyin</h3>
                    <p className="text-white/70 text-sm mb-4">Üniversitenizde harita veya geomatik kulübü mü var? Haritailesi topluluğuna katılın.</p>
                    <button onClick={() => setShowApply(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-white text-[#26496b] rounded-xl hover:bg-gray-50 transition-colors">
                      Başvuru Formu →
                    </button>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-white text-sm">Kulüp Başvurusu</h3>
                      <button onClick={() => setShowApply(false)} className="text-white/50 hover:text-white text-sm">✕</button>
                    </div>
                    <form onSubmit={(e) => void submitApply(e)} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <input required placeholder="Kulüp adı *" value={applyForm.name}
                            onChange={e => setApplyForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full bg-white/15 text-white placeholder-white/40 rounded-lg px-3 py-2 text-sm border border-white/20 focus:outline-none focus:border-white/50" />
                        </div>
                        <input required placeholder="Üniversite *" value={applyForm.university}
                          onChange={e => setApplyForm(f => ({ ...f, university: e.target.value }))}
                          className="bg-white/15 text-white placeholder-white/40 rounded-lg px-3 py-2 text-sm border border-white/20 focus:outline-none focus:border-white/50" />
                        <input required placeholder="Şehir *" value={applyForm.city}
                          onChange={e => setApplyForm(f => ({ ...f, city: e.target.value }))}
                          className="bg-white/15 text-white placeholder-white/40 rounded-lg px-3 py-2 text-sm border border-white/20 focus:outline-none focus:border-white/50" />
                        <input required placeholder="Yetkili adı *" value={applyForm.contactName}
                          onChange={e => setApplyForm(f => ({ ...f, contactName: e.target.value }))}
                          className="bg-white/15 text-white placeholder-white/40 rounded-lg px-3 py-2 text-sm border border-white/20 focus:outline-none focus:border-white/50" />
                        <input required type="email" placeholder="E-posta *" value={applyForm.contactEmail}
                          onChange={e => setApplyForm(f => ({ ...f, contactEmail: e.target.value }))}
                          className="bg-white/15 text-white placeholder-white/40 rounded-lg px-3 py-2 text-sm border border-white/20 focus:outline-none focus:border-white/50" />
                        <input placeholder="Telefon" value={applyForm.contactPhone}
                          onChange={e => setApplyForm(f => ({ ...f, contactPhone: e.target.value }))}
                          className="bg-white/15 text-white placeholder-white/40 rounded-lg px-3 py-2 text-sm border border-white/20 focus:outline-none focus:border-white/50" />
                        <input placeholder="Website" value={applyForm.website}
                          onChange={e => setApplyForm(f => ({ ...f, website: e.target.value }))}
                          className="bg-white/15 text-white placeholder-white/40 rounded-lg px-3 py-2 text-sm border border-white/20 focus:outline-none focus:border-white/50" />
                        <div className="col-span-2">
                          <textarea rows={2} placeholder="Kulüp hakkında kısa bilgi" value={applyForm.description}
                            onChange={e => setApplyForm(f => ({ ...f, description: e.target.value }))}
                            className="w-full bg-white/15 text-white placeholder-white/40 rounded-lg px-3 py-2 text-sm border border-white/20 focus:outline-none focus:border-white/50" />
                        </div>
                      </div>
                      {applyError && <p className="text-xs text-red-300 bg-red-900/30 px-3 py-2 rounded-lg">{applyError}</p>}
                      <div className="flex gap-3 pt-1">
                        <button type="button" onClick={() => setShowApply(false)}
                          className="flex-1 py-2.5 text-sm border border-white/20 text-white/70 rounded-xl hover:bg-white/10 transition-colors">
                          İptal
                        </button>
                        <button type="submit" disabled={applying}
                          className="flex-1 py-2.5 text-sm font-semibold bg-white text-[#26496b] rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors">
                          {applying ? 'Gönderiliyor…' : 'Başvuru Gönder'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>

          // ── Tab 2: Haberler ──────────────────────────────────────────────
          ) : tab === 'haberler' ? (
            <div>
              <p className="text-sm text-gray-500 mb-5">{news.length} haber, tüm kulüplerden</p>
              <div className="space-y-4">
                {news.map(n => {
                  const club = clubs.find(c => c.id === n.clubId);
                  const style = club ? clubStyle(club.slug) : { bg: 'bg-gray-50', text: 'text-gray-700', ring: 'ring-gray-200' };
                  return (
                    <div key={n.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl ${style.bg} ${style.text} flex items-center justify-center shrink-0`}>
                          <div className="w-5 h-5">{club && <ClubIcon slug={club.slug} />}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>{n.clubName}</span>
                            <span className="text-xs text-gray-400">{formatDate(n.publishedAt)}</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{n.title}</h3>
                          {n.summary && <p className="text-sm text-gray-500 mt-2 leading-relaxed">{n.summary}</p>}
                          <Link href={`/genc/ogrenci-kulupler/${n.clubSlug}#haberler`} className="inline-flex items-center gap-1 text-xs text-[#26496b] font-medium mt-3 hover:underline">
                            Kulüp sayfasına git →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          // ── Tab 3: Etkinlikler ───────────────────────────────────────────
          ) : tab === 'etkinlikler' ? (
            <div>
              <p className="text-sm text-gray-500 mb-5">{events.length} etkinlik, tüm kulüplerden</p>
              <div className="space-y-3">
                {events.map(e => {
                  const club = clubs.find(c => c.id === e.clubId);
                  const style = club ? clubStyle(club.slug) : { bg: 'bg-gray-50', text: 'text-gray-700', ring: 'ring-gray-200' };
                  const eventDate = new Date(e.eventDate);
                  const isPast = eventDate < new Date();
                  return (
                    <div key={e.id} className={`bg-white rounded-2xl border shadow-sm p-5 flex gap-4 ${isPast ? 'opacity-60 border-gray-100' : 'border-gray-100'}`}>
                      {/* Date block */}
                      <div className={`shrink-0 w-14 h-14 rounded-2xl ${style.bg} flex flex-col items-center justify-center`}>
                        <p className={`text-lg font-bold ${style.text} leading-none`}>{eventDate.getDate()}</p>
                        <p className={`text-[10px] font-semibold ${style.text} uppercase`}>{eventDate.toLocaleString('tr-TR', { month: 'short' })}</p>
                        <p className="text-[9px] text-gray-400">{eventDate.getFullYear()}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>{e.clubName}</span>
                          {isPast && <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Tamamlandı</span>}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{e.title}</h3>
                        {e.description && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{e.description}</p>}
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
                          {e.registrationUrl && !isPast && (
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
              </div>
            </div>

          // ── Tab 4: İletişim & Harita ─────────────────────────────────────
          ) : (
            <div>
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                <Suspense fallback={<div className="h-[480px] flex items-center justify-center text-gray-400 text-sm">Harita yükleniyor…</div>}>
                  <ClubMap clubs={clubs} />
                </Suspense>
              </div>

              {/* Contact cards below map */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {clubs.map(club => {
                  const style = clubStyle(club.slug);
                  return (
                    <div key={club.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl ${style.bg} ${style.text} flex items-center justify-center shrink-0 ring-1 ${style.ring}`}>
                          <div className="w-6 h-6"><ClubIcon slug={club.slug} /></div>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm leading-snug">{club.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{club.city}</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <a href={`mailto:${club.contactEmail}`} className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#26496b] transition-colors">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {club.contactEmail}
                        </a>
                        {club.contactPhone && (
                          <a href={`tel:${club.contactPhone}`} className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#26496b] transition-colors">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {club.contactPhone}
                          </a>
                        )}
                        {club.website && (
                          <a href={club.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#26496b] transition-colors">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Web sitesi
                          </a>
                        )}
                      </div>
                      <Link
                        href={`/genc/ogrenci-kulupler/${club.slug}`}
                        className={`mt-4 block text-center text-xs font-semibold py-2 rounded-xl ${style.bg} ${style.text} hover:opacity-80 transition-opacity`}
                      >
                        Kulüp Sayfası →
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
        ))}
      </div>
    </main>
  );
}

import Link from 'next/link';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { PageActionTracker } from '@/components/PageActionTracker';
import { cms, type StudentClub, type CmsEvent } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Haritailesi Genç — Öğrenci Topluluğu',
  description: 'Haritacılık, geomatik ve kadastro öğrencileri için kulüpler, etkinlikler ve mentorluk fırsatları.',
};

function ClubCard({ club }: { club: StudentClub }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700 transition-all overflow-hidden group">
      {/* Color accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />

      <div className="p-6">
        {/* Club header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base leading-snug">{club.name}</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{club.university}</p>
          </div>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-2.5 py-1 rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {club.city}
          </span>
          {club.memberCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {club.memberCount} üye
            </span>
          )}
        </div>

        {/* Description */}
        {club.description && (
          <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3">
            {club.description}
          </p>
        )}

        {/* Activities */}
        {club.activities && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Etkinlikler & Faaliyetler</p>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed line-clamp-2">{club.activities}</p>
          </div>
        )}

        {/* Contact */}
        <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-1.5">
          <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">Sorumlu: {club.contactName}</p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`mailto:${club.contactEmail}`}
              className="inline-flex items-center gap-1.5 text-xs text-[#26496b] dark:text-blue-400 hover:underline font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              E-posta
            </a>
            {club.contactPhone && (
              <a
                href={`tel:${club.contactPhone}`}
                className="inline-flex items-center gap-1.5 text-xs text-[#26496b] dark:text-blue-400 hover:underline font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {club.contactPhone}
              </a>
            )}
            {club.website && (
              <a
                href={club.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#26496b] dark:text-blue-400 hover:underline font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Web sitesi
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventMini({ event }: { event: CmsEvent }) {
  const date = new Date(event.dateStart);
  const isPast = date < new Date();
  const TYPE_COLORS: Record<string, string> = {
    webinar: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    workshop: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    conference: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    meetup: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    other: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400',
  };
  const TYPE_LABELS: Record<string, string> = {
    webinar: 'Webinar', workshop: 'Atölye', conference: 'Konferans', meetup: 'Buluşma', other: 'Etkinlik',
  };
  return (
    <div className={`flex gap-4 p-4 rounded-xl border transition-all ${isPast ? 'bg-gray-50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800'}`}>
      <div className="shrink-0 w-12 text-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 leading-none">{date.getDate()}</div>
        <div className="text-xs text-gray-400 dark:text-slate-500 uppercase font-medium mt-0.5">
          {date.toLocaleDateString('tr-TR', { month: 'short' })}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[event.type] ?? TYPE_COLORS.other}`}>
            {TYPE_LABELS[event.type] ?? event.type}
          </span>
          {event.location && <span className="text-xs text-gray-400 dark:text-slate-500">{event.location}</span>}
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 line-clamp-1">{event.title}</p>
        {event.registrationUrl && !isPast && (
          <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer"
            className="inline-block mt-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
            Kayıt ol →
          </a>
        )}
      </div>
    </div>
  );
}

export default async function GencPage() {
  const [clubs, events] = await Promise.all([
    cms.studentClubs(),
    cms.events().catch(() => null),
  ]);

  const now = new Date();
  const upcomingEvents = (events ?? [])
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime())
    .slice(0, 6);

  const WEB_URL = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';

  return (
    <>
      <Navbar />
      <PageActionTracker actionId="v-hgenc" />
      <main className="min-h-screen dark:bg-[#070c1a]">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-[#26496b] py-16 sm:py-24">
          {/* Topo overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-10" aria-hidden="true">
            <svg viewBox="0 0 800 400" className="w-full h-full" fill="none">
              <ellipse cx="400" cy="200" rx="390" ry="190" stroke="white" strokeWidth="1" />
              <ellipse cx="400" cy="200" rx="310" ry="150" stroke="white" strokeWidth="1" />
              <ellipse cx="400" cy="200" rx="230" ry="110" stroke="white" strokeWidth="1" />
              <ellipse cx="400" cy="200" rx="160" ry="75" stroke="white" strokeWidth="1" />
              <ellipse cx="400" cy="200" rx="90" ry="42" stroke="white" strokeWidth="1" />
            </svg>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold mb-6 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              Haritailesi Genç
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight max-w-3xl mx-auto leading-tight">
              Sektörün geleceği<br />
              <span className="text-emerald-200">bugünden şekilleniyor.</span>
            </h1>

            <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
              Haritacılık, geomatik ve kadastro öğrencilerini bir araya getiren öğrenci kulüpleri, etkinlikler ve
              mentorluk fırsatlarıyla tanışın.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="#kulupler"
                className="px-8 py-3.5 text-sm font-semibold text-emerald-700 bg-white hover:bg-emerald-50 rounded-xl transition-colors shadow-sm"
              >
                Kulüpleri Keşfet
              </Link>
              <Link
                href={`${WEB_URL}/meslegin-gelecekleri/basvuru` as `https://${string}`}
                className="px-8 py-3.5 text-sm font-semibold text-white border-2 border-white/40 hover:border-white hover:bg-white/10 rounded-xl transition-colors"
              >
                Mesleğin Gelecekleri Başvurusu
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats strip ── */}
        <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-slate-800">
              {[
                { label: 'Öğrenci Kulübü', value: clubs.length > 0 ? `${clubs.length}+` : '—' },
                { label: 'Üniversite', value: clubs.length > 0 ? `${new Set(clubs.map(c => c.university)).size}+` : '—' },
                { label: 'Toplam Üye', value: clubs.reduce((s, c) => s + c.memberCount, 0) > 0 ? `${clubs.reduce((s, c) => s + c.memberCount, 0)}+` : '—' },
              ].map(s => (
                <div key={s.label} className="px-6 py-6 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{s.value}</div>
                  <div className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What is Haritailesi Genç ── */}
        <section className="py-16 sm:py-20 bg-gray-50 dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
                  Neden Haritailesi Genç?
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-5 leading-snug">
                  Okul kulübünden sektör topluluğuna köprü.
                </h2>
                <div className="space-y-4 text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                  <p>
                    Haritailesi Genç, haritacılık ve geomatik bölümünde okuyan öğrencilerin sektörle erken
                    bağlantı kurduğu programdır. Üniversite kulüplerini platform altında birleştirir.
                  </p>
                  <p>
                    Öğrenci kulüplerinin etkinliklerine katılın, mentor bulun, diğer üniversitelerdeki
                    meslektaşlarınızla proje üretin.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '🎓', title: 'Mesleğin Gelecekleri', desc: 'Öğrencilere özel üyelik ve program — tamamen ücretsiz.' },
                  { icon: '🤝', title: 'Mentor Bağlantısı', desc: 'Sektörden deneyimli profesyonellerle birebir görüşme.' },
                  { icon: '🏆', title: 'Etkinlikler', desc: 'Kongre, webinar ve workshoplara öncelikli kayıt imkânı.' },
                  { icon: '🗺️', title: 'Proje Üretimi', desc: 'Mutfak üzerinden ortak proje geliştirme ve kaynak paylaşımı.' },
                ].map(f => (
                  <div key={f.title} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800">
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-1">{f.title}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Clubs grid ── */}
        <section id="kulupler" className="py-16 sm:py-24 dark:bg-[#070c1a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
                  Kayıtlı Kulüpler
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
                  Öğrenci Kulüpleri
                </h2>
                <p className="mt-2 text-gray-500 dark:text-slate-400 text-sm">
                  Haritailesi topluluğuna bağlı üniversite haritacılık kulüpleri
                </p>
              </div>
            </div>

            {clubs.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                <div className="text-5xl mb-4">🎓</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  Kulübünüzü ekleyin
                </h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
                  Üniversitenizin haritacılık kulübü henüz burada yok. Kulübünüzü ekleyerek Haritailesi topluluğuyla bağlantı kurun.
                </p>
                <Link
                  href="/kulubu-ekle"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
                >
                  Kulübümü Ekle
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map(club => (
                  <ClubCard key={club.id} club={club} />
                ))}

                {/* Add club CTA card */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-800 p-6 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">Kulübünüzü Ekleyin</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Haritailesi topluluğuna bağlanın</p>
                  </div>
                  <Link
                    href="/kulubu-ekle"
                    className="px-5 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 rounded-xl hover:border-emerald-400 transition-colors"
                  >
                    Başvur
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Events ── */}
        <section className="py-16 sm:py-20 bg-gray-50 dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
                  Etkinlikler
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  Yaklaşan Etkinlikler
                </h2>
              </div>
              <Link href="/etkinlikler" className="text-sm font-medium text-[#26496b] dark:text-blue-400 hover:underline">
                Tüm etkinlikler →
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="py-10 text-center text-gray-400 dark:text-slate-500 text-sm">
                Yaklaşan etkinlik bulunmuyor.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingEvents.map(event => (
                  <EventMini key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Mesleğin Gelecekleri CTA ── */}
        <section className="py-16 sm:py-20 dark:bg-[#070c1a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#26496b] to-teal-700 p-8 sm:p-12 text-center">
              <div className="pointer-events-none absolute inset-0 opacity-10" aria-hidden="true">
                <svg viewBox="0 0 600 300" className="w-full h-full" fill="none">
                  <ellipse cx="300" cy="150" rx="290" ry="140" stroke="white" strokeWidth="1" />
                  <ellipse cx="300" cy="150" rx="220" ry="104" stroke="white" strokeWidth="1" />
                  <ellipse cx="300" cy="150" rx="150" ry="70" stroke="white" strokeWidth="1" />
                  <ellipse cx="300" cy="150" rx="80" ry="38" stroke="white" strokeWidth="1" />
                </svg>
              </div>
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold mb-5 uppercase tracking-wide">
                  🎓 Öğrencilere Özel
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  Mesleğin Gelecekleri Programı
                </h2>
                <p className="text-white/80 max-w-xl mx-auto mb-8 leading-relaxed">
                  Harita mühendisliği veya geomatik bölümü öğrencisiyseniz, Haritailesi Genç üyeliği
                  tamamen ücretsiz. Etkinlikler, eğitimler ve mentorluk fırsatları sizi bekliyor.
                </p>
                <Link
                  href={`${WEB_URL}/meslegin-gelecekleri/basvuru` as `https://${string}`}
                  className="inline-block px-8 py-3.5 text-sm font-semibold text-[#26496b] bg-white hover:bg-emerald-50 rounded-xl transition-colors shadow-md"
                >
                  Hemen Başvur — Ücretsiz
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}

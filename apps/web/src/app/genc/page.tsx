import Link from 'next/link';
import type { Metadata } from 'next';
import TurkeyMap from '@/components/TurkeyMap';
import { ClubsClient, type StudentClub } from './_clubs-client';
import { cms, type CmsEvent } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Haritailesi Genç — Öğrenci Topluluğu',
  description: 'Harita mühendisliği, harita ve kadastro, tapu ve kadastro öğrencileri için kulüpler, etkinlikler ve mentörlük fırsatları.',
};

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const SAHNE_URL = process.env['NEXT_PUBLIC_SAHNE_URL'] ?? 'http://localhost:3002';

async function fetchClubs(): Promise<StudentClub[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/student-clubs`, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    return (await res.json()) as StudentClub[];
  } catch {
    return [];
  }
}

// ── Öğrenci başarı hikayeleri ──
const HIKAYELER = [
  { ad: 'Selin Y.', uni: 'YTÜ Harita Müh.', soz: 'Mesleğin Gelecekleri Programı sayesinde ilk mentörlük alma deneyimimi yaşadım. Şimdi ben de destek oluyorum.' },
  { ad: 'Emre K.', uni: 'KTÜ Geomatik', soz: 'Kulübümüz Haritailesi’ye bağlandıktan sonra ilk kez başka üniversitelerle ortak proje ürettik.' },
  { ad: 'Deniz A.', uni: 'İTÜ Geomatik', soz: 'Webinarlar ve etkinlikler sayesinde sektörü okuldayken tanıdım, ilk stajımı buradan buldum.' },
];

// ── Öğrenciye özel kaynaklar (Sahne modülleri) ──
const KAYNAKLAR = [
  { href: '/kutuphane', icon: '📚', title: 'Meslek Kütüphanesi', desc: 'Mevzuat, sözlük, teknik kaynak ve rehberler.' },
  { href: '/sinavlar', icon: '📝', title: 'Sınav Merkezi', desc: 'KPSS, lisans ve sertifika sınavlarına hazırlık.' },
  { href: '/ilanlar', icon: '💼', title: 'İlan Panosu', desc: 'Staj ve kariyer fırsatları, sektörden duyurular.' },
  { href: '/mentorluk', icon: '🤝', title: 'Mentorluk', desc: 'Deneyimli profesyonellerle birebir eşleşme.' },
];

// ── SSS ──
const SSS = [
  { s: 'Üyelik ücretli mi?', c: 'Hayır. Haritailesi Genç ve Mesleğin Gelecekleri üyeliği öğrenciler için tamamen ücretsizdir.' },
  { s: 'Kulübüm listede yoksa ne yapmalıyım?', c: 'Kulübünüzü "Kulübümü Ekle" formuyla saniyeler içinde ekleyebilir, topluluğa bağlanabilirsiniz.' },
  { s: 'Mezun oldum, devam edebilir miyim?', c: 'Elbette. Mezuniyet sonrası bireysel üyelikle topluluğun bir parçası olmaya devam edebilirsiniz.' },
  { s: 'Mentor nasıl bulurum?', c: 'Mentorluk sayfasından başvurarak sektörden deneyimli bir profesyonelle eşleşebilirsiniz.' },
];

function EventMini({ event }: { event: CmsEvent }) {
  const date = new Date(event.dateStart);
  const isPast = date < new Date();
  const TYPE_COLORS: Record<string, string> = {
    webinar: 'bg-teal-100 text-teal-700',
    workshop: 'bg-violet-100 text-violet-700',
    conference: 'bg-indigo-100 text-indigo-700',
    meetup: 'bg-blue-100 text-blue-700',
    other: 'bg-gray-100 text-gray-600',
  };
  const TYPE_LABELS: Record<string, string> = {
    webinar: 'Webinar', workshop: 'Atölye', conference: 'Konferans', meetup: 'Buluşma', other: 'Etkinlik',
  };
  return (
    <div className={`flex gap-4 p-4 rounded-xl border transition-all ${isPast ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 hover:border-emerald-200'}`}>
      <div className="shrink-0 w-12 text-center">
        <div className="text-2xl font-bold text-gray-900 leading-none">{date.getDate()}</div>
        <div className="text-xs text-gray-400 uppercase font-medium mt-0.5">
          {date.toLocaleDateString('tr-TR', { month: 'short' })}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[event.type] ?? TYPE_COLORS.other}`}>
            {TYPE_LABELS[event.type] ?? event.type}
          </span>
          {event.location && <span className="text-xs text-gray-400">{event.location}</span>}
        </div>
        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{event.title}</p>
        {event.registrationUrl && !isPast && (
          <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer"
            className="inline-block mt-1.5 text-xs font-medium text-emerald-600 hover:underline">
            Kayıt ol →
          </a>
        )}
      </div>
    </div>
  );
}

export default async function GencPage() {
  const [clubs, events] = await Promise.all([
    fetchClubs(),
    cms.events().catch(() => null),
  ]);

  const now = new Date();
  const sortedEvents = (events ?? []).sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
  const upcomingEvents = sortedEvents.slice(0, 6);
  const nextEvent = sortedEvents.find((e) => new Date(e.dateStart) > now) ?? null;

  // Kulüp haritası — şehir bazlı yoğunluk
  const clubCityStats = Object.values(
    clubs.reduce((acc, c) => {
      acc[c.city] = acc[c.city] ?? { city: c.city, count: 0 };
      acc[c.city].count += c.memberCount || 1;
      return acc;
    }, {} as Record<string, { city: string; count: number }>),
  );

  return (
    <main className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-[#26496b] py-16 sm:py-24">
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
            Mesleğin geleceği<br />
            <span className="text-emerald-200">bugünden şekilleniyor.</span>
          </h1>

          <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            Harita mühendisliği, harita ve kadastro, tapu ve kadastro bölümü, meslek liselerinin harita tapu
            kadastro alanlarının öğrencilerini bir araya getiren öğrenci kulüpleri, etkinlikler ve mentörlük
            fırsatlarıyla tanışın.
          </p>

          {/* Yaklaşan etkinlik vurgusu */}
          {nextEvent && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              Sıradaki etkinlik: <span className="font-semibold">{nextEvent.title}</span>
              <span className="text-white/60">· {new Date(nextEvent.dateStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
            </div>
          )}

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="#kulupler" className="px-8 py-3.5 text-sm font-semibold text-emerald-700 bg-white hover:bg-emerald-50 rounded-xl transition-colors shadow-sm">
              Kulüpleri Keşfet
            </Link>
            <Link href="/meslegin-gelecekleri/basvuru"
              className="px-8 py-3.5 text-sm font-semibold text-white border-2 border-white/40 hover:border-white hover:bg-white/10 rounded-xl transition-colors">
              Mesleğin Gelecekleri Başvurusu
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {[
              { label: 'Öğrenci Kulübü', value: clubs.length > 0 ? `${clubs.length}+` : '—' },
              { label: 'Üniversite', value: clubs.length > 0 ? `${new Set(clubs.map(c => c.university)).size}+` : '—' },
              { label: 'Toplam Üye', value: clubs.reduce((s, c) => s + c.memberCount, 0) > 0 ? `${clubs.reduce((s, c) => s + c.memberCount, 0)}+` : '—' },
            ].map(s => (
              <div key={s.label} className="px-6 py-6 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-600">{s.value}</div>
                <div className="mt-1 text-xs sm:text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What is Haritailesi Genç ── */}
      <section className="py-16 sm:py-20 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">
                Neden Haritailesi Genç?
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-5 leading-snug">
                Üniversite kulübünden sektör topluluğuna köprü.
              </h2>
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>
                  Haritailesi Genç; harita mühendisliği, harita ve kadastro, tapu ve kadastro bölümü, meslek
                  liselerinin harita tapu kadastro alanlarının öğrencilerinin sektörle erken<br />bağlantı
                  kurduğu programdır. Üniversite kulüplerini platform altında birleştirir.
                </p>
                <p>
                  Öğrenci kulüplerinin etkinliklerine katılın, mentör bulun, diğer üniversitelerdeki
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
                <div key={f.title} className="p-4 bg-white rounded-xl border border-gray-100">
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">{f.title}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Kulüp Haritası ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-2">
              Türkiye Geneli
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Üniversite Kulüpleri İnteraktif Haritası
            </h2>
            <p className="mt-2 text-gray-500 text-sm max-w-xl mx-auto">
              Şehrine tıkla, o ildeki öğrenci topluluğunu gör. Haritailesi Genç her geçen gün büyüyor.
            </p>
          </div>
          <TurkeyMap members={clubCityStats} />
        </div>
      </section>

      {/* ── Nasıl Katılırım? ── */}
      <section className="py-16 sm:py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-2">
              3 Adımda
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Nasıl katılırım?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { n: '1', t: 'Mesleğin Gelecekleri\'ne Katıl', d: 'Mesleğin Gelecekleri formunu doldur — öğrenciler için tamamen ücretsiz.' },
              { n: '2', t: 'Mentörle Eşleş', d: 'Sektörden deneyimli bir profesyonelle birebir mentörlük için eşleş.' },
              { n: '3', t: 'Etkinliklere Katıl', d: 'Webinar, atölye ve kongrelere öncelikli katıl; projeler üret.' },
            ].map((s, i) => (
              <div key={s.n} className="relative bg-white rounded-2xl border border-gray-100 p-6">
                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                  {s.n}
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">{s.t}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.d}</p>
                {i < 2 && (
                  <svg className="hidden sm:block absolute top-9 -right-3 w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Clubs (arama + filtre + Ayın Kulübü) ── */}
      <section id="kulupler" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <div className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-2">
              Kayıtlı Kulüpler
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Öğrenci Kulüpleri
            </h2>
            <p className="mt-2 text-gray-500 text-sm">
              Haritailesi topluluğuna bağlı üniversite haritacılık kulüpleri
            </p>
          </div>

          <ClubsClient clubs={clubs} />
        </div>
      </section>

      {/* ── Events ── */}
      <section className="py-16 sm:py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-2">
                Etkinlikler
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Yaklaşan Etkinlikler
              </h2>
            </div>
            <Link href="/etkinlikler" className="text-sm font-medium text-[#26496b] hover:underline">
              Tüm etkinlikler →
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
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

      {/* ── Öğrenci Başarı Hikayeleri ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-2">
              Onlar da Başladı
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Öğrenci hikâyeleri</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HIKAYELER.map((h) => (
              <div key={h.ad} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <svg className="w-8 h-8 text-emerald-300 mb-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
                </svg>
                <p className="text-sm text-gray-700 italic leading-relaxed mb-5">{h.soz}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                    {h.ad.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{h.ad}</div>
                    <div className="text-xs text-gray-400">{h.uni}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Öğrenci Kaynakları ── */}
      <section className="py-16 sm:py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-2">
              Sana Özel
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Öğrenci Kaynakları</h2>
            <p className="mt-2 text-gray-500 text-sm max-w-xl mx-auto">
              Öğrenciliğinde işine yarayacak her şey tek yerde.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {KAYNAKLAR.map((k) => (
              <a key={k.href} href={`${SAHNE_URL}${k.href}`} target="_blank" rel="noopener noreferrer"
                className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-emerald-200 transition-all">
                <div className="text-2xl mb-3">{k.icon}</div>
                <div className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-emerald-600 transition-colors">{k.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{k.desc}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mesleğin Gelecekleri CTA ── */}
      <section className="py-16 sm:py-20">
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
                Harita mühendisliği, harita ve kadastro, tapu ve kadastro bölümü, meslek liselerinin harita
                tapu kadastro alanlarının öğrencisiyseniz, Haritailesi Genç üyeliği tamamen ücretsiz.
                Etkinlikler, eğitimler ve mentörlük fırsatları sizi bekliyor.
              </p>
              <Link href="/meslegin-gelecekleri/basvuru"
                className="inline-block px-8 py-3.5 text-sm font-semibold text-[#26496b] bg-white hover:bg-emerald-50 rounded-xl transition-colors shadow-md">
                Hemen Başvur — Ücretsiz
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SSS ── */}
      <section className="py-16 sm:py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Sıkça Sorulan Sorular</h2>
          </div>
          <div className="space-y-3">
            {SSS.map((item, i) => (
              <details key={item.s} open={i === 0} className="group bg-white rounded-2xl border border-gray-100 px-5">
                <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none">
                  <span className="text-sm font-semibold text-gray-800">{item.s}</span>
                  <svg className="w-4 h-4 text-gray-400 shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="text-sm text-gray-500 leading-relaxed pb-4">{item.c}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}

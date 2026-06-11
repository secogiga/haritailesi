import Link from 'next/link';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { PageActionTracker } from '@/components/PageActionTracker';
import { MentorApplyForm } from '@/components/MentorApplyForm';

export const metadata: Metadata = {
  title: 'Usta-Çırak Mentorluk — Haritailesi',
  description: 'Haritailesi mentorluk programı: deneyimli profesyonellerden birebir rehberlik.',
};

const EXPERTISE_LABELS: Record<string, string> = {
  kadastro: 'Kadastro',
  fotogrametri: 'Fotogrametri',
  uzaktan_algilama: 'Uzaktan Algılama',
  cbs_gis: 'CBS / GIS',
  insaat_olcmesi: 'İnşaat Ölçmesi',
  gayrimenkul: 'Gayrimenkul',
  deniz_hidrografi: 'Deniz Hidrografisi',
  yazilim_teknoloji: 'Yazılım & Teknoloji',
  kariyer_danismanligi: 'Kariyer Danışmanlığı',
  akademik_arastirma: 'Akademik Araştırma',
  girisimcilik: 'Girişimcilik',
};

const FORMAT_LABELS: Record<string, string> = {
  online: 'Online',
  in_person: 'Yüz Yüze',
  both: 'Online & Yüz Yüze',
};

interface MentorItem {
  userId: string;
  expertiseAreas: string[];
  bio: string | null;
  sessionFormat: string;
  city: string | null;
  monthlyCapacity: number;
  completedSessionCount: number;
  displayName: string | null;
  avatarUrl: string | null;
  profession: string | null;
}

async function fetchMentors(): Promise<MentorItem[]> {
  const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
  try {
    const res = await fetch(`${API_URL}/api/v1/mentorship/public/mentors`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json() as Promise<MentorItem[]>;
  } catch {
    return [];
  }
}

function Avatar({ name, url }: { name: string | null; url: string | null }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name ?? ''}
        className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 dark:border-slate-700"
      />
    );
  }
  const initials = (name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="w-14 h-14 rounded-full bg-[var(--color-mavi)] flex items-center justify-center text-white font-bold text-base border-2 border-gray-100 dark:border-slate-700">
      {initials}
    </div>
  );
}

function MentorCard({ mentor }: { mentor: MentorItem }) {
  const WEB_URL = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <Avatar name={mentor.displayName} url={mentor.avatarUrl} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-slate-100 truncate">
            {mentor.displayName ?? 'İsimsiz Mentor'}
          </p>
          {mentor.profession && (
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">{mentor.profession}</p>
          )}
          {mentor.city && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {mentor.city}
            </p>
          )}
        </div>
      </div>
      {mentor.bio && (
        <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-3">{mentor.bio}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {mentor.expertiseAreas.slice(0, 4).map((area) => (
          <span key={area} className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-mavi)]/10 text-[var(--color-mavi)] dark:bg-blue-900/20 dark:text-blue-300 font-medium">
            {EXPERTISE_LABELS[area] ?? area}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 pt-1 border-t border-gray-50 dark:border-slate-800">
        <span>{FORMAT_LABELS[mentor.sessionFormat] ?? mentor.sessionFormat}</span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-[var(--color-teal)]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          {mentor.completedSessionCount} seans
        </span>
      </div>
      <Link
        href={`${WEB_URL}/mutfak` as `https://${string}`}
        className="block text-center text-sm font-semibold px-4 py-2 rounded-xl bg-[var(--color-mavi)] text-white hover:bg-[var(--color-mavi-acik)] transition-colors"
      >
        Mentorluk İste
      </Link>
    </div>
  );
}

export default async function MentorlukPage() {
  const mentors = await fetchMentors();
  const WEB_URL = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';

  const totalSessions = mentors.reduce((sum, m) => sum + m.completedSessionCount, 0);
  const mentorCount = mentors.length;

  return (
    <>
      <Navbar />
      <PageActionTracker actionId="v-mentorluk" />
      <main className="min-h-screen dark:bg-[#070c1a]">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#26496b] to-[#1d3a57] py-16 sm:py-24">
          {/* Topographic pattern */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <svg viewBox="0 0 800 400" className="absolute inset-0 w-full h-full opacity-[0.06]" fill="none">
              <ellipse cx="400" cy="200" rx="380" ry="180" stroke="white" strokeWidth="1" />
              <ellipse cx="400" cy="200" rx="300" ry="140" stroke="white" strokeWidth="1" />
              <ellipse cx="400" cy="200" rx="210" ry="98" stroke="white" strokeWidth="1" />
              <ellipse cx="400" cy="200" rx="130" ry="60" stroke="#66aca9" strokeWidth="1" />
              <ellipse cx="400" cy="200" rx="65" ry="30" stroke="#66aca9" strokeWidth="1" />
            </svg>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#66aca9] mb-3">Sahne Modülleri</div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              Meslekte Yeni<br />
              <span className="text-[#66aca9]">Usta-Çırak</span> Mentorluk
            </h1>
            <p className="text-white/70 max-w-2xl text-sm sm:text-base leading-relaxed mb-8">
              Harita, geomatik ve kadastro alanındaki deneyimli profesyonellerden birebir rehberlik alın.
              Kariyerinizi şekillendirecek bir usta ile eşleşin — ya da kendi deneyiminizi aktararak iz bırakın.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#basvuru"
                className="px-6 py-3 bg-[#66aca9] text-white font-semibold text-sm rounded-xl hover:bg-[#4d8f8c] transition-colors"
              >
                Mentee Başvur
              </a>
              <a
                href="#basvuru"
                className="px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold text-sm rounded-xl hover:bg-white/20 transition-colors"
              >
                Mentor Ol
              </a>
            </div>
          </div>
        </section>

        {/* ── Stats bar ─────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100 dark:divide-slate-800">
              {[
                {
                  value: mentorCount > 0 ? `${mentorCount}` : '10+',
                  label: 'Aktif Mentor',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ),
                },
                {
                  value: '30+',
                  label: 'Aktif Mentee',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  ),
                },
                {
                  value: totalSessions > 0 ? `${totalSessions}+` : '50+',
                  label: 'Tamamlanan Seans',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
                {
                  value: '11',
                  label: 'Uzmanlık Alanı',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  ),
                },
              ].map((s) => (
                <div key={s.label} className="px-6 py-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--color-mavi)]/8 text-[var(--color-mavi)] flex items-center justify-center shrink-0">
                    {s.icon}
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-slate-100">{s.value}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Two paths ─────────────────────────────────────────────────── */}
        <section className="py-12 sm:py-16 dark:bg-[#070c1a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-16">
              {/* Mentee path */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-8 flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <div className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-1">Çırak</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-3">Mentörlük Al</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed flex-1">
                  Kariyer geliştirme, teknik beceriler ve sektör ağı için deneyimli bir mentor ile çalışın.
                  Hedeflerinizi paylaşın; size en uygun eşleştirme yapılsın.
                </p>
                <ul className="mt-5 space-y-2 mb-6">
                  {['Birebir online veya yüz yüze seans', 'Kariyer & teknik rehberlik', 'Sektör ağına giriş', 'Aylık düzenli görüşme'].map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-gray-600 dark:text-slate-300">
                      <svg className="w-4 h-4 text-[var(--color-teal)] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#basvuru"
                  className="block text-center py-3 bg-amber-500 text-white font-semibold text-sm rounded-xl hover:bg-amber-600 transition-colors"
                >
                  Mentee Başvuru Formu
                </a>
              </div>

              {/* Mentor path */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[var(--color-mavi)] shadow-md ring-1 ring-[var(--color-mavi)]/20 p-8 flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-mavi)]/10 text-[var(--color-mavi)] flex items-center justify-center mb-5">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-mavi)] mb-1">Usta</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-3">Mentor Ol</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed flex-1">
                  Yılların deneyimini genç profesyonellerle paylaşın. Sektörün geleceğini birlikte şekillendirin.
                  Kendi takviminize göre çalışın, anlamlı bağlantılar kurun.
                </p>
                <ul className="mt-5 space-y-2 mb-6">
                  {['Kendi takviminize göre seans', 'Uzmanlık alanınızı seçin', 'Mutfak profilinde "Mentor" rozeti', 'Topluluk tanınırlığı'].map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-gray-600 dark:text-slate-300">
                      <svg className="w-4 h-4 text-[var(--color-teal)] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#basvuru"
                  className="block text-center py-3 bg-[var(--color-mavi)] text-white font-semibold text-sm rounded-xl hover:bg-[var(--color-mavi-acik)] transition-colors"
                >
                  Mentor Başvuru Formu
                </a>
              </div>
            </div>

            {/* How it works */}
            <div className="mb-16">
              <div className="text-center mb-10">
                <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-teal)] mb-2">Nasıl Çalışır?</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">3 Adımda Başlayın</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  {
                    step: '01',
                    title: 'Başvurun',
                    desc: 'Aşağıdaki formu doldurun. Mentor veya mentee olmak istediğinizi, uzmanlık alanınızı ve hedeflerinizi belirtin.',
                    color: 'bg-blue-50 text-[var(--color-mavi)]',
                  },
                  {
                    step: '02',
                    title: 'Eşleşme',
                    desc: 'Ekibimiz başvurunuzu inceler, uzmanlık alanı ve hedefler doğrultusunda size en uygun eşleştirmeyi yapar.',
                    color: 'bg-amber-50 text-amber-600',
                  },
                  {
                    step: '03',
                    title: 'Seans Başlasın',
                    desc: 'Mutfak üzerinden iletişime geçin, takvim belirleyin ve ilk seansınızla usta-çırak yolculuğuna başlayın.',
                    color: 'bg-teal-50 text-[var(--color-teal)]',
                  },
                ].map((s) => (
                  <div key={s.step} className="relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
                    <div className={`inline-flex w-10 h-10 rounded-xl items-center justify-center text-sm font-bold mb-4 ${s.color}`}>
                      {s.step}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-2">{s.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Expertise areas */}
            <div className="mb-16 bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6 sm:p-8">
              <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-4">Uzmanlık Alanları</h2>
              <div className="flex flex-wrap gap-2">
                {Object.values(EXPERTISE_LABELS).map((label) => (
                  <span key={label} className="text-sm px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-medium">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Mentor grid */}
            {mentors.length > 0 && (
              <div className="mb-16">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                    Aktif Mentorlar
                    <span className="ml-2 text-sm font-normal text-gray-400">({mentors.length})</span>
                  </h2>
                  <Link
                    href={`${WEB_URL}/uye-ol` as `https://${string}`}
                    className="text-sm font-medium text-[var(--color-mavi)] hover:underline"
                  >
                    Üye ol → Mentorluk iste
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mentors.map((mentor) => (
                    <MentorCard key={mentor.userId} mentor={mentor} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state if no mentors */}
            {mentors.length === 0 && (
              <div className="mb-16 text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">Mentor rehberi hazırlanıyor</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                  İlk mentorlar yakında sisteme katılacak. Başvurunuzu şimdiden iletebilirsiniz.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Apply form ────────────────────────────────────────────────── */}
        <div id="basvuru">
          <MentorApplyForm />
        </div>
      </main>
    </>
  );
}

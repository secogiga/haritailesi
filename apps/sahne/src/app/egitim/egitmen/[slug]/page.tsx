import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { cms, type Training } from '@/lib/api';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface Props { params: Promise<{ slug: string }> }

function decodeSlug(s: string): string {
  try { return decodeURIComponent(s); } catch { return s; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeSlug(slug);
  const courses = await cms.trainings().catch(() => null) ?? [];
  const instructor = courses.find(c => c.instructor?.toLowerCase().replace(/\s+/g, '-') === decoded);
  return { title: instructor?.instructor ?? 'Eğitmen Profili' };
}

export default async function InstructorPage({ params }: Props) {
  const { slug } = await params;
  const decoded = decodeSlug(slug);
  const allCourses = await cms.trainings().catch(() => []) ?? [];

  const myCourses = allCourses.filter(c =>
    c.instructor?.toLowerCase().replace(/\s+/g, '-') === decoded,
  );

  if (myCourses.length === 0) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen dark:bg-[#070c1a] flex items-center justify-center">
          <p className="text-gray-500 dark:text-slate-400">Eğitmen bulunamadı.</p>
        </main>
      </>
    );
  }

  const sample = myCourses[0]!;
  const instructor = sample.instructor!;
  const avatarKey = sample.instructorAvatarKey;
  const bio = sample.instructorBio;
  const title = sample.instructorTitle;

  const totalStudents = myCourses.reduce((s, c) => s + c.enrollmentCount, 0);
  const totalViews = myCourses.reduce((s, c) => s + c.viewCount, 0);
  const uzmanlik = [...new Set(myCourses.flatMap(c => c.tags ?? []))].slice(0, 12);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f8fafc] dark:bg-[#070c1a]">

        {/* Hero */}
        <section className="relative bg-[#0d1b2a] overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#26496b]/30 to-transparent pointer-events-none" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <Link href="/egitim" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-8 group">
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tüm Eğitimler
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="flex gap-7 items-center">
                {avatarKey ? (
                  <img src={`${API_URL}/api/v1/media?key=${encodeURIComponent(avatarKey)}`} alt={instructor}
                    className="w-24 h-24 rounded-2xl object-cover ring-2 ring-white/20 shrink-0" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#26496b] to-[#66aca9] text-white flex items-center justify-center text-4xl font-black shrink-0">
                    {instructor[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#66aca9] mb-2">Eğitmen</p>
                  <h1 className="text-3xl sm:text-4xl font-black text-white mb-1">{instructor}</h1>
                  {title && <p className="text-sm font-medium text-slate-400">{title}</p>}
                </div>
              </div>

              {/* Ayrı stat kutuları — hero sağ */}
              <div className="flex gap-3 shrink-0">
                {[
                  { label: 'Eğitim', value: myCourses.length },
                  { label: 'Öğrenci', value: totalStudents },
                  { label: 'Görüntülenme', value: totalViews },
                ].map(s => (
                  <div key={s.label} className="flex-1 lg:flex-none lg:min-w-[96px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-5 py-4 text-center">
                    <div className="text-2xl font-black text-white tabular-nums leading-none">{s.value}</div>
                    <div className="text-[11px] text-slate-400 mt-1.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="h-8 bg-[#f8fafc] dark:bg-[#070c1a]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Sol — Eğitimleri */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-5 bg-gradient-to-b from-[#26496b] to-[#66aca9] rounded-full" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">
                  Eğitimleri <span className="text-gray-300 dark:text-slate-600 font-normal normal-case tracking-normal">{myCourses.length} eğitim</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {myCourses.map((course: Training) => (
              <Link key={course.id} href={`/egitim/${course.slug}`}
                className="group flex gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className={`w-1.5 rounded-full shrink-0 bg-gradient-to-b ${
                  course.level?.includes('Başlangıç') ? 'from-emerald-400 to-teal-500' :
                  course.level?.includes('Orta') ? 'from-amber-400 to-orange-500' :
                  course.level?.includes('İleri') ? 'from-rose-400 to-pink-500' :
                  'from-[#26496b] to-[#66aca9]'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {course.level && <span className="text-[10px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-2 py-0.5 rounded-full">{course.level}</span>}
                    {course.format && <span className="text-[10px] font-semibold bg-[#26496b]/8 dark:bg-blue-900/20 text-[#26496b] dark:text-blue-400 px-2 py-0.5 rounded-full">{course.format}</span>}
                    {!course.price && <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">Ücretsiz</span>}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 group-hover:text-[#26496b] dark:group-hover:text-blue-400 transition-colors leading-snug mb-1">{course.title}</h3>
                  {course.description && <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{course.description}</p>}
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-400 dark:text-slate-500">
                    {course.enrollmentCount > 0 && <span>👤 {course.enrollmentCount}</span>}
                    {course.price && <span className="font-semibold text-gray-700 dark:text-slate-300">{course.price}</span>}
                  </div>
                </div>
                <div className="shrink-0 self-center">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-[#26496b] dark:group-hover:bg-blue-600 transition-colors">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
              </div>
            </div>

            {/* Sağ — Hakkında + Uzmanlık */}
            <aside className="lg:col-span-1 space-y-4">
              {bio && (
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400 mb-3">Hakkında</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{bio}</p>
                </div>
              )}
              {uzmanlik.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400 mb-3">Uzmanlık Alanları</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {uzmanlik.map(t => (
                      <span key={t} className="text-[11px] font-medium bg-[#26496b]/8 dark:bg-blue-900/20 text-[#26496b] dark:text-blue-400 px-2.5 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

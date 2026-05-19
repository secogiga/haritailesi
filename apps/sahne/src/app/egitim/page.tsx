import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { cms, type Training } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Eğitim',
  description: 'Haritailesi eğitim programları: harita, geomatik ve CBS alanında online ve yüz yüze kurslar.',
};

const mutfakUrl = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';
const webUrl = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';

const LEVEL_COLORS: Record<string, string> = {
  'Başlangıç': 'bg-emerald-100 text-emerald-700',
  'Temel': 'bg-blue-100 text-blue-700',
  'Orta': 'bg-amber-100 text-amber-700',
  'İleri': 'bg-red-100 text-red-700',
};

function getLevelColor(level: string | null): string {
  if (!level) return 'bg-gray-100 text-gray-600';
  for (const [key, cls] of Object.entries(LEVEL_COLORS)) {
    if (level.includes(key)) return cls;
  }
  return 'bg-gray-100 text-gray-600';
}

function CourseCard({ course }: { course: Training }) {
  const tags: string[] = Array.isArray(course.tags) ? course.tags : [];

  return (
    <article className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700 transition-all overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-[#26496b] to-[#66aca9]" />
      <div className="flex flex-col flex-1 p-6">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {course.level && (
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getLevelColor(course.level)}`}>
              {course.level}
            </span>
          )}
          {course.format && (
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#26496b]/10 text-[#26496b] dark:bg-blue-900/30 dark:text-blue-300">
              {course.format}
            </span>
          )}
          {course.startDate && new Date(course.startDate) > new Date() && (
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
              {new Date(course.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 leading-snug mb-3">
          {course.title}
        </h2>

        {course.description && (
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-4 flex-1 line-clamp-3">
            {course.description}
          </p>
        )}

        <div className="space-y-1.5 mb-4">
          {course.instructor && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>
                {course.instructor}
                {course.instructorTitle && <span className="text-gray-400 dark:text-slate-500"> · {course.instructorTitle}</span>}
              </span>
            </div>
          )}
          {(course.format || course.duration) && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{[course.format, course.duration].filter(Boolean).join(' · ')}</span>
            </div>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {tags.map((tag) => (
              <span key={tag} className="text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800 mt-auto">
          <div>
            {course.price ? (
              <>
                <div className="text-base font-bold text-gray-900 dark:text-slate-100">{course.price}</div>
                {course.memberPrice && (
                  <div className="text-xs text-emerald-600">Üye Fiyatı: {course.memberPrice}</div>
                )}
              </>
            ) : (
              <>
                <div className="text-base font-bold text-emerald-600">Ücretsiz</div>
                <div className="text-xs text-gray-400 dark:text-slate-500">Üyeye Özel</div>
              </>
            )}
          </div>
          <a
            href={course.registrationUrl ?? `${mutfakUrl}/giris`}
            target={course.registrationUrl ? '_blank' : undefined}
            rel={course.registrationUrl ? 'noreferrer' : undefined}
            className="px-4 py-2 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors"
          >
            Kaydol
          </a>
        </div>
      </div>
    </article>
  );
}

export default async function EgitimPage() {
  const courses = await cms.trainings();

  return (
    <>
      <Navbar />
      <main className="min-h-screen dark:bg-[#070c1a]">
        {/* Hero */}
        <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-teal)] mb-3">
              Sahne Modülleri
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">
              Eğitim
            </h1>
            <p className="text-gray-500 dark:text-slate-400 max-w-2xl">
              Harita, geomatik ve CBS alanında uzman eğitmenlerle online ve yüz yüze kurslar.
              Üye indirimleri ile erişilebilir fiyatlar.
            </p>
          </div>
        </section>

        {/* Course grid */}
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {courses.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-4">📚</p>
                <h2 className="text-xl font-bold text-gray-700 dark:text-slate-200 mb-2">Yakında</h2>
                <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                  Eğitim programları hazırlanıyor. Yeni kurslar ve sertifika programları için takipte kalın.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}

            {/* CTA banner */}
            <div className="mt-10 rounded-2xl bg-gradient-to-br from-[#26496b] to-[#1a3350] p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <p className="text-sm font-bold mb-1">Eğitim Kataloğu Genişliyor</p>
                <p className="text-sm text-white/70 max-w-lg">
                  Yeni kurslar ve sertifika programları yakında ekleniyor.
                  Üye olarak tüm içeriklere öncelikli erişim hakkı kazanın.
                </p>
              </div>
              <a
                href={`${webUrl}/uye-ol`}
                className="shrink-0 px-5 py-2.5 text-sm font-semibold text-[#26496b] bg-white hover:bg-white/90 rounded-xl transition-colors"
              >
                Üye Ol
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

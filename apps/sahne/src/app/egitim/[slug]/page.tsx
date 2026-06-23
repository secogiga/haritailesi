import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { cms, type EventDiscussion } from '@/lib/api';
import { CourseEnrollButton } from '@/components/CourseEnrollButton';
import { CourseReviews } from '@/components/CourseReviews';
import { ShareMenu } from '@/components/ShareMenu';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

// Kapak görseli: '/...' veya 'http' ise doğrudan (public), değilse API media
function coverSrc(key: string): string {
  return key.startsWith('/') || key.startsWith('http')
    ? key
    : `${API_URL}/api/v1/media?key=${encodeURIComponent(key)}`;
}
const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

// ─── Renk haritaları ──────────────────────────────────────────────────────────

const LEVEL_PILL: Record<string, string> = {
  'Başlangıç': 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
  'Temel':     'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30',
  'Orta':      'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30',
  'İleri':     'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30',
};

function getLevelPill(level: string | null) {
  if (!level) return 'bg-slate-500/20 text-slate-300 ring-1 ring-slate-500/30';
  for (const [k, v] of Object.entries(LEVEL_PILL)) { if (level.includes(k)) return v; }
  return 'bg-slate-500/20 text-slate-300 ring-1 ring-slate-500/30';
}

// ─── Ders tipi ikonları ───────────────────────────────────────────────────────

const LESSON_ICONS: Record<string, React.ReactElement> = {
  video: (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
    </svg>
  ),
  text: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  pdf: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  ),
  quiz: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  live: (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
  ),
};

const LESSON_COLORS: Record<string, string> = {
  video: 'text-blue-400 bg-blue-500/10',
  text:  'text-slate-400 bg-slate-500/10',
  pdf:   'text-orange-400 bg-orange-500/10',
  quiz:  'text-violet-400 bg-violet-500/10',
  live:  'text-rose-400 bg-rose-500/10',
};

// ─── Tartışma bölümü ──────────────────────────────────────────────────────────

function CourseDiscussion({ discussion }: { discussion: EventDiscussion }) {
  return (
    <section>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-1 h-5 bg-gradient-to-b from-[#26496b] to-[#66aca9] rounded-full" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Tartışma</h2>
        {discussion.commentCount > 0 && (
          <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-medium">
            {discussion.commentCount} yorum
          </span>
        )}
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 mb-4 border border-gray-100 dark:border-slate-700/50">
        <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{discussion.post.body}</p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
          {discussion.post.authorName ?? 'Yönetim'} · {new Date(discussion.post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {discussion.comments.length > 0 && (
        <div className="space-y-3 mb-4">
          {discussion.comments.slice(0, 5).map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#26496b] to-[#66aca9] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {(c.authorName ?? '?')[0]?.toUpperCase()}
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 px-4 py-3 flex-1">
                <p className="text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">{c.authorName ?? 'Üye'}</p>
                <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <a
        href={MUTFAK_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#26496b] dark:text-blue-400 hover:gap-3 transition-all"
      >
        Mutfak&apos;ta tartışmaya katıl
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </a>
    </section>
  );
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await cms.trainingDetail(slug);
  if (!course) return { title: 'Kurs Bulunamadı' };
  return { title: course.title, description: course.description ?? undefined };
}

// ─── Sayfa ────────────────────────────────────────────────────────────────────

export default async function EgitimDetayPage({ params }: Props) {
  const { slug } = await params;
  const [course, reviews] = await Promise.all([
    cms.trainingDetail(slug),
    cms.trainingReviews(slug),
  ]);
  if (!course || !course.isPublished) notFound();

  const discussion = course.mutfakPostId
    ? await cms.eventDiscussion(course.mutfakPostId).catch(() => null)
    : null;

  const levelPill = getLevelPill(course.level);
  const totalHours = course.totalMinutes ? Math.floor(course.totalMinutes / 60) : null;
  const totalMins = course.totalMinutes ? course.totalMinutes % 60 : null;
  const durationStr = totalHours
    ? `${totalHours}s${totalMins ? ` ${totalMins}dk` : ''}`
    : course.duration;

  const stats = [
    course.totalLessons > 0 && { icon: '📚', text: `${course.totalLessons} ders` },
    durationStr && { icon: '⏱', text: durationStr },
    course.enrollmentCount > 0 && { icon: '👤', text: `${course.enrollmentCount} kayıtlı` },
    (course.avgRating && course.reviewCount > 0) && { icon: '⭐', text: `${course.avgRating} (${course.reviewCount} yorum)` },
  ].filter(Boolean) as { icon: string; text: string }[];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f8fafc] dark:bg-[#070c1a]">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative bg-[#0d1b2a] overflow-hidden">
          {/* Arka plan */}
          {course.coverImageKey ? (
            <>
              <img
                src={coverSrc(course.coverImageKey)}
                alt={course.title}
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#0d1b2a]/95 via-[#0d1b2a]/80 to-[#0d1b2a]/90" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#26496b]/30 to-[#66aca9]/15 pointer-events-none" />
            </>
          )}

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0">
            {/* Geri */}
            <Link
              href="/egitim"
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-8 group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tüm Eğitimler
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 pb-0">

              {/* Sol — başlık */}
              <div className="lg:col-span-3 pb-10 sm:pb-14">
                {/* Etiketler */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {course.level && (
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${levelPill}`}>
                      {course.level}
                    </span>
                  )}
                  {course.format && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white/80">
                      {course.format}
                    </span>
                  )}
                  {course.accessLevel === 'public' && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30">
                      Ücretsiz Erişim
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-3 mb-5">
                  <h1 className="flex-1 text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.05] tracking-tight">
                    {course.title}
                  </h1>
                  <ShareMenu title={course.title} size="sm" />
                </div>

                {course.description && (
                  <p className="text-slate-300 text-base leading-relaxed mb-7 max-w-2xl">
                    {course.description}
                  </p>
                )}

                {/* İstatistik satırı */}
                {stats.length > 0 && (
                  <div className="flex flex-wrap gap-x-5 gap-y-2 mb-7">
                    {stats.map((s) => (
                      <span key={s.text} className="flex items-center gap-1.5 text-sm text-slate-400">
                        <span>{s.icon}</span>
                        {s.text}
                      </span>
                    ))}
                  </div>
                )}

                {/* Eğitmen */}
                {course.instructor && (
                  <Link
                    href={`/egitim/egitmen/${encodeURIComponent(course.instructor.toLowerCase().replace(/\s+/g, '-'))}`}
                    className="inline-flex items-center gap-3 group/inst"
                  >
                    {course.instructorAvatarKey ? (
                      <img
                        src={`${API_URL}/api/v1/media?key=${encodeURIComponent(course.instructorAvatarKey)}`}
                        alt={course.instructor}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#26496b] to-[#66aca9] flex items-center justify-center text-white font-bold shrink-0">
                        {course.instructor[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white group-hover/inst:text-[#66aca9] transition-colors">
                        {course.instructor}
                      </p>
                      {course.instructorTitle && (
                        <p className="text-xs text-slate-500">{course.instructorTitle}</p>
                      )}
                    </div>
                  </Link>
                )}

                {/* Öne çıkanlar — sol altı doldurur */}
                <div className="mt-9 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 max-w-xl">
                  {[
                    course.certificateThreshold ? 'Tamamlama sertifikası' : null,
                    course.totalLessons > 0 ? `${course.totalLessons} ders içerik` : null,
                    durationStr ? `${durationStr} eğitim` : null,
                    'Yaşam boyu erişim',
                    'Mobil ve masaüstü erişim',
                    'Uygulamalı, sektöre dönük içerik',
                  ].filter(Boolean).map((f) => (
                    <div key={f as string} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <svg className="w-4 h-4 text-[#66aca9] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sağ — kart (desktop) */}
              <div className="hidden lg:flex lg:col-span-2 items-end justify-end">
                <div className="w-full max-w-sm bg-white/[0.06] dark:bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-t-3xl overflow-hidden shadow-2xl shadow-black/40">
                  {course.coverImageKey && (
                    <div className="h-44 overflow-hidden">
                      <img
                        src={coverSrc(course.coverImageKey)}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5 space-y-4">
                    <div>
                      {course.price ? (
                        <>
                          <p className="text-2xl font-black text-white">{course.price}</p>
                          {course.memberPrice && (
                            <p className="text-xs text-emerald-400 font-semibold mt-0.5">Üye fiyatı: {course.memberPrice}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-2xl font-black text-emerald-400">Ücretsiz</p>
                      )}
                    </div>
                    <CourseEnrollButton
                      trainingId={course.id}
                      trainingSlug={course.slug}
                      price={course.price}
                      memberPrice={course.memberPrice}
                      registrationUrl={course.registrationUrl}
                    />
                    <div className="space-y-2 pt-2 border-t border-white/10 text-sm text-slate-300">
                      {course.level && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Seviye</span>
                          <span className="font-medium text-white">{course.level}</span>
                        </div>
                      )}
                      {course.totalLessons > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Ders Sayısı</span>
                          <span className="font-medium text-white">{course.totalLessons}</span>
                        </div>
                      )}
                      {durationStr && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Toplam Süre</span>
                          <span className="font-medium text-white">{durationStr}</span>
                        </div>
                      )}
                      {course.startDate && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Başlangıç</span>
                          <span className="font-medium text-white">
                            {new Date(course.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                      {course.certificateThreshold && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Sertifika</span>
                          <span className="font-medium text-emerald-400">%{course.certificateThreshold} ile</span>
                        </div>
                      )}
                    </div>
                    {course.tags && course.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/10">
                        {course.tags.map(t => (
                          <span key={t} className="text-[10px] bg-white/8 text-slate-400 px-2 py-0.5 rounded-md">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Alt geçiş */}
          <div className="h-8 bg-[#f8fafc] dark:bg-[#070c1a]"
            style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }}
          />
        </section>

        {/* Mobil kayıt çubuğu */}
        <div className="lg:hidden sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 px-4 py-3 shadow-sm">
          <CourseEnrollButton
            trainingId={course.id}
            trainingSlug={course.slug}
            price={course.price}
            memberPrice={course.memberPrice}
            registrationUrl={course.registrationUrl}
            compact
          />
        </div>

        {/* ── Ana içerik ───────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">

            {/* Sol — içerik */}
            <div className="lg:col-span-3 space-y-12">

              {/* Önkoşullar */}
              {course.prerequisites && course.prerequisites.length > 0 && (
                <section>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-1 h-5 bg-gradient-to-b from-[#26496b] to-[#66aca9] rounded-full" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Ön Koşullar</h2>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-5">
                    <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-3">Bu kursa başlamadan önce tamamlanması önerilen kurslar:</p>
                    <div className="space-y-2">
                      {course.prerequisites.map((slug) => {
                        const prereq = null; // server component'te ayrı fetch gerekir, link olarak göster
                        return (
                          <Link key={slug} href={`/egitim/${slug}`}
                            className="flex items-center gap-2.5 text-sm text-[#26496b] dark:text-blue-400 hover:underline font-medium">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            </svg>
                            {slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}

              {/* Kurs hakkında */}
              {course.body && (
                <section>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-1 h-5 bg-gradient-to-b from-[#26496b] to-[#66aca9] rounded-full" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Kurs Hakkında</h2>
                  </div>
                  <div className="prose prose-gray dark:prose-invert max-w-none prose-a:text-[#26496b] dark:prose-a:text-blue-400 prose-headings:font-bold">
                    <div dangerouslySetInnerHTML={{ __html: course.body }} />
                  </div>
                </section>
              )}

              {/* Müfredat */}
              {course.sections && course.sections.length > 0 && (
                <section>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-1 h-5 bg-gradient-to-b from-[#26496b] to-[#66aca9] rounded-full" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Müfredat</h2>
                    <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-medium">
                      {course.totalLessons} ders{durationStr ? ` · ${durationStr}` : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {course.sections.map((section, si) => (
                      <details key={section.id} className="group rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        {/* Bölüm başlık */}
                        <summary className="flex items-center gap-3 px-5 py-3.5 bg-gray-50 dark:bg-slate-800/60 cursor-pointer list-none select-none hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                          <div className="w-6 h-6 rounded-lg bg-[#26496b]/10 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                            <span className="text-[11px] font-black text-[#26496b] dark:text-blue-400">{si + 1}</span>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm flex-1">{section.title}</span>
                          <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">{section.lessons.length} ders</span>
                          <svg className="w-4 h-4 text-gray-400 shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </summary>
                        {/* Dersler */}
                        <div className="divide-y divide-gray-50 dark:divide-slate-800">
                          {section.lessons.map((lesson) => {
                            const icon = LESSON_ICONS[lesson.contentType] ?? LESSON_ICONS.video!;
                            const iconCls = LESSON_COLORS[lesson.contentType] ?? LESSON_COLORS.video!;
                            return (
                              <div key={lesson.id} className="flex items-center gap-3 px-5 py-3 group/lesson hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${iconCls}`}>
                                  {icon}
                                </div>
                                <span className="flex-1 text-sm text-gray-700 dark:text-slate-300">{lesson.title}</span>
                                <div className="flex items-center gap-2">
                                  {lesson.isFree && (
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                      Önizleme
                                    </span>
                                  )}
                                  {lesson.durationMinutes && (
                                    <span className="text-[11px] text-gray-400 dark:text-slate-500 tabular-nums">{lesson.durationMinutes}dk</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              {/* Eğitmen */}
              {course.instructor && course.instructorBio && (
                <section>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-1 h-5 bg-gradient-to-b from-[#26496b] to-[#66aca9] rounded-full" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Eğitmen</h2>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
                    <div className="flex gap-5">
                      {course.instructorAvatarKey ? (
                        <img
                          src={`${API_URL}/api/v1/media?key=${encodeURIComponent(course.instructorAvatarKey)}`}
                          alt={course.instructor}
                          className="w-16 h-16 rounded-2xl object-cover shrink-0 ring-2 ring-gray-100 dark:ring-slate-700"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#26496b] to-[#66aca9] flex items-center justify-center text-white text-2xl font-black shrink-0">
                          {course.instructor[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/egitim/egitmen/${encodeURIComponent(course.instructor.toLowerCase().replace(/\s+/g, '-'))}`}
                          className="font-bold text-gray-900 dark:text-slate-100 hover:text-[#26496b] dark:hover:text-blue-400 transition-colors"
                        >
                          {course.instructor}
                        </Link>
                        {course.instructorTitle && (
                          <p className="text-sm text-[#66aca9] dark:text-teal-400 font-medium mt-0.5">{course.instructorTitle}</p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed mt-3">{course.instructorBio}</p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Yorumlar */}
              <section>
                <CourseReviews
                  reviews={reviews ?? []}
                  trainingId={course.id}
                  avgRating={course.avgRating}
                  reviewCount={course.reviewCount}
                />
              </section>

              {/* Tartışma */}
              {discussion && <CourseDiscussion discussion={discussion} />}

            </div>

            {/* Sağ — sidebar (desktop) */}
            <div className="hidden lg:block lg:col-span-2">
              <div className="space-y-4">

                {/* Kayıt kartı */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-[#26496b] via-[#66aca9] to-[#26496b]" />
                  <div className="p-5 space-y-4">
                    <div>
                      {course.price ? (
                        <>
                          <p className="text-2xl font-black text-gray-900 dark:text-slate-100">{course.price}</p>
                          {course.memberPrice && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                              Üye fiyatı: {course.memberPrice}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-2xl font-black text-emerald-500">Ücretsiz</p>
                      )}
                    </div>

                    <CourseEnrollButton
                      trainingId={course.id}
                      trainingSlug={course.slug}
                      price={course.price}
                      memberPrice={course.memberPrice}
                      registrationUrl={course.registrationUrl}
                    />

                    <div className="space-y-2.5 pt-3 border-t border-gray-50 dark:border-slate-800 text-sm text-gray-500 dark:text-slate-400">
                      {(
                        [
                          course.level ? ['Seviye', course.level] : null,
                          course.format ? ['Format', course.format] : null,
                          course.totalLessons > 0 ? ['Ders Sayısı', `${course.totalLessons} ders`] : null,
                          durationStr ? ['Toplam Süre', durationStr] : null,
                          course.startDate ? ['Başlangıç', new Date(course.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })] : null,
                          course.certificateThreshold ? ['Sertifika', `%${course.certificateThreshold} quiz ile`] : null,
                        ] as Array<[string, string] | null>
                      ).filter((x): x is [string, string] => x !== null).map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-2">
                          <span>{label}</span>
                          <span className={`font-medium text-gray-900 dark:text-slate-100 text-right ${label === 'Sertifika' ? 'text-emerald-500' : ''}`}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {course.tags && course.tags.length > 0 && (
                      <div className="pt-3 border-t border-gray-50 dark:border-slate-800 flex flex-wrap gap-1.5">
                        {course.tags.map(t => (
                          <span key={t} className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2.5 py-1 rounded-lg font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sertifika hatırlatması */}
                {course.certificateThreshold && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-0.5">Sertifika Programı</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                        Quiz&apos;de %{course.certificateThreshold} veya üstü alarak dijital sertifika kazan.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}

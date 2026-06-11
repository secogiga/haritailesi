import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { PageActionTracker } from '@/components/PageActionTracker';
import { cms } from '@/lib/api';
import { CourseFilters } from './_filters';
import { EgitimGonderButton, EgitimGonderCTA } from '@/components/EgitimGonder';
import { ModuleNewsletterBar } from '@/components/ModuleNewsletterBar';
import { EgitimHeroRight } from '@/components/EgitimHeroRight';

export const metadata: Metadata = {
  title: 'Eğitim',
  description: 'Haritailesi eğitim programları: harita, geomatik ve CBS alanında online ve yüz yüze kurslar.',
};

export default async function EgitimPage() {
  const [courses, leaderboard] = await Promise.all([
    cms.trainings(),
    cms.trainingLeaderboard(10),
  ]);

  const totalStudents = courses.reduce((s, c) => s + c.enrollmentCount, 0);

  return (
    <>
      <Navbar />
      <PageActionTracker actionId="v-egitim" />
      <main className="min-h-screen bg-[#f8fafc] dark:bg-[#070c1a]">

        {/* Hero */}
        <section className="relative bg-[#0d1b2a] overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#26496b]/40 via-transparent to-[#66aca9]/20 pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-14 sm:pt-16 sm:pb-20">
            <div className="flex flex-col lg:flex-row lg:items-end gap-8 lg:gap-16">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#66aca9] mb-5 bg-[#66aca9]/10 border border-[#66aca9]/20 px-3.5 py-1.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  Haritailesi Eğitim
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-5">
                  Kariyerini<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#66aca9] to-[#4d9996]">İleri Taşı</span>
                </h1>
                <p className="text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed mb-6">
                  Öğrenirken öğretmek, öğretirken gelişmek... Bilgi paylaştıkça değer kazanıyor. Uzman eğitmenlerle hazırlanmış eğitimler.
                </p>
                <EgitimGonderButton />
              </div>
              <EgitimHeroRight
                count={250}
                stats={[
                  { value: courses.length, label: 'Kurs', color: 'text-[#66aca9]', icon: (
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  )},
                  { value: totalStudents, label: 'Öğrenci', color: 'text-white', icon: (
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )},
                  { value: courses.filter(c => !c.price).length, label: 'Ücretsiz', color: 'text-emerald-400', icon: (
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                  )},
                ]}
              />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#f8fafc] dark:bg-[#070c1a]"
            style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }}
          />
        </section>


        {courses.length === 0 ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#26496b]/8 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-[#26496b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-2">Eğitimler Hazırlanıyor</h2>
            <p className="text-gray-500 dark:text-slate-400">Yeni kurslar ve sertifika programları yakında yayında.</p>
          </div>
        ) : (
          <CourseFilters courses={courses} leaderboard={leaderboard} />
        )}
      </main>
    </>
  );
}

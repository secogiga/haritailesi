import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { PageActionTracker } from '@/components/PageActionTracker';
import { cms } from '@/lib/api';
import { CourseFilters } from './_filters';
import { EgitimGonderButton } from '@/components/EgitimGonder';

export const metadata: Metadata = {
  title: 'Eğitim',
  description: 'Haritailesi eğitim programları: harita, geomatik ve CBS alanında online ve yüz yüze eğitimler.',
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
          {/* egitim.jpg — sağ taraf, sola geçişli */}
          <div className="absolute inset-0 left-[38%]"
            style={{ backgroundImage: "url('/egitim.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, #0d1b2a 0%, #0d1b2a 8%, rgba(13,27,42,0.82) 44%, rgba(13,27,42,0.12) 100%)' }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-14 sm:pt-16 sm:pb-20">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-12">
              <div className="max-w-2xl">
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
              <p className="text-slate-300/80 text-base sm:text-lg max-w-xl leading-relaxed mb-6">
                Öğrenirken öğretmek, öğretirken gelişmek... Bilgi paylaştıkça değer kazanıyor. Uzman eğitmenlerle hazırlanmış eğitimler.
              </p>
              <EgitimGonderButton />
              </div>

              {/* Stats panel — sağda (Meslek Atlası tarzı) */}
              <div className="shrink-0 flex rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md w-fit">
                {[
                  { value: courses.length, label: 'Eğitim' },
                  { value: totalStudents, label: 'Öğrenci' },
                  { value: new Set(courses.map(c => c.instructor).filter(Boolean)).size, label: 'Eğitmen' },
                ].map((s, i, arr) => (
                  <div key={s.label} className={`px-5 py-4 sm:px-7 sm:py-5 text-center ${i < arr.length - 1 ? 'border-r border-white/[0.08]' : ''}`}>
                    <div className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">{s.value}</div>
                    <div className="text-[11px] uppercase tracking-widest text-[#66aca9] mt-1.5 whitespace-nowrap">{s.label}</div>
                  </div>
                ))}
              </div>
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
            <p className="text-gray-500 dark:text-slate-400">Yeni eğitimler ve sertifika programları yakında yayında.</p>
          </div>
        ) : (
          <CourseFilters courses={courses} leaderboard={leaderboard} />
        )}
      </main>
    </>
  );
}

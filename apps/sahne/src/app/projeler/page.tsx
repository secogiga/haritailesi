import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { PageActionTracker } from '@/components/PageActionTracker';
import { cms } from '@/lib/api';
import { ProjelerClient } from './_client';
import { ProjeGonderButton } from '@/components/ProjeGonder';
import { HeroNewsletterBanner } from '@/components/HeroNewsletterBanner';

export const metadata: Metadata = {
  title: 'Projeler',
  description: "Meslektaşlarımızın Sahne veya Haritakademi'den paylaştığı projeler.",
};


export default async function ProjelerPage() {
  const [sahneProjects, linkedinProjects] = await Promise.all([
    cms.projects({ type: 'sahne' }).then((r) => r ?? []),
    cms.projects({ type: 'linkedin' }).then((r) => r ?? []),
  ]);

  const allProjects = [...sahneProjects, ...linkedinProjects];
  const totalProjects = allProjects.length;
  const uniqueAuthors = new Set(allProjects.map(p => p.authorName).filter(Boolean)).size;
  const totalViews = allProjects.reduce((sum, p) => sum + (p.linkedinViewCount ?? 0) + (p.viewCount ?? 0), 0);
  const uniqueCategories = new Set(allProjects.map(p => p.projectCategory).filter(Boolean)).size;

  const STATS = [
    { label: 'Toplam Proje', value: '70' },
    { label: 'Aday Proje', value: '18' },
    { label: 'Kategori', value: '8' },
    { label: 'Görüntülenme', value: totalViews >= 1000 ? `${Math.round(totalViews / 1000)}K` : totalViews.toString() },
  ];

  return (
    <>
      <Navbar />
      <PageActionTracker actionId="v-projeler" />
      <main className="min-h-screen bg-[#f8fafc] dark:bg-[#070c1a]">

        {/* ── Hero ── */}
        <section className="relative bg-[#0c1824] overflow-hidden">

          {/* Doku */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#26496b]/30 via-transparent to-[#66aca9]/15 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-14 sm:pt-16 sm:pb-20">
            <div className="flex flex-col lg:flex-row lg:items-end gap-8 lg:gap-16">

              {/* Sol — Başlık */}
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#66aca9] mb-5 bg-[#66aca9]/10 border border-[#66aca9]/20 px-3.5 py-1.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Haritailesi Projeler
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-5">
                  Topluluktan<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#66aca9] to-[#4d9996]">Projeler.</span>
                </h1>

                <p className="text-slate-400 text-base sm:text-lg max-w-md leading-relaxed mb-7">
                  Meslektaşlarımızın Sahne ve Haritakademi&apos;den paylaştığı gerçek projeler — fikir, prototip, ticari ürün.
                </p>

                <ProjeGonderButton />
              </div>

              {/* Sağ: Cover fotoğraf + newsletter */}
              <div className="flex flex-col gap-4 shrink-0 lg:w-[340px] xl:w-[380px] -translate-y-[33px]">
                {/* Hero fotoğraf */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                  <img
                    src="/coverimagesurveying.jpg"
                    alt="Haritailesi Projeler — Saha Çalışması"
                    className="w-full aspect-video object-cover object-right-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c1824]/75 via-[#0c1824]/15 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <div className="inline-block bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/40">
                      <p className="text-xs italic text-slate-700 leading-snug">&quot;Her proje, bir fikrin haritasıdır.&quot;</p>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <div className="inline-flex items-center gap-2 bg-[#0c1824]/70 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#66aca9] animate-pulse" />
                      <span className="text-[11px] font-semibold text-white/70 uppercase tracking-widest">Saha Çalışması</span>
                    </div>
                  </div>
                </div>

                {/* Newsletter banner */}
                <HeroNewsletterBanner
                  count={250}
                  bannerSub="yeni projeleri ve gelişmeleri ilk öğreniyor"
                  modalTitle="Yeni projeleri kaçırma"
                  modalSub="Topluluktan yeni projeler, fikir ve ticari ürünler doğrudan e-postana gelsin."
                />
              </div>
            </div>
          </div>

          {/* Alt dalga */}
          <div
            className="absolute bottom-0 left-0 right-0 h-8 bg-[#f8fafc] dark:bg-[#070c1a]"
            style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }}
          />
        </section>

        {/* ── İstatistik Bar ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STATS.map(s => (
              <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 px-4 py-4 text-center shadow-sm">
                <p className="text-3xl font-black text-[#26496b] dark:text-[#66aca9] leading-none tabular-nums">{s.value}</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1.5 font-semibold uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <ProjelerClient
          sahneProjects={sahneProjects}
          linkedinProjects={linkedinProjects}
        />
      </main>
    </>
  );
}

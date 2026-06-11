import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { PageActionTracker } from '@/components/PageActionTracker';
import { cms } from '@/lib/api';
import { ListingsClient } from './_listings-client';
import { IlanGonderButton } from '@/components/IlanGonder';
import { EgitimHeroRight } from '@/components/EgitimHeroRight';

export const metadata: Metadata = {
  title: 'İlan Panosu — Haritailesi',
  description: 'Harita, geomatik ve kadastro sektörüne özel işbirliği, proje, teknik destek, ekipman ve duyuru ilanları.',
};

export default async function IlanlarPage() {
  const listings = await cms.jobListings();

  return (
    <>
      <Navbar />
      <PageActionTracker actionId="v-ilanlar" />
      <main className="min-h-screen bg-[#f4f6f9] dark:bg-[#070c1a]">

        {/* Hero */}
        <section className="relative bg-[#0d1b2a] overflow-hidden">
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.045]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#26496b]/35 via-transparent to-[#66aca9]/10 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-16 sm:pb-20">
            <div className="flex flex-col lg:flex-row lg:items-end gap-8 lg:gap-16">

              {/* Left */}
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#66aca9] mb-5 bg-[#66aca9]/10 border border-[#66aca9]/20 px-3.5 py-1.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Sahne · İlan Panosu
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-4">
                  Sektörün<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#66aca9] to-[#4d9996]">Buluşma Noktası</span>
                </h1>

                <p className="text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed mb-7">
                  İşbirliği teklifleri, proje ilanları, ekipman satışı, teknik destek ve mesleki duyurular — tümü bir arada.
                </p>

                <IlanGonderButton />
              </div>

              <EgitimHeroRight
                count={250}
                bannerSub="yeni ilanları ve fırsatları ilk öğreniyor"
                modalTitle="Yeni ilanları kaçırma"
                modalSub="Sektörün güncel iş ilanları ve işbirliği fırsatları doğrudan e-postana gelsin."
                stats={[
                  { value: listings.length, label: 'Aktif İlan', color: 'text-white', icon: (
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  )},
                  { value: '9', label: 'Kategori', color: 'text-[#66aca9]', icon: (
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  )},
                  { value: '48s', label: 'Onay Süresi', color: 'text-emerald-400', icon: (
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )},
                ]}
              />
            </div>
          </div>

          {/* Wave separator */}
          <div
            className="absolute bottom-0 left-0 right-0 h-8 bg-[#f4f6f9] dark:bg-[#070c1a]"
            style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }}
          />
        </section>


        {/* Listings */}
        <ListingsClient allListings={listings} />
      </main>
    </>
  );
}

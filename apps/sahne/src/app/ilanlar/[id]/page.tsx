import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { cms } from '@/lib/api';
import { DetailClient } from './_detail-client';

const CAT: Record<string, { label: string; accent: string }> = {
  isbirligi:         { label: 'İşbirliği',          accent: '#10b981' },
  proje:             { label: 'Projeler',            accent: '#3b82f6' },
  teknik_destek:     { label: 'Teknik Destek',       accent: '#06b6d4' },
  freelancer:        { label: 'Freelancer',          accent: '#8b5cf6' },
  teknoloji_ekipman: { label: 'Teknoloji & Ekipman', accent: '#f59e0b' },
  ikinci_el:         { label: 'İkinci El & Satış',   accent: '#f97316' },
  mesleki_arac:      { label: 'Mesleki Araçlar',     accent: '#14b8a6' },
  firsat:            { label: 'Fırsatlar',           accent: '#f43f5e' },
  duyuru:            { label: 'Duyurular',           accent: '#6366f1' },
};

function getCat(type: string) {
  return CAT[type] ?? { label: type, accent: '#64748b' };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = await cms.jobListingById(id);
  if (!listing) return { title: 'İlan Bulunamadı — Haritailesi' };
  return {
    title: `${listing.title} — Haritailesi İlan Panosu`,
    description: listing.description.slice(0, 160),
  };
}

export default async function IlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await cms.jobListingById(id);
  if (!listing) notFound();

  const cat = getCat(listing.type);

  const publishedDate = listing.publishedAt
    ? new Date(listing.publishedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const expiresDate = listing.expiresAt
    ? new Date(listing.expiresAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const daysLeft = listing.expiresAt
    ? Math.ceil((new Date(listing.expiresAt).getTime() - Date.now()) / 86400000)
    : null;
  const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f4f6f9] dark:bg-[#070c1a]">

        {/* Mini hero */}
        <div className="bg-[#0d1b2a] relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(135deg, ${cat.accent}20 0%, transparent 60%)` }} />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <Link
              href="/ilanlar"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              İlan Panosu
            </Link>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white"
                style={{ background: cat.accent }}
              >
                {cat.label}
              </span>
              {isUrgent && (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
                  {daysLeft === 0 ? 'Bugün bitiyor' : `${daysLeft} gün kaldı`}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-snug mb-2">
              {listing.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
              <span className="font-semibold text-slate-200">{listing.company}</span>
              {listing.location && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {listing.location}
                </span>
              )}
              {publishedDate && <span>{publishedDate}</span>}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Sol — açıklama */}
            <div className="flex-1 min-w-0">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 sm:p-8 mb-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-4">Açıklama</h2>
                <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {listing.description}
                </p>
              </div>

              {listing.tags && listing.tags.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-3">Etiketler</h2>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map(t => (
                      <span key={t} className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-3 py-1 rounded-lg font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sağ — bilgi + aksiyonlar */}
            <div className="lg:w-72 shrink-0 space-y-4">

              {/* Aksiyonlar */}
              <DetailClient listing={listing} catAccent={cat.accent} />

              {/* Detaylar */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-4">Detaylar</h2>
                <dl className="space-y-3">
                  {[
                    { label: 'Kategori', value: cat.label },
                    listing.price && { label: 'Fiyat / Bütçe', value: listing.price },
                    listing.location && { label: 'Konum', value: listing.location },
                    publishedDate && { label: 'Yayın Tarihi', value: publishedDate },
                    expiresDate && { label: 'Son Tarih', value: expiresDate },
                  ].filter(Boolean).map((item) => {
                    const row = item as { label: string; value: string };
                    return (
                      <div key={row.label} className="flex items-start justify-between gap-3">
                        <dt className="text-xs text-gray-400 dark:text-slate-500 font-medium shrink-0">{row.label}</dt>
                        <dd className="text-xs font-semibold text-gray-800 dark:text-slate-200 text-right">{row.value}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>

            </div>
          </div>
        </div>
      </main>
    </>
  );
}

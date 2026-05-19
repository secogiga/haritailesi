import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { cms, type JobListing } from '@/lib/api';

export const metadata: Metadata = {
  title: 'İlan Panosu — Haritailesi',
  description: 'Harita, geomatik ve kadastro sektörüne özel işbirliği, proje, teknik destek, ekipman ve duyuru ilanları.',
};

const CATEGORIES: Array<{ value: string; label: string; color: string }> = [
  { value: '', label: 'Tümü', color: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'isbirligi', label: 'İşbirliği', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'proje', label: 'Projeler', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'teknik_destek', label: 'Teknik Destek', color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  { value: 'freelancer', label: 'Freelancer', color: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  { value: 'teknoloji_ekipman', label: 'Teknoloji & Ekipman', color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'ikinci_el', label: 'İkinci El & Satış', color: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'mesleki_arac', label: 'Mesleki Araçlar', color: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  { value: 'firsat', label: 'Fırsatlar', color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  { value: 'duyuru', label: 'Duyurular', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
];

function getCategoryMeta(type: string) {
  return CATEGORIES.find((c) => c.value === type) ?? CATEGORIES[CATEGORIES.length - 1]!;
}

const mutfakUrl = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

function ListingCard({ listing }: { listing: JobListing }) {
  const cat = getCategoryMeta(listing.type);
  const publishedDate = listing.publishedAt
    ? new Date(listing.publishedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const hasContact = listing.applyEmail || listing.contactPhone || listing.applyUrl;

  return (
    <article className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700 transition-all p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cat.color}`}>
              {cat.label}
            </span>
            {listing.price && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {listing.price}
              </span>
            )}
            {publishedDate && (
              <span className="text-xs text-gray-400 dark:text-slate-500">{publishedDate}</span>
            )}
          </div>

          <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-1">{listing.title}</h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-slate-400 mb-3">
            <span className="font-medium text-gray-700 dark:text-slate-300">{listing.company}</span>
            {listing.location && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {listing.location}
              </span>
            )}
          </div>

          {listing.description && (
            <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2 mb-3">{listing.description}</p>
          )}

          {listing.tags && listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {listing.tags.map((t) => (
                <span key={t} className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-2 py-0.5 rounded">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right — contact info */}
        {hasContact && (
          <div className="shrink-0 flex flex-col gap-2 sm:items-end">
            {listing.applyEmail && (
              <a
                href={`mailto:${listing.applyEmail}`}
                className="flex items-center gap-2 text-sm text-[var(--color-mavi)] hover:underline"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="break-all">{listing.applyEmail}</span>
              </a>
            )}
            {listing.contactPhone && (
              <a
                href={`tel:${listing.contactPhone}`}
                className="flex items-center gap-2 text-sm text-[var(--color-mavi)] hover:underline"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {listing.contactPhone}
              </a>
            )}
            {listing.applyUrl && (
              <a
                href={listing.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[var(--color-mavi)] hover:underline"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                İletişim
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default async function IlanlarPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const activeType = type ?? '';
  const listings = await cms.jobListings(activeType || undefined);

  const activeCat = getCategoryMeta(activeType);

  return (
    <>
      <Navbar />
      <main className="min-h-screen dark:bg-[#070c1a]">
        {/* Hero */}
        <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-teal)] mb-3">Sahne Modülleri</div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">İlan Panosu</h1>
            <p className="text-gray-500 dark:text-slate-400 max-w-2xl text-sm sm:text-base">
              Harita, geomatik ve kadastro sektörüne özel işbirliği teklifleri, proje ilanları, teknik destek talepleri,
              ekipman satış/kiralama ve mesleki duyurular.
            </p>
          </div>
        </section>

        {/* Stats bar */}
        <div className="bg-[var(--color-mavi)] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 divide-x divide-white/10">
              {[
                { label: 'Aktif İlan', value: String(listings.length) },
                { label: 'Kategori', value: '9' },
                { label: 'Ücretsiz', value: '✓' },
              ].map((s) => (
                <div key={s.label} className="px-6 py-5 text-center">
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-white/60 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

          {/* Category filter chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map((cat) => {
              const isActive = activeType === cat.value;
              return (
                <Link
                  key={cat.value}
                  href={cat.value ? `/ilanlar?type=${cat.value}` : '/ilanlar'}
                  className={`text-sm font-semibold px-4 py-1.5 rounded-full border transition-all ${
                    isActive
                      ? 'bg-[var(--color-mavi)] text-white border-[var(--color-mavi)]'
                      : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-[var(--color-mavi)] hover:text-[var(--color-mavi)]'
                  }`}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>

          {/* Listings */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
              {activeType ? `${activeCat.label} İlanları` : 'Tüm İlanlar'}
              {listings.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400 dark:text-slate-500">
                  ({listings.length})
                </span>
              )}
            </h2>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-1">Henüz ilan yok</p>
              <p className="text-gray-400 dark:text-slate-500 text-xs">İlk ilanı siz yayınlayın!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          {/* Submit CTA */}
          <div className="mt-10 bg-gradient-to-br from-[var(--color-mavi)] to-[#1d3a57] rounded-2xl p-6 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">İlan Yayınlamak İstiyor musunuz?</h3>
                <p className="text-white/70 text-sm">
                  Ekipman satışı, işbirliği teklifi, teknik destek talebi veya mesleki duyurunuzu toplulukla paylaşın.
                  Üyeler ilanlarını ücretsiz yayınlayabilir; 48 saat içinde moderasyon onayından geçer.
                </p>
              </div>
              <a
                href={`${mutfakUrl}/giris`}
                className="shrink-0 bg-white text-[var(--color-mavi)] font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                İlan Gönder
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

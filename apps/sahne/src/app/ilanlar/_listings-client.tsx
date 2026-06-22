'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { JobListing } from '@/lib/api';
import { useSahneAuth } from '@/contexts/SahneAuthContext';
import { ContactModal } from './_contact-modal';
import { ShareMenu } from '@/components/ShareMenu';

const FAVORITES_KEY = 'sahne_listing_favorites';
const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';



// Per-category design tokens
const CAT: Record<string, { label: string; accent: string; chip: string; dot: string; sidebarText: string }> = {
  isbirligi:        { label: 'İşbirliği',         accent: '#10b981', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400',  dot: 'bg-emerald-500', sidebarText: 'text-emerald-700 dark:text-emerald-400' },
  proje:            { label: 'Projeler',           accent: '#3b82f6', chip: 'bg-blue-50 text-blue-700 dark:bg-blue-900/25 dark:text-blue-400',              dot: 'bg-blue-500',    sidebarText: 'text-blue-700 dark:text-blue-400' },
  teknik_destek:    { label: 'Teknik Destek',      accent: '#06b6d4', chip: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/25 dark:text-cyan-400',              dot: 'bg-cyan-500',    sidebarText: 'text-cyan-700 dark:text-cyan-400' },
  freelancer:       { label: 'Freelancer',         accent: '#8b5cf6', chip: 'bg-violet-50 text-violet-700 dark:bg-violet-900/25 dark:text-violet-400',      dot: 'bg-violet-500',  sidebarText: 'text-violet-700 dark:text-violet-400' },
  teknoloji_ekipman:{ label: 'Teknoloji & Ekipman',accent: '#f59e0b', chip: 'bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-400',          dot: 'bg-amber-500',   sidebarText: 'text-amber-700 dark:text-amber-400' },
  ikinci_el:        { label: 'İkinci El & Satış',  accent: '#f97316', chip: 'bg-orange-50 text-orange-700 dark:bg-orange-900/25 dark:text-orange-400',      dot: 'bg-orange-500',  sidebarText: 'text-orange-700 dark:text-orange-400' },
  mesleki_arac:     { label: 'Mesleki Araçlar',    accent: '#14b8a6', chip: 'bg-teal-50 text-teal-700 dark:bg-teal-900/25 dark:text-teal-400',              dot: 'bg-teal-500',    sidebarText: 'text-teal-700 dark:text-teal-400' },
  firsat:           { label: 'Fırsatlar',          accent: '#f43f5e', chip: 'bg-rose-50 text-rose-700 dark:bg-rose-900/25 dark:text-rose-400',              dot: 'bg-rose-500',    sidebarText: 'text-rose-700 dark:text-rose-400' },
  duyuru:           { label: 'Duyurular',          accent: '#6366f1', chip: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/25 dark:text-indigo-400',      dot: 'bg-indigo-500',  sidebarText: 'text-indigo-700 dark:text-indigo-400' },
};

const CAT_ORDER = ['isbirligi','proje','teknik_destek','freelancer','teknoloji_ekipman','ikinci_el','mesleki_arac','firsat','duyuru'];

function getCat(type: string) {
  return CAT[type] ?? { label: type, accent: '#64748b', chip: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400', dot: 'bg-gray-400', sidebarText: 'text-gray-600 dark:text-slate-400' };
}

function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
}

// ─── Category-specific fact labels ───────────────────────────────────────────

const CAT_TYPE_FACT: Record<string, { label: string; value: string }> = {
  isbirligi:         { label: 'Aranıyor',  value: 'Çözüm Ortağı' },
  proje:             { label: 'Tür',       value: 'Proje Bazlı' },
  teknik_destek:     { label: 'Hizmet',    value: 'Teknik Destek' },
  freelancer:        { label: 'Çalışma',   value: 'Freelance' },
  teknoloji_ekipman: { label: 'Kategori',  value: 'Ekipman' },
  ikinci_el:         { label: 'Durum',     value: 'İkinci El' },
  mesleki_arac:      { label: 'Format',    value: 'Online Araç' },
  firsat:            { label: 'Tür',       value: 'Fırsat' },
  duyuru:            { label: 'Tür',       value: 'Duyuru' },
};

function getFacts(listing: JobListing): Array<{ label: string; value: string }> {
  const facts: Array<{ label: string; value: string }> = [];

  const catFact = CAT_TYPE_FACT[listing.type];
  if (catFact) facts.push(catFact);

  if (listing.location) {
    const loc = listing.location.trim();
    if (/online|uzaktan|remote/i.test(loc)) {
      // "Çalışma" label'ı daha önce eklendiyse güncelle, yoksa ekle
      const existing = facts.find(f => f.label === 'Çalışma');
      if (existing) { existing.value = 'Uzaktan'; }
      else { facts.push({ label: 'Çalışma', value: 'Uzaktan' }); }
    } else if (loc.includes('/')) {
      const [city, mode] = loc.split('/').map(s => s.trim());
      if (city) facts.push({ label: 'Konum', value: city });
      if (mode) {
        const existing = facts.find(f => f.label === 'Çalışma');
        if (existing) { existing.value = mode; }
        else { facts.push({ label: 'Çalışma', value: mode }); }
      }
    } else {
      facts.push({ label: 'Konum', value: loc });
    }
  }

  if (listing.price) {
    const priceLabel =
      listing.type === 'ikinci_el'         ? 'Fiyat'    :
      listing.type === 'teknoloji_ekipman'  ? 'Kiralama' :
      listing.type === 'mesleki_arac'       ? 'Erişim'   : 'Bütçe';
    facts.push({ label: priceLabel, value: listing.price });
  } else if (listing.type === 'mesleki_arac') {
    facts.push({ label: 'Erişim', value: 'Ücretsiz' });
  }

  return facts.slice(0, 4);
}

function StarIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function ListingCard({
  listing,
  isFavorited,
  isLoggedIn,
  onToggleFavorite,
  onContact,
}: {
  listing: JobListing;
  isFavorited: boolean;
  isLoggedIn: boolean;
  onToggleFavorite: (id: string) => void;
  onContact: (listing: JobListing) => void;
}) {
  const cat = getCat(listing.type);
  const days = daysLeft(listing.expiresAt);
  const isUrgent = days !== null && days <= 7 && days >= 0;
  if (days !== null && days < 0) return null;

  const publishedDate = listing.publishedAt
    ? new Date(listing.publishedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    : null;

  return (
    <article
      className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-tl-2xl rounded-bl-2xl"
        style={{ background: cat.accent }}
      />
      {/* Hover tint */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-2xl"
        style={{ background: cat.accent + '0d' }}
      />
      {/* Star — top right */}
      <button
        onClick={e => {
          e.stopPropagation();
          if (!isLoggedIn) {
            window.location.href = `${MUTFAK_URL}/giris?redirect=${encodeURIComponent(window.location.href)}`;
            return;
          }
          onToggleFavorite(listing.id);
        }}
        className={`absolute top-3.5 right-3.5 p-1.5 rounded-lg transition-all z-10 ${
          isFavorited
            ? 'text-amber-400 bg-amber-50 dark:bg-amber-900/25'
            : 'text-gray-300 dark:text-slate-600 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
        }`}
        title={isLoggedIn
          ? (isFavorited ? 'Favorilerden çıkar' : 'Favorilere ekle')
          : 'Favorilere eklemek için giriş yapın'}
      >
        <StarIcon filled={isFavorited} />
      </button>

      {/* Card body */}
      <div className="pl-5 pr-5 pt-4 pb-0 sm:pl-6 sm:pr-6 sm:pt-5">

        {/* Top row — badge + acil + tarih (yıldız için sağda boşluk) */}
        <div className="flex items-center gap-2 flex-wrap mb-3 pr-8">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${cat.chip}`}>
            {cat.label}
          </span>
          {isUrgent && (
            <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-900/25 dark:text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
              {days === 0 ? 'Bugün bitiyor' : `${days} gün kaldı`}
            </span>
          )}
          {publishedDate && (
            <span className="ml-auto text-xs text-gray-400 dark:text-slate-500 tabular-nums">
              {publishedDate}
            </span>
          )}
        </div>

        {/* İki sütun: sol içerik + sağ özet panel */}
        <div className="flex gap-5">

          {/* Sol — ana içerik */}
          <div className="flex-1 min-w-0">
            <Link href={`/ilanlar/${listing.id}`}>
              <h3 className="text-[15px] sm:text-base font-bold text-gray-900 dark:text-slate-100 leading-snug mb-1.5 group-hover:text-[var(--color-mavi)] dark:group-hover:text-[var(--color-teal)] transition-colors">
                {listing.title}
              </h3>
            </Link>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mb-3 text-sm">
              <span className="font-semibold text-gray-700 dark:text-slate-300">{listing.company}</span>
              {listing.location && (
                <span className="flex items-center gap-1 text-gray-400 dark:text-slate-500 text-xs">
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {listing.location}
                </span>
              )}
            </div>

            {listing.description && (
              <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                {listing.description}
              </p>
            )}

            {listing.tags && listing.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {listing.tags.slice(0, 5).map(t => (
                  <span key={t} className="text-[11px] bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded-md">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sağ — özet bilgi paneli */}
          {(() => {
            const facts = getFacts(listing);
            if (facts.length === 0) return null;
            return (
              <div
                className="hidden sm:flex flex-col gap-3 w-40 shrink-0 rounded-xl p-3.5 self-start mb-4"
                style={{ background: cat.accent + '0f' }}
              >
                {facts.map((f, i) => (
                  <div key={`${f.label}-${i}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                      style={{ color: cat.accent }}>
                      {f.label}
                    </p>
                    <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 leading-snug">
                      {f.value}
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}

        </div>
      </div>

      {/* Action bar */}
      <div className="mx-5 sm:mx-6 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2 py-3">
        <Link
          href={`/ilanlar/${listing.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-900 dark:hover:text-slate-200 transition-colors"
        >
          İlan Detayı
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <ShareMenu
          url={typeof window !== 'undefined' ? `${window.location.origin}/ilanlar/${listing.id}` : `/ilanlar/${listing.id}`}
          title={listing.title}
          size="sm"
        />
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {listing.applyEmail && (
            <button
              onClick={() => onContact(listing)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg text-white transition-colors cursor-pointer"
              style={{ background: cat.accent }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              İletişime Geç
            </button>
          )}
          {!listing.applyEmail && listing.applyUrl && (
            <a
              href={listing.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ background: cat.accent }}
            >
              İletişim
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
          {!listing.applyEmail && listing.contactPhone && (
            <a
              href={`tel:${listing.contactPhone}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {listing.contactPhone}
            </a>
          )}
        </div>

      </div>
    </article>
  );
}

export function ListingsClient({ allListings }: { allListings: JobListing[] }) {
  const { user } = useSahneAuth();
  const isLoggedIn = !!user;

  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
  const [activeLocation, setActiveLocation] = useState('');
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [sort, setSort] = useState<'newest' | 'expiring'>('newest');
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [contactListing, setContactListing] = useState<JobListing | null>(null);
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) setFavorites(new Set(JSON.parse(stored) as string[]));
    } catch { /* ignore */ }
  }, []);

  function toggleFavorite(id: string) {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  const locations = useMemo(() => {
    const locs = allListings.map(l => l.location).filter((l): l is string => !!l).map(l => l.trim());
    return [...new Set(locs)].sort();
  }, [allListings]);

  const counts = useMemo(() => {
    const now = Date.now();
    const active = allListings.filter(l => !l.expiresAt || new Date(l.expiresAt).getTime() > now);
    const map: Record<string, number> = {};
    for (const l of active) map[l.type] = (map[l.type] ?? 0) + 1;
    return map;
  }, [allListings]);

  const filtered = useMemo(() => {
    const now = Date.now();
    let list = allListings.filter(l => {
      if (l.expiresAt && new Date(l.expiresAt).getTime() < now) return false;
      if (showFavorites && !favorites.has(l.id)) return false;
      if (activeTypes.size > 0 && !activeTypes.has(l.type)) return false;
      if (query) {
        const q = query.toLowerCase();
        const haystack = `${l.title} ${l.company} ${l.description} ${l.tags.join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (activeLocation && l.location?.trim() !== activeLocation) return false;
      if (onlyUrgent) { const d = daysLeft(l.expiresAt); if (d === null || d > 7) return false; }
      return true;
    });
    if (sort === 'expiring') {
      list = [...list].sort((a, b) => {
        const da = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
        const db = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
        return da - db;
      });
    } else {
      list = [...list].sort((a, b) => {
        const da = a.publishedAt ? new Date(a.publishedAt).getTime() : new Date(a.createdAt).getTime();
        const db = b.publishedAt ? new Date(b.publishedAt).getTime() : new Date(b.createdAt).getTime();
        return db - da;
      });
    }
    return list;
  }, [allListings, activeTypes, activeLocation, onlyUrgent, sort, showFavorites, favorites, query]);

  const urgentCount = useMemo(() =>
    allListings.filter(l => { const d = daysLeft(l.expiresAt); return d !== null && d <= 7 && d >= 0; }).length
  , [allListings]);

  function toggleCat(val: string) {
    setActiveTypes(prev => { const next = new Set(prev); if (next.has(val)) { next.delete(val); } else { next.add(val); } return next; });
    setVisibleCount(10);
  }

  function resetFilters() {
    setActiveTypes(new Set()); setActiveLocation(''); setOnlyUrgent(false); setShowFavorites(false); setQuery(''); setVisibleCount(10);
  }

  const activeCatLabel = activeTypes.size === 0
    ? 'Tümü'
    : activeTypes.size === 1
      ? (getCat([...activeTypes][0]!).label)
      : `${activeTypes.size} kategori`;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex gap-8 items-start">

          {/* ── Sidebar ── */}
          <aside className="hidden lg:flex flex-col gap-5 w-60 shrink-0">

            {/* Categories */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Kategoriler</span>
                {activeTypes.size > 0 && (
                  <button onClick={() => setActiveTypes(new Set())} className="text-xs text-[var(--color-mavi)] hover:underline">
                    Temizle
                  </button>
                )}
              </div>
              <nav className="space-y-0.5">
                {CAT_ORDER.map(key => {
                  const c = getCat(key);
                  const count = counts[key] ?? 0;
                  if (count === 0) return null;
                  const isActive = activeTypes.has(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleCat(key)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-gray-900/5 dark:bg-white/5 font-semibold'
                          : 'font-medium hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {/* Color dot / checkmark */}
                      <span className="shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
                        style={isActive
                          ? { background: c.accent, borderColor: c.accent }
                          : { borderColor: '#cbd5e1' }
                        }>
                        {isActive && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className={isActive ? c.sidebarText : 'text-gray-600 dark:text-slate-400'}>{c.label}</span>
                      <span className="ml-auto text-xs tabular-nums text-gray-400 dark:text-slate-500">{count}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Location */}
            {locations.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 block mb-3">Konum</span>
                <div className="space-y-0.5">
                  {['', ...locations].map(loc => {
                    const isActive = activeLocation === loc;
                    return (
                      <button
                        key={loc || '__all'}
                        onClick={() => setActiveLocation(loc)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-[var(--color-mavi)] text-white font-semibold'
                            : 'text-gray-600 dark:text-slate-400 font-medium hover:bg-gray-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {loc ? (
                          <>
                            <svg className="w-3 h-3 shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {loc}
                          </>
                        ) : 'Tümü'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Extra filters */}
            {urgentCount > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 block mb-3">Filtreler</span>
                <label className="flex items-center gap-3 cursor-pointer px-1">
                  <div
                    role="checkbox"
                    aria-checked={onlyUrgent}
                    onClick={() => setOnlyUrgent(!onlyUrgent)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${onlyUrgent ? 'bg-red-500' : 'bg-gray-200 dark:bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${onlyUrgent ? 'translate-x-4' : ''}`} />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-slate-300">
                    Yakında bitiyor
                    <span className="ml-1 text-xs text-red-500 font-semibold">({urgentCount})</span>
                  </span>
                </label>
              </div>
            )}

            {/* Favorites */}
            {favorites.size > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4">
                <button
                  onClick={() => setShowFavorites(!showFavorites)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    showFavorites ? 'bg-amber-500 text-white' : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  }`}
                >
                  <StarIcon filled={showFavorites} />
                  Favorilerim
                  <span className={`ml-auto text-xs tabular-nums ${showFavorites ? 'text-white/70' : 'text-amber-500'}`}>{favorites.size}</span>
                </button>
              </div>
            )}


          </aside>

          {/* ── Main ── */}
          <div className="flex-1 min-w-0">

            {/* Mobile chips */}
            <div className="lg:hidden flex gap-2 mb-5 overflow-x-auto pb-1 [scrollbar-width:none]">
              <button
                onClick={() => setActiveTypes(new Set())}
                className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
                  activeTypes.size === 0
                    ? 'bg-[var(--color-mavi)] text-white border-[var(--color-mavi)]'
                    : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'
                }`}
              >
                Tümü
              </button>
              {CAT_ORDER.map(key => {
                const c = getCat(key);
                const count = counts[key] ?? 0;
                if (count === 0) return null;
                const isActive = activeTypes.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleCat(key)}
                    className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${isActive ? 'text-white border-transparent' : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'}`}
                    style={isActive ? { background: c.accent } : {}}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            {/* Arama */}
            <div className="relative mb-4">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setVisibleCount(10); }}
                placeholder="İlan, firma veya etiket ara…"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)]/30 focus:border-[var(--color-mavi)]/50 transition-colors"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                  {query ? `"${query}"` : activeCatLabel}
                  {activeLocation && <span className="font-normal text-gray-400 dark:text-slate-500"> · {activeLocation}</span>}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{filtered.length} ilan</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-1">
                {([
                  { key: 'newest', label: 'En Yeni' },
                  { key: 'expiring', label: 'Bitiyor' },
                ] as const).map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setSort(opt.key)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                      sort === opt.key
                        ? 'bg-[var(--color-mavi)] text-white shadow-sm'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Sonuç bulunamadı</p>
                <button
                  onClick={resetFilters}
                  className="text-xs text-[var(--color-mavi)] hover:underline mt-1"
                >
                  Filtreleri temizle
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {filtered.slice(0, visibleCount).map(listing => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      isFavorited={favorites.has(listing.id)}
                      isLoggedIn={isLoggedIn}
                      onToggleFavorite={toggleFavorite}
                      onContact={setContactListing}
                    />
                  ))}
                </div>
                {visibleCount < filtered.length && (
                  <button
                    onClick={() => setVisibleCount(c => c + 5)}
                    className="w-full mt-4 py-3 text-sm font-semibold text-[var(--color-mavi)] dark:text-[var(--color-teal)] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Daha Fazla Göster
                    <span className="text-gray-400 dark:text-slate-500 font-normal ml-1.5">
                      ({filtered.length - visibleCount} ilan daha)
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {contactListing && (
        <ContactModal listing={contactListing} onClose={() => setContactListing(null)} />
      )}
    </>
  );
}

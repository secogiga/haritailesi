'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { useSahneAuth } from '@/contexts/SahneAuthContext';
import { CartButton } from './CartDrawer';
import { cms, type SearchResult } from '@/lib/api';

const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const { user, isLoading, logout } = useSahneAuth();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  function openSearch() {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 30);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults(null);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
  }

  useEffect(() => {
    if (!searchOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') closeSearch(); }
    function onMouse(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) closeSearch();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouse);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onMouse); };
  }, [searchOpen]);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSearchResults(null); return; }
    setSearchLoading(true);
    const data = await cms.search(q.trim());
    setSearchResults(data);
    setSearchLoading(false);
  }, []);

  function onSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setSearchQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => void doSearch(q), 300);
  }

  const total = (searchResults?.events.length ?? 0) + (searchResults?.projects.length ?? 0);

  return (
    <header className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <svg viewBox="0 0 40 40" className="h-8 w-8" fill="none" aria-hidden="true">
              <rect width="40" height="40" rx="8" fill="#26496b" />
              <path d="M8 28 L20 12 L32 28" stroke="#66aca9" strokeWidth="3" strokeLinejoin="round" fill="none" />
              <path d="M14 28 L20 18 L26 28" stroke="white" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
            </svg>
            <div className="leading-tight">
              <span className="text-sm font-bold tracking-tight dark:text-slate-100" style={{ color: '#26496b' }}>haritailesi</span>
              <span className="ml-1.5 text-xs font-medium text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-wider">sahne</span>
            </div>
          </Link>

          {/* Desktop right */}
          <div className="hidden lg:flex items-center gap-3">

            {/* Inline expanding search */}
            <div ref={searchContainerRef} className="flex items-center relative">
              {/* Input — expands to the left, hidden until open */}
              <div
                style={{ overflow: 'clip' }}
                className={`transition-all duration-200 ${
                  searchOpen ? 'w-52 opacity-100 mr-1' : 'w-0 opacity-0 pointer-events-none'
                }`}
              >
                <div className="flex items-center gap-2 px-3 h-[34px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm">
                  <svg className="w-4 h-4 shrink-0 text-[#26496b] dark:text-[#66aca9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={onSearchInput}
                    placeholder="Site içinde ara…"
                    style={{ outline: 'none', boxShadow: 'none' }}
                    className="no-focus-ring flex-1 min-w-0 text-sm text-[#26496b] dark:text-slate-200 placeholder:text-[#26496b]/50 dark:placeholder:text-slate-500 bg-transparent border-0 p-0"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(''); setSearchResults(null); searchInputRef.current?.focus(); }}
                      className="shrink-0 text-[#26496b]/30 hover:text-[#26496b]/70 dark:text-slate-600 dark:hover:text-slate-400 transition-colors"
                      aria-label="Temizle"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Magnifying glass / close icon */}
              <button
                onClick={searchOpen ? closeSearch : openSearch}
                className="p-2 rounded-lg text-[#26496b]/50 dark:text-slate-500 hover:text-[#26496b] dark:hover:text-slate-300 hover:bg-[#26496b]/[0.06] dark:hover:bg-slate-800 transition-colors"
                aria-label={searchOpen ? 'Aramayı kapat' : 'Ara'}
              >
                {searchLoading ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : searchOpen ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>

              {/* Results dropdown */}
              {searchOpen && searchResults && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden z-50">
                  {total === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-slate-500">Sonuç bulunamadı</p>
                  ) : (
                    <div className="max-h-[60vh] overflow-y-auto py-1.5">
                      {searchResults.events.map(e => (
                        <Link key={e.id} href={`/etkinlikler/${e.slug}`} onClick={closeSearch}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                          <div className="w-6 h-6 rounded-md bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-800 dark:text-slate-200 truncate">{e.title}</p>
                        </Link>
                      ))}
                      {searchResults.projects.map(p => (
                        <Link key={p.id} href={`/projeler/${p.slug}`} onClick={closeSearch}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                          <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-800 dark:text-slate-200 truncate">{p.title}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pusula */}
            <Link
              href="/haritailesipusula"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-[#26496b] dark:text-[#66aca9] bg-[#26496b]/[0.07] dark:bg-[#66aca9]/10 border border-[#26496b]/20 dark:border-[#66aca9]/25 rounded-full hover:bg-[#26496b]/[0.12] dark:hover:bg-[#66aca9]/15 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="2" />
                <path strokeLinecap="round" d="M12 3v6M12 15v6M3 12h6M15 12h6" />
              </svg>
              Çözüm Arıyorum
            </Link>

            <div className="flex items-center gap-0.5">
              <ThemeToggle />
              <CartButton />
            </div>

            <div className="w-px h-5 bg-gray-200 dark:bg-slate-700" />

            {isLoading ? (
              <div className="w-20 h-8 bg-gray-100 dark:bg-slate-800 rounded-full animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-1">
                <a href={MUTFAK_URL}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-[var(--color-mavi)] dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  {user.profile?.avatarUrl ? (
                    <img src={user.profile.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[var(--color-mavi)] flex items-center justify-center text-white text-[10px] font-bold">
                      {(user.profile?.displayName ?? user.email)[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[120px] truncate">{user.profile?.displayName ?? user.email}</span>
                </a>
                <button onClick={() => void logout()}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  title="Çıkış Yap" aria-label="Çıkış Yap">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <a href={`${process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org'}/giris`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors">
                  Giriş Yap
                </a>
                <a href={`${process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org'}/uye-ol`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-full transition-colors">
                  Üye Ol
                </a>
              </>
            )}
          </div>

          {/* Mobile */}
          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-md text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800"
              aria-label="Menü">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-1">
          <Link href="/haritailesipusula" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-semibold text-[#26496b] dark:text-[#66aca9]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2" />
              <path strokeLinecap="round" d="M12 3v6M12 15v6M3 12h6M15 12h6" />
            </svg>
            Çözüm Arıyorum
          </Link>
          <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex flex-col gap-2">
            {user ? (
              <>
                <a href={MUTFAK_URL} onClick={() => setMobileOpen(false)}
                  className="py-2 text-sm font-medium text-gray-700 dark:text-slate-300 text-center">
                  {user.profile?.displayName ?? user.email} — Mutfak
                </a>
                <button onClick={() => { void logout(); setMobileOpen(false); }}
                  className="py-2.5 text-sm font-semibold text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 rounded-lg text-center">
                  Çıkış Yap
                </button>
              </>
            ) : (
              <>
                <a href={`${process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org'}/giris`}
                  target="_blank" rel="noopener noreferrer"
                  className="py-2 text-sm font-medium text-gray-600 dark:text-slate-400 text-center">
                  Giriş Yap
                </a>
                <a href={`${process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org'}/uye-ol`}
                  target="_blank" rel="noopener noreferrer"
                  className="py-2.5 text-sm font-semibold text-white bg-[var(--color-mavi)] rounded-lg text-center">
                  Üye Ol
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

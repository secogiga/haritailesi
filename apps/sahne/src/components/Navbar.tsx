'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { SearchModal } from './SearchModal';
import { useSahneAuth } from '@/contexts/SahneAuthContext';

const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, isLoading, logout } = useSahneAuth();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
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

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-slate-400">
            <Link href="/etkinlikler" className="px-3 py-2 rounded-md hover:text-[var(--color-mavi)] dark:hover:text-blue-400 transition-colors">Etkinlikler</Link>
            <Link href="/egitim" className="px-3 py-2 rounded-md hover:text-[var(--color-mavi)] dark:hover:text-blue-400 transition-colors">Eğitim</Link>
            <Link href="/magaza" className="px-3 py-2 rounded-md hover:text-[var(--color-mavi)] dark:hover:text-blue-400 transition-colors">Mağaza</Link>
            <span className="flex items-center gap-1 px-3 py-2 text-gray-300 dark:text-slate-600 cursor-default select-none">
              Üyeler
              <span className="text-[9px] font-bold bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 px-1 py-0.5 rounded uppercase tracking-wide">Yakında</span>
            </span>
            <Link href="/mentorluk" className="px-3 py-2 rounded-md hover:text-[var(--color-mavi)] dark:hover:text-blue-400 transition-colors">Mentorluk</Link>
            <Link href="/soru-cevap" className="px-3 py-2 rounded-md hover:text-[var(--color-mavi)] dark:hover:text-blue-400 transition-colors">Soru &amp; Cevap</Link>
          </nav>

          {/* Right side: search + theme toggle + auth */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 dark:text-slate-500 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Ara</span>
              <kbd className="text-xs font-mono bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">⌘K</kbd>
            </button>
            <ThemeToggle />
            <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-1" />
            {isLoading ? (
              <div className="w-20 h-8 bg-gray-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <a
                  href={MUTFAK_URL}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-[var(--color-mavi)] dark:hover:text-blue-400 transition-colors"
                >
                  {user.profile?.avatarUrl ? (
                    <img
                      src={user.profile.avatarUrl}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[var(--color-mavi)] flex items-center justify-center text-white text-[10px] font-bold">
                      {(user.profile?.displayName ?? user.email)[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[120px] truncate">
                    {user.profile?.displayName ?? user.email}
                  </span>
                </a>
                <button
                  onClick={() => void logout()}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors px-1"
                  title="Çıkış Yap"
                >
                  Çıkış
                </button>
              </div>
            ) : (
              <>
                <a
                  href={`${process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org'}/giris`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-[var(--color-mavi)] dark:hover:text-blue-400 transition-colors px-2"
                >
                  Giriş Yap
                </a>
                <a
                  href={`${process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org'}/uye-ol`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-lg transition-colors"
                >
                  Üye Ol
                </a>
              </>
            )}
          </div>

          {/* Mobile: search + theme toggle + hamburger */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-md text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800"
              aria-label="Ara"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-md text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800"
              aria-label="Menü"
            >
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
          {[
            { label: 'Etkinlikler', href: '/etkinlikler' },
            { label: 'Eğitim', href: '/egitim' },
            { label: 'Mağaza', href: '/magaza' },
            { label: 'Üyeler', href: '/uyeler' },
            { label: 'Mentorluk', href: '/mentorluk' },
            { label: 'Soru & Cevap', href: '/soru-cevap' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-[var(--color-mavi)] dark:hover:text-blue-400"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex flex-col gap-2">
            {user ? (
              <>
                <a
                  href={MUTFAK_URL}
                  className="py-2 text-sm font-medium text-gray-700 dark:text-slate-300 text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  {user.profile?.displayName ?? user.email} — Mutfak
                </a>
                <button
                  onClick={() => { void logout(); setMobileOpen(false); }}
                  className="py-2.5 text-sm font-semibold text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 rounded-lg text-center"
                >
                  Çıkış Yap
                </button>
              </>
            ) : (
              <>
                <a
                  href={`${process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org'}/giris`}
                  target="_blank" rel="noopener noreferrer"
                  className="py-2 text-sm font-medium text-gray-600 dark:text-slate-400 text-center"
                >
                  Giriş Yap
                </a>
                <a
                  href={`${process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org'}/uye-ol`}
                  target="_blank" rel="noopener noreferrer"
                  className="py-2.5 text-sm font-semibold text-white bg-[var(--color-mavi)] rounded-lg text-center"
                >
                  Üye Ol
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
    {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}

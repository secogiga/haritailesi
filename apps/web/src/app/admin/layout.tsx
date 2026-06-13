'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isLoggedIn, logout } from '@/lib/site-admin-api';

const NAV = [
  { href: '/admin/ana-sayfa',       label: 'Ana Sayfa',       icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/admin/etkinlikler',     label: 'Etkinlikler',     icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/admin/menu',            label: 'Menü',             icon: 'M4 6h16M4 12h16M4 18h7' },
  { href: '/admin/sayfalar',        label: 'Sayfalar',         icon: 'M4 6h16M4 10h16M4 14h10M4 18h6' },
  { href: '/admin/yonetim-kurulu',  label: 'Yönetim Kurulu',  icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname === '/admin/giris') { setReady(true); return; }
    if (!isLoggedIn()) { router.replace('/admin/giris'); return; }
    setReady(true);
  }, [pathname, router]);

  useEffect(() => { setOpen(false); }, [pathname]);

  function handleLogout() {
    logout();
    router.replace('/admin/giris');
  }

  if (!ready) return null;
  if (pathname === '/admin/giris') return <>{children}</>;

  function Sidebar({ onClose }: { onClose?: () => void }) {
    return (
      <>
        <div className="px-5 py-5 border-b border-white/10">
          <span className="text-white font-bold text-lg tracking-tight">haritailesi</span>
          <span className="block text-white/50 text-xs mt-0.5">Vakıf Site Yönetimi</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">İçerik</p>
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <a
            href={process.env.NEXT_PUBLIC_MUTFAK_ADMIN_URL ?? 'http://localhost:3004'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Platform Admin ↗
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Çıkış Yap
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden md:flex w-56 bg-[#2d6b68] flex-col shrink-0 fixed h-full z-30">
        <Sidebar />
      </aside>

      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative z-50 w-64 bg-[#2d6b68] flex flex-col h-full">
            <Sidebar onClose={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col md:ml-56">
        <header className="md:hidden flex items-center gap-3 bg-[#2d6b68] px-4 py-3 shrink-0">
          <button onClick={() => setOpen(true)} className="text-white/80 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-white font-bold">haritailesi</span>
          <span className="text-white/50 text-xs">Site Admin</span>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

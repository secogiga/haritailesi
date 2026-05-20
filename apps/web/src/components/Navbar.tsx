'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useAuth } from '@/contexts/AuthContext';

export type NavSubItem = { label: string; href: string };
export type NavItem = { label: string; href: string; sub: NavSubItem[] | null };

const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    label: 'Hakkımızda',
    href: '/hakkimizda',
    sub: [
      { label: 'Biz Kimiz?', href: '/hakkimizda' },
      { label: 'Yönetim Kurulu', href: '/hakkimizda/yonetim' },
      { label: 'Tüzük & Belgeler', href: '/hakkimizda/tuzuk' },
      { label: 'Kurumsal Kimlik', href: '/hakkimizda/kimlik' },
    ],
  },
  {
    label: 'Üyelik',
    href: '/uye-ol',
    sub: [
      { label: 'Neden Üye Olmalıyım?', href: '/uye-ol' },
      { label: 'Bireysel Üyelik', href: '/uye-ol/bireysel' },
      { label: 'Kurumsal Üyelik', href: '/uye-ol/kurumsal' },
    ],
  },
  {
    label: 'Haritailesi Genç',
    href: '/genc',
    sub: [
      { label: 'Haritailesi Genç Nedir?', href: '/genc' },
      { label: 'Üyelik Başvurusu', href: '/genc/basvuru' },
      { label: 'Mesleğin Gelecekleri', href: '/meslegin-gelecekleri' },
      { label: 'Öğrenci Kulüpleri', href: '/genc/ogrenci-kulupler' },
    ],
  },
  {
    label: 'Projeler',
    href: '/projeler',
    sub: null,
  },
  {
    label: 'Etkinlikler',
    href: '/etkinlikler',
    sub: null,
  },
  {
    label: 'İletişim',
    href: '/iletisim',
    sub: null,
  },
  {
    label: 'Bağış Yap',
    href: '/bagis',
    sub: null,
  },
];

export default function Navbar({ navItems }: { navItems?: NavItem[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSub, setOpenSub] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const items = navItems ?? DEFAULT_NAV_ITEMS;

  async function handleLogout() {
    await logout();
    router.push('/' as Route);
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 shrink-0">
            <Image src="/2.svg" alt="Haritailesi" width={38} height={38} className="h-9 w-auto" priority />
            <span className="text-[1.3rem] font-bold tracking-tight leading-none" style={{ marginLeft: '-10px' }}>
              <span style={{ color: '#26496b' }}>harit</span><span style={{ color: '#66aca9' }}>a</span><span style={{ color: '#26496b' }}>ilesi</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {items.map((item) => (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href as Route}
                  className={
                    item.href === '/bagis'
                      ? 'flex items-center gap-1 px-4 py-2 text-sm font-semibold text-white bg-[var(--color-altin)] hover:bg-yellow-600 rounded-lg transition-colors ml-2'
                      : `flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          pathname.startsWith(item.href) && item.href !== '/'
                            ? 'text-[var(--color-mavi)]'
                            : 'text-gray-600 hover:text-[var(--color-mavi)]'
                        }`
                  }
                >
                  {item.label}
                  {item.sub && (
                    <svg className="w-3 h-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </Link>
                {item.sub && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    {item.sub.map((s) => (
                      <Link
                        key={s.href}
                        href={s.href as Route}
                        className="block px-4 py-2.5 text-sm text-gray-600 hover:text-[var(--color-mavi)] hover:bg-gray-50 transition-colors"
                      >
                        {s.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Sağ: Auth Butonları */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href={'/hesabim' as Route}
                  className="text-sm font-medium text-gray-600 hover:text-[var(--color-mavi)] transition-colors"
                >
                  {user.profile?.displayName ?? 'Hesabım'}
                </Link>
                <button
                  onClick={() => void handleLogout()}
                  className="px-4 py-2 text-sm font-semibold text-[var(--color-mavi)] border border-[var(--color-mavi)] rounded-lg hover:bg-[var(--color-mavi)]/5 transition-colors"
                >
                  Çıkış Yap
                </button>
              </>
            ) : (
              <>
                <Link
                  href={'/giris' as Route}
                  className="text-sm font-medium text-gray-600 hover:text-[var(--color-mavi)] transition-colors"
                >
                  Giriş Yap
                </Link>
                <Link
                  href={'/uye-ol' as Route}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-lg transition-colors"
                >
                  Üye Ol
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
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

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {items.map((item) => (
            <div key={item.href}>
              <div className="flex items-center justify-between">
                <Link
                  href={item.href as Route}
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 py-2 text-sm font-medium text-gray-700"
                >
                  {item.label}
                </Link>
                {item.sub && (
                  <button
                    onClick={() => setOpenSub(openSub === item.href ? null : item.href)}
                    className="p-2 text-gray-400"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${openSub === item.href ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
              {item.sub && openSub === item.href && (
                <div className="pl-4 pb-2 space-y-1">
                  {item.sub.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href as Route}
                      onClick={() => setMobileOpen(false)}
                      className="block py-1.5 text-sm text-gray-500"
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  href={'/hesabim' as Route}
                  onClick={() => setMobileOpen(false)}
                  className="py-2 text-sm font-medium text-gray-600 text-center"
                >
                  {user.profile?.displayName ?? 'Hesabım'}
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); void handleLogout(); }}
                  className="py-2.5 text-sm font-semibold text-[var(--color-mavi)] border border-[var(--color-mavi)] rounded-lg text-center"
                >
                  Çıkış Yap
                </button>
              </>
            ) : (
              <>
                <Link
                  href={'/giris' as Route}
                  onClick={() => setMobileOpen(false)}
                  className="py-2 text-sm font-medium text-gray-600 text-center"
                >
                  Giriş Yap
                </Link>
                <Link
                  href={'/uye-ol' as Route}
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-sm font-semibold text-white bg-[var(--color-mavi)] rounded-lg text-center"
                >
                  Üye Ol
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

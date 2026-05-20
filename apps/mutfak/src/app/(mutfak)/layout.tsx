'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/NotificationBell';
import { SidebarContent, NAV } from '@/components/Sidebar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { GlobalSearch } from '@/components/GlobalSearch';
import { useToken } from '@/hooks/useToken';
import { TIER_LABELS } from '@/lib/constants';
import { mutfakApi } from '@/lib/api';

const BOTTOM_NAV_HREFS = ['/akis', '/uyeler', '/mentorluk', '/mesajlar', '/hesabim'];
const BOTTOM_NAV = BOTTOM_NAV_HREFS.map((href) => NAV.find((n) => n.href === href)!).filter(Boolean);

function ProfileBanner({ displayName, profession, bio }: { displayName: string | undefined; profession: string | null | undefined; bio: string | null | undefined }) {
  const [dismissed, setDismissed] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('mutfak_profile_banner') === '1',
  );
  const incomplete = !displayName || !profession || !bio;
  if (!incomplete || dismissed) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-800 shrink-0">
      <svg className="w-4 h-4 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="flex-1">Profilinizi tamamlayarak topluluğa kendinizi tanıtın.</span>
      <a href="/hesabim" className="font-semibold underline hover:text-amber-900 transition-colors shrink-0">Tamamla</a>
      <button
        onClick={() => { localStorage.setItem('mutfak_profile_banner', '1'); setDismissed(true); }}
        className="text-amber-500 hover:text-amber-700 transition-colors shrink-0"
        aria-label="Kapat"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function MutfakLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const token = useToken();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', token],
    queryFn: () => mutfakApi.getNotifications(token!),
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  const { data: dmThreads = [] } = useQuery({
    queryKey: ['dm-threads', token],
    queryFn: () => mutfakApi.getThreads(token!),
    enabled: !!token,
    staleTime: 30_000,
  });
  const dmUnreadCount = dmThreads.reduce((sum, t) => sum + (t.unreadCount ?? 0), 0);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/giris');
    }
    if (!isLoading && user) {
      const onboardingDone = typeof window !== 'undefined' && localStorage.getItem('mutfak_onboarding_done') === '1';
      const baslangicSeen = typeof window !== 'undefined' && localStorage.getItem('mutfak_baslangic_seen') === '1';
      const blockedPaths = ['/onboarding', '/baslangic'];
      if (!blockedPaths.includes(pathname)) {
        if (!onboardingDone && !user.profile?.displayName) {
          router.replace('/onboarding');
        } else if (onboardingDone && !baslangicSeen) {
          router.replace('/baslangic');
        }
      }
    }
  }, [user, isLoading, router, pathname]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!token) return;
    void mutfakApi.heartbeat(token);
    const id = setInterval(() => void mutfakApi.heartbeat(token), 60_000);
    return () => clearInterval(id);
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#26496b] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  async function handleLogout() {
    await logout();
    router.replace('/giris');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Skip-to-content link for keyboard/screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-[#26496b] focus:text-white focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-lg"
      >
        İçeriğe Geç
      </a>
      {/* ── Desktop sidebar ── icon-only on md, full on lg ── */}
      <aside className="hidden md:flex md:w-16 lg:w-60 bg-[#26496b] flex-col shrink-0 transition-all">
        <SidebarContent
          user={{ ...user, lastLoginAt: user.lastLoginAt }}
          token={token}
          onLogout={() => void handleLogout()}
        />
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-[#26496b] flex flex-col z-50 shadow-xl">
            <SidebarContent
              user={{ ...user, lastLoginAt: user.lastLoginAt }}
              token={token}
              onClose={() => setSidebarOpen(false)}
              onLogout={() => void handleLogout()}
            />
          </aside>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between bg-[#26496b] px-4 py-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/70 hover:text-white p-1"
            aria-label="Menüyü aç"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-base font-bold tracking-tight">
            <span className="text-white">harit</span><span className="text-[#66aca9]">a</span><span className="text-white">ilesi</span>
            <span className="text-white/40 text-xs font-medium ml-1">Mutfak</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('haritailesi:search:open'))}
              className="text-white/70 hover:text-white p-1"
              aria-label="Ara"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <NotificationBell token={token} />
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-xs">
              {(user.profile?.displayName ?? user.email)[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Profile completion banner — shown on all pages until dismissed */}
        <ProfileBanner
          displayName={user.profile?.displayName}
          profession={user.profile?.profession}
          bio={user.profile?.bio}
        />

        {/* Breadcrumb — only shown on nested routes */}
        <Breadcrumb />

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>

        {/* ── Mobile bottom navigation ── */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30 flex pb-[env(safe-area-inset-bottom)]">
          {BOTTOM_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const badge = item.href === '/hesabim' ? unreadNotifCount : item.href === '/mesajlar' ? dmUnreadCount : 0;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors relative ${
                  active ? 'text-[#26496b]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#66aca9]" />
                )}
                <span className={`relative ${active ? 'text-[#26496b]' : 'text-gray-400'}`}>
                  {item.icon}
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </span>
                <span className={active ? 'font-semibold' : ''}>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>

      {/* GlobalSearch modal — Cmd+K */}
      <GlobalSearch />

      {/* Scroll-to-top button */}
      <ScrollToTop />
    </div>
  );
}

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main) return;
    const onScroll = () => setVisible(main.scrollTop > 400);
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => main.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-10 h-10 flex items-center justify-center bg-[#26496b] text-white rounded-full shadow-lg hover:bg-[#1e3a56] transition-all"
      aria-label="Yukarı çık"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  );
}

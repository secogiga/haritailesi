'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NotificationBell } from './NotificationBell';
import { TIER_LABELS } from '@/lib/constants';
import { ThemeToggle } from './ThemeToggle';
import { SahneWidget } from './SahneWidget';
import { HelpModal } from './HelpModal';
import { mutfakApi } from '@/lib/api';

// ── Icons ─────────────────────────────────────────────────────────────────────

const Icons = {
  akis: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
  uyeler: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  mesajlar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  mentorluk: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  etkinlikler: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  yarismalar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  magaza: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  egitimler: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  ),
  ilanlar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  sorular: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  sinavlar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  anketler: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  profilim: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  isbirligi: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  talep: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  ),
  ayarlar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  kulubum: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  yetenekler: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  haberita: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
};

// ── Nav structure ─────────────────────────────────────────────────────────────

export type NavItem = { label: string; href: string; icon: React.ReactNode };

export const KULUBUM_ITEM: NavItem = { label: 'Kulübüm', href: '/kulubum', icon: Icons.kulubum };

export const NAV_GROUPS: Array<{ id: string; label: string; items: NavItem[] }> = [
  {
    id: 'topluluk',
    label: 'Topluluk',
    items: [
      { label: 'Akış', href: '/akis', icon: Icons.akis },
      { label: 'Üyeler', href: '/uyeler', icon: Icons.uyeler },
      { label: 'Mesajlar', href: '/mesajlar', icon: Icons.mesajlar },
    ],
  },
  {
    id: 'aktiviteler',
    label: 'Aktiviteler',
    items: [
      { label: 'Mentorluk', href: '/mentorluk', icon: Icons.mentorluk },
      { label: 'Etkinlikler', href: '/etkinlikler', icon: Icons.etkinlikler },
      { label: 'Yarışmalar', href: '/yarismalar', icon: Icons.yarismalar },
    ],
  },
  {
    id: 'kaynaklar',
    label: 'Kaynaklar',
    items: [
      { label: 'Mağaza', href: '/magaza', icon: Icons.magaza },
      { label: 'Eğitimler', href: '/egitimler', icon: Icons.egitimler },
      { label: 'İlan Panosu', href: '/ilanlar', icon: Icons.ilanlar },
      { label: 'Soru & Cevap', href: '/sorular', icon: Icons.sorular },
      { label: 'Sınavlar', href: '/sinavlar', icon: Icons.sinavlar },
      { label: 'Anketler', href: '/anketler', icon: Icons.anketler },
      { label: 'Haberita', href: '/haberita', icon: Icons.haberita },
    ],
  },
  {
    id: 'katkim',
    label: 'Katkım',
    items: [
      { label: 'Yeteneğim', href: '/yetenekler', icon: Icons.yetenekler },
      { label: 'Reklam & İşbirliği', href: '/isbirligi', icon: Icons.isbirligi },
      { label: 'Talep & Görüş', href: '/talep', icon: Icons.talep },
    ],
  },
  {
    id: 'hesabim',
    label: 'Hesabım',
    items: [
      { label: 'Profilim', href: '/hesabim', icon: Icons.profilim },
      { label: 'Ayarlar', href: '/ayarlar', icon: Icons.ayarlar },
    ],
  },
];

// Flat export for bottom nav and other consumers
export const NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

// ── Topo pattern ──────────────────────────────────────────────────────────────

interface Props {
  user: { email: string; membershipTier: string; lastLoginAt?: string | null; profile: { displayName: string } | null };
  token: string;
  onClose?: () => void;
  onLogout: () => void;
}

function TopoPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern id="topo" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <ellipse cx="60" cy="60" rx="55" ry="40" fill="none" stroke="white" strokeWidth="1" />
          <ellipse cx="60" cy="60" rx="42" ry="28" fill="none" stroke="white" strokeWidth="1" />
          <ellipse cx="60" cy="60" rx="29" ry="18" fill="none" stroke="white" strokeWidth="1" />
          <ellipse cx="60" cy="60" rx="16" ry="10" fill="none" stroke="white" strokeWidth="1" />
          <ellipse cx="60" cy="60" rx="6" ry="4" fill="none" stroke="white" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#topo)" />
    </svg>
  );
}

// ── Chevron icon ──────────────────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 text-white/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ── SidebarContent ────────────────────────────────────────────────────────────

export function SidebarContent({ user, token, onClose, onLogout }: Props) {
  const pathname = usePathname();
  const [showHelp, setShowHelp] = useState(false);

  const isGenc = user.membershipTier === 'haritailesi_genc';
  const navGroups = NAV_GROUPS.map(g =>
    g.id === 'hesabim' && isGenc
      ? { ...g, items: [KULUBUM_ITEM, ...g.items] }
      : g
  );
  const flatNav = navGroups.flatMap(g => g.items);

  // Open the group that contains the active route; Topluluk and Aktiviteler open by default
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const activeGroupId = navGroups.find((g) =>
      g.items.some((i) => pathname === i.href || pathname.startsWith(i.href + '/')),
    )?.id;
    const initial = new Set(['topluluk', 'aktiviteler']);
    if (activeGroupId) initial.add(activeGroupId);
    return initial;
  });

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const { data: threads = [] } = useQuery({
    queryKey: ['dm-threads', token],
    queryFn: () => mutfakApi.getThreads(token),
    staleTime: 30_000,
    enabled: !!token,
  });
  const dmUnread = threads.reduce((sum, t) => sum + (t.unreadCount ?? 0), 0);

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <TopoPattern />

      {/* Logo */}
      <div className="relative px-3 py-5 border-b border-white/10 flex items-center justify-between lg:px-5">
        <div className="hidden lg:block">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-white">harit</span><span className="text-[#66aca9]">a</span><span className="text-white">ilesi</span>
          </span>
          <span className="block text-white/40 text-xs mt-0.5 font-medium">Mutfak</span>
        </div>
        <div className="flex items-center gap-1 mx-auto lg:mx-0">
          <button
            onClick={() => document.dispatchEvent(new CustomEvent('haritailesi:search:open'))}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Ara"
            title="Ara (Ctrl+K)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <NotificationBell token={token} />
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-white/60 hover:text-white p-1"
              aria-label="Menüyü kapat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 px-2 py-3 lg:px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">

        {/* ── Large screen: collapsible groups ── */}
        <div className="hidden lg:block space-y-1">
          {navGroups.map((group) => {
            const isOpen = openGroups.has(group.id);
            const hasActive = group.items.some((i: NavItem) => pathname === i.href || pathname.startsWith(i.href + '/'));

            return (
              <div key={group.id}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors ${
                    hasActive ? 'text-white/80' : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-widest">
                    {group.label}
                  </span>
                  <Chevron open={isOpen} />
                </button>

                {/* Items */}
                {isOpen && (
                  <div className="space-y-0.5 mb-1">
                    {group.items.map((item) => {
                      const active = pathname === item.href || pathname.startsWith(item.href + '/');
                      const badge = item.href === '/mesajlar' && dmUnread > 0 ? dmUnread : 0;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          {...(onClose ? { onClick: onClose } : {})}
                          title={item.label}
                          className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 border-l-[3px] ${
                            active
                              ? 'border-[#66aca9] bg-white/15 text-white'
                              : 'border-transparent text-white/60 hover:bg-white/10 hover:text-white hover:translate-x-0.5'
                          }`}
                        >
                          <span className="relative shrink-0">
                            {item.icon}
                            {badge > 0 && (
                              <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                                {badge > 9 ? '9+' : badge}
                              </span>
                            )}
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Tablet / mobile: flat icon list (no group labels) ── */}
        <div className="lg:hidden space-y-0.5">
          {flatNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const badge = item.href === '/mesajlar' && dmUnread > 0 ? dmUnread : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                {...(onClose ? { onClick: onClose } : {})}
                title={item.label}
                className={`relative flex items-center justify-center p-2.5 rounded-xl transition-all duration-150 border-l-[3px] ${
                  active
                    ? 'border-[#66aca9] bg-white/15 text-white'
                    : 'border-transparent text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="relative shrink-0">
                  {item.icon}
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sahne events bridge */}
      <SahneWidget />

      {/* User footer */}
      <div className="relative px-2 py-4 border-t border-white/10 lg:px-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative shrink-0 mx-auto lg:mx-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">
              {(user.profile?.displayName ?? user.email)[0]?.toUpperCase()}
            </div>
            {user.lastLoginAt && Date.now() - new Date(user.lastLoginAt).getTime() < 3 * 24 * 60 * 60 * 1000 && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#26496b] rounded-full" />
            )}
          </div>
          <div className="min-w-0 hidden lg:block">
            <div className="text-sm font-medium text-white truncate">
              {user.profile?.displayName ?? user.email}
            </div>
            <div className="text-xs text-white/50 truncate">
              {TIER_LABELS[user.membershipTier] ?? user.membershipTier}
            </div>
          </div>
        </div>
        <div className="hidden lg:block">
          <ThemeToggle />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={onLogout}
              className="flex-1 text-left text-xs text-white/50 hover:text-white/80 transition-colors py-1"
            >
              Çıkış Yap
            </button>
            <button
              onClick={() => setShowHelp(true)}
              className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
              aria-label="Yardım"
              title="Yardım & SSS"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <p className="mt-3 text-[9px] text-white/20 font-mono tracking-wider select-none">
            39°55&apos;N 32°51&apos;E · TKGM
          </p>
        </div>
        {/* Tablet: compact icon buttons */}
        <div className="flex flex-col items-center gap-2 lg:hidden mt-1">
          <button
            onClick={() => setShowHelp(true)}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
            title="Yardım"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
            title="Çıkış Yap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

'use client';

import { usePathname } from 'next/navigation';

const ROUTE_LABELS: Record<string, string> = {
  akis: 'Akış',
  uyeler: 'Üyeler',
  mentorluk: 'Mentorluk',
  hesabim: 'Profilim',
  bildirimler: 'Bildirimler',
  ayarlar: 'Ayarlar',
  mesajlar: 'Mesajlar',
  onboarding: 'Hoş Geldiniz',
  seanslarim: 'Seanslarım',
};

interface BreadcrumbProps {
  /** Override leaf label (e.g. post title or member display name) */
  leafLabel?: string;
}

export function Breadcrumb({ leafLabel }: BreadcrumbProps) {
  const pathname = usePathname();

  // Split path into segments, ignore empty strings
  const segments = pathname.split('/').filter(Boolean);

  // We only show breadcrumb when there are at least 2 segments (e.g. /akis/[id])
  if (segments.length < 2) return null;

  // Build crumb list
  const crumbs: { label: string; href: string }[] = [{ label: 'Ana Sayfa', href: '/akis' }];

  let path = '';
  segments.forEach((seg, i) => {
    path += `/${seg}`;
    const isLast = i === segments.length - 1;
    const isUUID = /^[0-9a-f-]{36}$/i.test(seg);

    if (isLast && (leafLabel ?? isUUID)) {
      crumbs.push({ label: leafLabel ?? '...', href: path });
    } else if (!isUUID) {
      const label = ROUTE_LABELS[seg] ?? seg;
      crumbs.push({ label, href: path });
    }
  });

  if (crumbs.length < 2) return null;

  return (
    <nav aria-label="Gezinme yolu" className="flex items-center gap-1.5 px-4 py-2 text-xs text-gray-400 border-b border-gray-100 bg-white/50 backdrop-blur-sm shrink-0">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && (
              <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {isLast ? (
              <span className="text-gray-600 font-medium truncate max-w-[160px]">{crumb.label}</span>
            ) : (
              <a
                href={crumb.href}
                className="hover:text-[#26496b] transition-colors truncate max-w-[120px]"
              >
                {crumb.label}
              </a>
            )}
          </span>
        );
      })}
    </nav>
  );
}

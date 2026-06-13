'use client';

import { usePathname } from 'next/navigation';
import type { NavItem } from './Navbar';

export function SiteShell({
  children,
  navbar,
  footer,
}: {
  children: React.ReactNode;
  navbar: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) return <>{children}</>;

  return (
    <>
      {navbar}
      <div className="flex-1">{children}</div>
      {footer}
    </>
  );
}

export type { NavItem };

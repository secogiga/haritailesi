import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import type { NavItem } from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SiteShell } from '@/components/SiteShell';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminModeProvider } from '@/contexts/AdminMode';
import { AdminToolbar } from '@/components/AdminToolbar';
import { cms } from '@/lib/api';
import './globals.css';
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  title: {
    default: 'Haritailesi Vakfı',
    template: '%s | Haritailesi',
  },
  description:
    'Harita, geomatik, kadastro, CBS ve sektör profesyonellerinin topluluğu.',
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://haritailesi.org'),
  icons: {
    icon: '/2.svg',
    shortcut: '/2.svg',
    apple: '/2.svg',
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const navItems = await cms.settings<NavItem[]>('navbar') ?? undefined;

  return (
    <html lang="tr">
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <AdminModeProvider>
            <AdminToolbar />
            <SiteShell
              navbar={<Navbar {...(navItems ? { navItems } : {})} />}
              footer={<Footer />}
            >
              {children}
            </SiteShell>
          </AdminModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Fraunces, Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from '@/components/QueryProvider';
import { MonitoringInit } from '@/components/MonitoringInit';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: '#26496b',
};

export const metadata: Metadata = {
  title: {
    default: 'Haritailesi Mutfak',
    template: '%s | Mutfak',
  },
  description: 'Haritacılık ve geomatik sektörü profesyonellerinin kapalı topluluk platformu.',
  robots: { index: false, follow: false },
  icons: {
    icon: '/2.svg',
    shortcut: '/2.svg',
    apple: '/2.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Haritailesi Mutfak',
    description: 'Haritacılık ve geomatik sektörü profesyonellerinin topluluk platformu.',
    siteName: 'Haritailesi Mutfak',
    locale: 'tr_TR',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" className={`${inter.variable} ${fraunces.variable}`}>
      <head>
        {/* Blocks render until theme is applied — eliminates dark mode flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('mutfak_theme');var dark=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark)document.documentElement.setAttribute('data-theme','dark');}catch(e){}`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}`,
          }}
        />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased font-sans">
        <MonitoringInit />
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

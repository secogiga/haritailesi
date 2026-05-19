import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'Haritailesi Sahne',
    template: '%s | Haritailesi Sahne',
  },
  description:
    'Harita, geomatik ve kadastro topluluğunun açık vitrini. Projeler, etkinlikler, üyeler ve daha fazlası.',
  metadataBase: new URL(
    process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://sahne.haritailesi.org',
  ),
  icons: {
    icon: '/2.svg',
    shortcut: '/2.svg',
    apple: '/2.svg',
  },
};

// Inline script: reads localStorage before React hydrates → prevents flash of wrong theme
const themeScript = `
(function(){
  var t=localStorage.getItem('sahne-theme');
  var sys=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  document.documentElement.setAttribute('data-theme', t||sys);
  document.documentElement.setAttribute('data-theme-loading','1');
  requestAnimationFrame(function(){
    document.documentElement.removeAttribute('data-theme-loading');
  });
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.className} bg-white dark:bg-[#070c1a] text-gray-900 dark:text-slate-100 antialiased transition-colors duration-200`}>
        {children}
      </body>
    </html>
  );
}

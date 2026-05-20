import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Haritailesi Admin',
    template: '%s | Admin',
  },
  description: 'Haritailesi operasyon paneli.',
  robots: { index: false, follow: false },
  icons: {
    icon: '/2.svg',
    shortcut: '/2.svg',
    apple: '/2.svg',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}

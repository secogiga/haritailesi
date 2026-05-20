'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';

const NAV = [
  { href: '/meslegin-gelecekleri/program', label: 'Program Hakkında' },
  { href: '/meslegin-gelecekleri/sartlar', label: 'Katılma Şartları' },
  { href: '/meslegin-gelecekleri/basvuru', label: 'Başvur' },
];

export default function MesleginGelecekleriLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Bölüm başlığı */}
      <div className="bg-[var(--color-mavi)] text-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold">Mesleğin Gelecekleri</h1>
          <p className="text-white/70 mt-1 text-sm">Seçilmiş Öğrenci Gelişim Programı · 25 Kontenjan</p>
        </div>
        {/* Alt navigasyon */}
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href as Route}
                className={`px-4 py-3 text-sm font-medium border-b-[3px] transition-colors ${pathname === item.href ? 'text-white border-white bg-white/10 rounded-t-md' : 'text-white/60 border-transparent hover:text-white hover:border-white/30'}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* İçerik */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        {children}
      </div>
    </div>
  );
}

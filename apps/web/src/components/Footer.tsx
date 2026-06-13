import Link from 'next/link';
import type { Route } from 'next';
import { cms } from '@/lib/api';

type FooterSettings = {
  tagline?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
};

type FooterLink = { label: string; href: string; external?: boolean };

const SAHNE_URL = process.env['NEXT_PUBLIC_SAHNE_URL'] ?? 'https://sahne.haritailesi.org';
const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

const FOOTER_LINKS: { baslik: string; linkler: FooterLink[] }[] = [
  {
    baslik: 'Haritailesi',
    linkler: [
      { label: 'Hakkımızda', href: '/hakkimizda' },
      { label: 'Yönetim Kurulu', href: '/hakkimizda/yonetim' },
      { label: 'Projeler', href: '/projeler' },
      { label: 'Etkinlikler', href: '/etkinlikler' },
      { label: 'İletişim', href: '/iletisim' },
    ],
  },
  {
    baslik: 'Üyelik',
    linkler: [
      { label: 'Neden Üye Olmalıyım?', href: '/uye-ol' },
      { label: 'Bireysel Üyelik', href: '/uye-ol/bireysel' },
      { label: 'Kurumsal Üyelik', href: '/uye-ol/kurumsal' },
      { label: 'Mesleğin Gelecekleri', href: '/meslegin-gelecekleri' },
    ],
  },
  {
    baslik: 'Platform',
    linkler: [
      { label: 'Sahne (İçerik)', href: SAHNE_URL, external: true },
      { label: 'Mutfak (Üye Portalı)', href: MUTFAK_URL, external: true },
    ],
  },
  {
    baslik: 'Bilgi',
    linkler: [
      { label: 'KVKK', href: '/kvkk' },
      { label: 'Çerez Politikası', href: '/cerez-politikasi' },
      { label: 'Sıkça Sorulan Sorular', href: '/sss' },
    ],
  },
];

function LinkedInIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export default async function Footer() {
  const fs = await cms.settings<FooterSettings>('footer');

  const tagline = fs?.tagline ?? 'Harita, geomatik, kadastro ve CBS sektörünün buluşma noktası.';
  const linkedinUrl = fs?.linkedinUrl ?? 'https://linkedin.com/company/haritailesi';
  const instagramUrl = fs?.instagramUrl ?? 'https://instagram.com/haritailesi';
  const youtubeUrl = fs?.youtubeUrl ?? 'https://youtube.com/@haritailesi';

  const savedLinks = await cms.settings<typeof FOOTER_LINKS>('footer_links');
  const hasValidLinks = Array.isArray(savedLinks) && savedLinks.length > 0 &&
    savedLinks.some(col => col.linkler?.some(l => l.label?.trim()));
  const rawLinks = hasValidLinks ? savedLinks! : FOOTER_LINKS;
  // Eksik veya boş sütunları default'larla tamamla
  const footerLinks = FOOTER_LINKS.map((def) => {
    const saved = rawLinks.find((s) => s.baslik === def.baslik);
    if (!saved) return def;
    const validLinks = saved.linkler?.filter((l) => l.label?.trim()) ?? [];
    return validLinks.length > 0 ? saved : def;
  });

  return (
    <footer className="bg-[var(--color-mavi)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12 items-start">
          {/* Marka */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <span className="text-2xl font-bold tracking-tight">
              <span style={{ color: '#ffffff' }}>harit</span><span style={{ color: '#66aca9' }}>a</span><span style={{ color: '#ffffff' }}>ilesi</span>
            </span>
            <p className="mt-3 text-sm text-white/60 leading-relaxed">{tagline}</p>
            <div className="flex gap-3 mt-5">
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-white/50 hover:text-white transition-colors"><LinkedInIcon /></a>
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white/50 hover:text-white transition-colors"><InstagramIcon /></a>
              <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-white/50 hover:text-white transition-colors"><YouTubeIcon /></a>
            </div>
          </div>

          {/* Linkler */}
          <div className="col-span-2 md:col-span-3 lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-8">
            {footerLinks.map((kolon) => (
              <div key={kolon.baslik}>
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">{kolon.baslik}</h3>
                <ul className="space-y-2.5">
                  {kolon.linkler.map((link) => (
                    <li key={link.href}>
                      {link.external ? (
                        <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm text-white/70 hover:text-white transition-colors">{link.label}</a>
                      ) : (
                        <Link href={link.href as Route} className="text-sm text-white/70 hover:text-white transition-colors">{link.label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <div className="flex items-center gap-4">
            <Link href={'/kullanim-kosullari' as Route} className="hover:text-white/70 transition-colors">Kullanım Koşulları</Link>
            <span>|</span>
            <Link href={'/cerez-politikasi' as Route} className="hover:text-white/70 transition-colors">Çerez Politikası</Link>
            <span>|</span>
            <Link href={'/kvkk' as Route} className="hover:text-white/70 transition-colors">KVKK Politikası</Link>
          </div>

          <span>© {new Date().getFullYear()} Haritailesi Vakfı. Tüm hakları saklıdır.</span>
        </div>
      </div>
    </footer>
  );
}

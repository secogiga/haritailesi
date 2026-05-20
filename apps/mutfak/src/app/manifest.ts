import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Harita İlesi Mutfak',
    short_name: 'Mutfak',
    description: 'Harita ve geomatik profesyonelleri topluluğu',
    start_url: '/akis',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#26496b',
    orientation: 'portrait',
    categories: ['social', 'professional'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Akış',
        short_name: 'Akış',
        description: 'Topluluk akışı',
        url: '/akis',
        icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }],
      },
      {
        name: 'Mentorluk',
        short_name: 'Mentorluk',
        description: 'Mentorluk sistemi',
        url: '/mentorluk',
        icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }],
      },
    ],
  };
}

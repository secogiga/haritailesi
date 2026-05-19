import type { NextConfig } from 'next';

// sahne.haritailesi.org — SSR, SEO zorunlu, Google indexlenebilir
const config: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      { protocol: 'https', hostname: '*.haritailesi.org' },
      { protocol: 'https', hostname: 'haritailesi.org' },
    ],
  },
};

export default config;

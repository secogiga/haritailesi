import type { NextConfig } from 'next';

// mutfak.haritailesi.org — SPA mode, auth required, no SEO indexing needed
const config: NextConfig = {
  output: 'standalone',
  headers: async () => [
    {
      source: '/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    },
  ],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      { protocol: 'https', hostname: '*.haritailesi.org' },
      { protocol: 'https', hostname: 'haritailesi.org' },
    ],
  },
};

export default config;

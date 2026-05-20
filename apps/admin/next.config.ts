import type { NextConfig } from 'next';

// admin.haritailesi.org — SPA mode, yetkili ekip erişimi, no indexing
const config: NextConfig = {
  output: 'standalone',
  compress: true,
  experimental: {
    optimizePackageImports: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    },
  ],
};

export default config;

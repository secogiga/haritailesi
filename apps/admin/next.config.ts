import type { NextConfig } from 'next';

// admin.haritailesi.org — SPA mode, yetkili ekip erişimi, no indexing
const config: NextConfig = {
  output: 'standalone',
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  compress: true,
  transpilePackages: ['@haritailesi/permissions', '@haritailesi/types', '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
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

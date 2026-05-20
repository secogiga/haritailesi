import type { NextConfig } from 'next';

// haritailesi.org — SSR, SEO zorunlu, Google indexlenebilir
const config: NextConfig = {
  output: 'standalone',
  typedRoutes: true,
};

export default config;

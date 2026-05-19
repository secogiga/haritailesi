import type { MetadataRoute } from 'next';

const BASE = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${BASE}/sitemap.xml`,
  };
}

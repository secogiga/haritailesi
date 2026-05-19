import type { MetadataRoute } from 'next';
import { cms } from '@/lib/api';

const BASE = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, projects] = await Promise.all([
    cms.events().then((r) => r ?? []).catch(() => []),
    cms.projects().then((r) => r ?? []).catch(() => []),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, priority: 1.0, changeFrequency: 'weekly' },
    { url: `${BASE}/etkinlikler`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE}/projeler`, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE}/uyeler`, priority: 0.7, changeFrequency: 'weekly' },
    { url: `${BASE}/mentorluk`, priority: 0.7, changeFrequency: 'weekly' },
    { url: `${BASE}/egitim`, priority: 0.6, changeFrequency: 'monthly' },
  ];

  const eventRoutes: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${BASE}/etkinlikler/${e.slug}`,
    lastModified: e.createdAt,
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${BASE}/projeler/${p.slug}`,
    lastModified: p.createdAt,
    priority: 0.7,
    changeFrequency: 'monthly' as const,
  }));

  return [...staticRoutes, ...eventRoutes, ...projectRoutes];
}

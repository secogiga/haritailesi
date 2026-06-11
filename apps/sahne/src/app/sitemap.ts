import type { MetadataRoute } from 'next';
import { cms } from '@/lib/api';

const BASE = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';
const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

async function getProducts(): Promise<Array<{ slug: string; updatedAt: string }>> {
  try {
    const res = await fetch(`${API_URL}/api/v1/store/products`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as Array<{ slug: string; updatedAt: string }>) : [];
  } catch { return []; }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rawEvents, rawProjects, products] = await Promise.all([
    cms.events().catch(() => null),
    cms.projects().catch(() => null),
    getProducts(),
  ]);
  const events = Array.isArray(rawEvents) ? rawEvents : [];
  const projects = Array.isArray(rawProjects) ? rawProjects : [];

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, priority: 1.0, changeFrequency: 'weekly' },
    { url: `${BASE}/etkinlikler`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE}/projeler`, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE}/uyeler`, priority: 0.7, changeFrequency: 'weekly' },
    { url: `${BASE}/mentorluk`, priority: 0.7, changeFrequency: 'weekly' },
    { url: `${BASE}/egitim`, priority: 0.6, changeFrequency: 'monthly' },
    { url: `${BASE}/magaza`, priority: 0.8, changeFrequency: 'daily' },
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

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE}/magaza/${p.slug}`,
    lastModified: p.updatedAt,
    priority: 0.7,
    changeFrequency: 'weekly' as const,
  }));

  return [...staticRoutes, ...eventRoutes, ...projectRoutes, ...productRoutes];
}

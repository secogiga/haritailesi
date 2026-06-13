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

async function getLibraryTerms(): Promise<Array<{ slug: string; createdAt?: string }>> {
  try {
    const res = await fetch(`${API_URL}/api/v1/library/terms?limit=500`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return [];
    return (data as Array<{ slug?: string | null; createdAt?: string }>)
      .filter(i => i.slug)
      .map(i => ({ slug: i.slug!, ...(i.createdAt ? { createdAt: i.createdAt } : {}) }));
  } catch { return []; }
}

async function getLibraryGuides(): Promise<Array<{ slug: string; publishedAt?: string }>> {
  try {
    const res = await fetch(`${API_URL}/api/v1/library/guides?limit=500`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return [];
    return (data as Array<{ slug?: string; publishedAt?: string | null }>)
      .filter(i => i.slug)
      .map(i => ({ slug: i.slug!, ...(i.publishedAt ? { publishedAt: i.publishedAt } : {}) }));
  } catch { return []; }
}

async function getLibraryRegulations(): Promise<Array<{ slug: string; publishDate?: string }>> {
  try {
    const res = await fetch(`${API_URL}/api/v1/library/regulations?limit=500`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return [];
    return (data as Array<{ slug?: string; publishDate?: string | null }>)
      .filter(i => i.slug)
      .map(i => ({ slug: i.slug!, ...(i.publishDate ? { publishDate: i.publishDate } : {}) }));
  } catch { return []; }
}

async function getLibraryPaths(): Promise<Array<{ slug: string; updatedAt?: string }>> {
  try {
    const res = await fetch(`${API_URL}/api/v1/library/paths?limit=500`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return [];
    return (data as Array<{ slug?: string; updatedAt?: string | null }>)
      .filter(i => i.slug)
      .map(i => ({ slug: i.slug!, ...(i.updatedAt ? { updatedAt: i.updatedAt } : {}) }));
  } catch { return []; }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rawEvents, rawProjects, products, terms, guides, regulations, paths] = await Promise.all([
    cms.events().catch(() => null),
    cms.projects().catch(() => null),
    getProducts(),
    getLibraryTerms(),
    getLibraryGuides(),
    getLibraryRegulations(),
    getLibraryPaths(),
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
    { url: `${BASE}/kutuphane`, priority: 0.9, changeFrequency: 'weekly' },
    { url: `${BASE}/kutuphane/sozluk`, priority: 0.85, changeFrequency: 'weekly' },
    { url: `${BASE}/kutuphane/rehberler`, priority: 0.85, changeFrequency: 'weekly' },
    { url: `${BASE}/kutuphane/mevzuat`, priority: 0.8, changeFrequency: 'monthly' },
    { url: `${BASE}/kutuphane/dokumanlar`, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${BASE}/kutuphane/sinavlar`, priority: 0.8, changeFrequency: 'monthly' },
    { url: `${BASE}/kutuphane/soru-cevap`, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE}/kutuphane/yollar`, priority: 0.85, changeFrequency: 'weekly' },
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

  const termRoutes: MetadataRoute.Sitemap = terms.map(t => ({
    url: `${BASE}/kutuphane/sozluk/${t.slug}`,
    lastModified: t.createdAt,
    priority: 0.8,
    changeFrequency: 'monthly' as const,
  }));

  const guideRoutes: MetadataRoute.Sitemap = guides.map(g => ({
    url: `${BASE}/kutuphane/rehberler/${g.slug}`,
    ...(g.publishedAt ? { lastModified: g.publishedAt } : {}),
    priority: 0.75,
    changeFrequency: 'monthly' as const,
  }));

  const regulationRoutes: MetadataRoute.Sitemap = regulations.map(r => ({
    url: `${BASE}/kutuphane/mevzuat/${r.slug}`,
    ...(r.publishDate ? { lastModified: r.publishDate } : {}),
    priority: 0.7,
    changeFrequency: 'yearly' as const,
  }));

  const pathRoutes: MetadataRoute.Sitemap = paths.map(p => ({
    url: `${BASE}/kutuphane/yollar/${p.slug}`,
    ...(p.updatedAt ? { lastModified: p.updatedAt } : {}),
    priority: 0.75,
    changeFrequency: 'monthly' as const,
  }));

  return [...staticRoutes, ...eventRoutes, ...projectRoutes, ...productRoutes,
    ...termRoutes, ...guideRoutes, ...regulationRoutes, ...pathRoutes];
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

async function cmsGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/cms${path}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export interface CmsEvent {
  id: string;
  slug: string;
  title: string;
  type: string;
  dateStart: string;
  dateEnd: string | null;
  location: string | null;
  description: string | null;
  body: string | null;
  registrationUrl: string | null;
  meetingUrl: string | null;
  coverImageKey: string | null;
  isPublished: boolean;
  createdAt: string;
}

export interface CmsProject {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string | null;
  status: 'active' | 'completed' | 'archived';
  coverImageKey: string | null;
  isPublished: boolean;
  createdAt: string;
}

export interface SearchResult {
  events: Array<{ id: string; slug: string; title: string; description: string | null; dateStart: string; type: string }>;
  projects: Array<{ id: string; slug: string; title: string; summary: string | null; status: string }>;
}

async function cmsSearch(q: string): Promise<SearchResult | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/search?q=${encodeURIComponent(q)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<SearchResult>;
  } catch {
    return null;
  }
}

export interface StudentClub {
  id: string;
  name: string;
  slug: string;
  university: string;
  city: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  website: string | null;
  memberCount: number;
  description: string | null;
  activities: string | null;
  logoKey: string | null;
  createdAt: string;
}

export interface MemberCityStat {
  city: string;
  count: number;
}

async function memberCitiesGet(): Promise<MemberCityStat[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/member-cities`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    return res.json() as Promise<MemberCityStat[]>;
  } catch {
    return [];
  }
}

async function studentClubsGet(): Promise<StudentClub[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/student-clubs`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    return res.json() as Promise<StudentClub[]>;
  } catch {
    return [];
  }
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string | null;
  type: string;
  description: string;
  applyUrl: string | null;
  applyEmail: string | null;
  contactPhone: string | null;
  price: string | null;
  tags: string[];
  status: string;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

async function jobListingsGet(type?: string): Promise<JobListing[]> {
  try {
    const qs = type ? `?type=${encodeURIComponent(type)}&limit=50` : '?limit=50';
    const res = await fetch(`${API_URL}/api/v1/marketplace/job-listings${qs}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { data: JobListing[] };
    return data.data ?? [];
  } catch {
    return [];
  }
}

export interface Training {
  id: string;
  slug: string;
  title: string;
  instructor: string | null;
  instructorTitle: string | null;
  format: string | null;
  level: string | null;
  duration: string | null;
  price: string | null;
  memberPrice: string | null;
  description: string | null;
  tags: string[];
  isPublished: boolean;
  registrationUrl: string | null;
  startDate: string | null;
  createdAt: string;
}

export interface SahneExamResource {
  id: string;
  examKey: string;
  resourceType: string;
  title: string;
  content: string | null;
  resourceUrl: string | null;
  eventDate: string | null;
  isPublished: boolean;
  sortOrder: number;
}

async function trainingsGet(): Promise<Training[]> {
  const result = await cmsGet<Training[]>('/trainings');
  return result ?? [];
}

async function examResourcesGet(examKey?: string, resourceType?: string): Promise<SahneExamResource[]> {
  const params = new URLSearchParams();
  if (examKey) params.set('exam', examKey);
  if (resourceType) params.set('type', resourceType);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const result = await cmsGet<SahneExamResource[]>(`/exam-resources${qs}`);
  return result ?? [];
}

export const cms = {
  events: (type?: string) =>
    cmsGet<CmsEvent[]>(`/events${type ? `?type=${type}` : ''}`),
  event: (slug: string) => cmsGet<CmsEvent>(`/events/${slug}`),
  projects: (status?: string) =>
    cmsGet<CmsProject[]>(`/projects${status ? `?status=${status}` : ''}`),
  project: (slug: string) => cmsGet<CmsProject>(`/projects/${slug}`),
  search: cmsSearch,
  memberCities: memberCitiesGet,
  studentClubs: studentClubsGet,
  jobListings: jobListingsGet,
  trainings: trainingsGet,
  examResources: examResourcesGet,
};

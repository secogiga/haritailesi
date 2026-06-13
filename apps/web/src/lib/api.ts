const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

// ─── Auth Types ────────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface Me {
  id: string;
  email: string;
  membershipTier: string;
  status: string;
  verificationStatus: string;
  createdAt: string;
  lastLoginAt: string | null;
  profile: {
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    city: string | null;
    profession: string | null;
    linkedinUrl: string | null;
    websiteUrl: string | null;
  } | null;
  functionalRoles: string[];
}

// ─── Auth API ──────────────────────────────────────────────────────────────────

async function authPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'İstek başarısız.');
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export async function apiLogin(email: string, password: string): Promise<TokenPair> {
  return authPost<TokenPair>('/auth/login', { email, password });
}

export async function apiRefresh(refreshToken: string): Promise<TokenPair> {
  return authPost<TokenPair>('/auth/refresh', { refreshToken });
}

export async function apiLogout(accessToken: string, refreshToken: string): Promise<void> {
  return authPost<void>('/auth/logout', { refreshToken }, accessToken);
}

export async function apiSetupPassword(token: string, password: string): Promise<TokenPair> {
  return authPost<TokenPair>('/auth/setup-password', { token, password });
}

export async function apiGetMe(accessToken: string): Promise<Me> {
  const res = await fetch(`${API_URL}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Oturum geçersiz.');
  return res.json() as Promise<Me>;
}

export interface ProfileUpdate {
  displayName?: string;
  bio?: string;
  city?: string;
  profession?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
}

export async function apiUpdateProfile(data: ProfileUpdate, accessToken: string): Promise<Me['profile']> {
  const res = await fetch(`${API_URL}/api/v1/users/me/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'Kaydedilemedi.');
  }
  return res.json() as Promise<Me['profile']>;
}

export async function submitApplication(data: {
  type: 'individual' | 'corporate' | 'meslegin_gelecekleri' | 'haritailesi_genc';
  applicantEmail: string;
  formData: Record<string, unknown>;
}): Promise<{ id: string; state: string }> {
  const res = await fetch(`${API_URL}/api/v1/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'Başvuru gönderilemedi. Lütfen tekrar deneyin.');
  }

  return res.json() as Promise<{ id: string; state: string }>;
}

// ─── CMS Helpers ───────────────────────────────────────────────────────────────

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

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  updatedAt: string;
}

export interface BoardMember {
  id: string;
  name: string;
  title: string;
  bio: string | null;
  photoKey: string | null;
  sortOrder: number;
  isActive: boolean;
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
  maxCapacity: number | null;
  isCancelled: boolean;
  attendeeCount: number;
  viewCount: number;
  isPublished: boolean;
  createdAt: string;
}

export interface EventSpeaker {
  id: string; name: string; title: string | null; affiliation: string | null;
  bio: string | null; avatarUrl: string | null; linkedinUrl: string | null; sortOrder: number;
}
export interface EventSession {
  id: string; title: string; description: string | null; sessionType: string;
  hall: string | null; startTime: string | null; endTime: string | null; sortOrder: number;
  speakerId: string | null; speakerName: string | null; speakerTitle: string | null;
  speakerAffiliation: string | null; speakerAvatarUrl: string | null;
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


export const cms = {
  page: (slug: string) => cmsGet<CmsPage>(`/pages/${slug}`),
  boardMembers: () => cmsGet<BoardMember[]>('/board-members'),
  events: (type?: string) => cmsGet<CmsEvent[]>(`/events${type ? `?type=${type}` : ''}`),
  event: (slug: string) => cmsGet<CmsEvent>(`/events/${slug}`),
  eventSponsors: (id: string) => cmsGet<Array<{ id: string; companyName: string; logoKey: string | null; websiteUrl: string | null; tier: string; description: string | null }>>(`/events/${id}/sponsors`),
  eventSpeakers: (id: string) => cmsGet<EventSpeaker[]>(`/events/${id}/speakers`),
  eventSessions: (id: string) => cmsGet<EventSession[]>(`/events/${id}/sessions`),
  projects: (status?: string) => cmsGet<CmsProject[]>(`/projects${status ? `?status=${status}` : ''}`),
  project: (slug: string) => cmsGet<CmsProject>(`/projects/${slug}`),
  settings: <T = Record<string, unknown>>(key: string) => cmsGet<T>(`/settings/${key}`),
  newsletters: () => newsletterGet<NewsletterArchiveItem[]>('/archive'),
  newsletter: (id: string) => newsletterGet<NewsletterArchiveDetail>(`/archive/${id}`),
};

// ─── Newsletter Archive (Public) ───────────────────────────────────────────────

export interface NewsletterArchiveItem {
  id: string;
  title: string;
  subject: string;
  month: string;
  sentAt: string;
  emailCount: number;
}

export interface NewsletterArchiveDetail extends NewsletterArchiveItem {
  htmlBody: string | null;
}

async function newsletterGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/admin/newsletter${path}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

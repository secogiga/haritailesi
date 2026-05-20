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


export const cms = {
  page: (slug: string) => cmsGet<CmsPage>(`/pages/${slug}`),
  boardMembers: () => cmsGet<BoardMember[]>('/board-members'),
  events: (type?: string) => cmsGet<CmsEvent[]>(`/events${type ? `?type=${type}` : ''}`),
  event: (slug: string) => cmsGet<CmsEvent>(`/events/${slug}`),
  projects: (status?: string) => cmsGet<CmsProject[]>(`/projects${status ? `?status=${status}` : ''}`),
  project: (slug: string) => cmsGet<CmsProject>(`/projects/${slug}`),
  settings: <T = Record<string, unknown>>(key: string) => cmsGet<T>(`/settings/${key}`),
};

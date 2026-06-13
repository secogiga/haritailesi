const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

function token(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('site_admin_token') ?? '';
}

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token()}`,
      ...(opts?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as T;
}

export async function login(email: string, password: string): Promise<void> {
  const data = await req<{ accessToken: string; refreshToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('site_admin_token', data.accessToken);
  localStorage.setItem('site_admin_refresh', data.refreshToken);
}

export function logout(): void {
  localStorage.removeItem('site_admin_token');
  localStorage.removeItem('site_admin_refresh');
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  const t = localStorage.getItem('site_admin_token');
  if (!t) return false;
  try {
    const payload = JSON.parse(atob(t.split('.')[1]!)) as { exp?: number; roles?: string[] };
    if (payload.exp && payload.exp * 1000 < Date.now()) return false;
    return true;
  } catch { return false; }
}

// ── Settings ──────────────────────────────────────────────────────────────────

export const getSetting = (key: string) =>
  req<Record<string, unknown> | null>(`/admin/cms/settings/${key}`);

export const upsertSetting = (key: string, data: Record<string, unknown>) =>
  req<void>(`/admin/cms/settings/${key}`, { method: 'PUT', body: JSON.stringify(data) });

// ── CMS Events ────────────────────────────────────────────────────────────────

export type CmsEvent = {
  id: string; slug: string; title: string; type: string;
  dateStart: string; dateEnd: string | null; location: string | null;
  description: string | null; registrationUrl: string | null; meetingUrl: string | null;
  maxCapacity: number | null; attendeeCount: number; isCancelled: boolean; isPublished: boolean;
  createdAt: string;
};

export const listEvents = (params?: { type?: string; published?: boolean }) => {
  const qs = new URLSearchParams();
  if (params?.type) qs.set('type', params.type);
  if (params?.published !== undefined) qs.set('published', String(params.published));
  return req<CmsEvent[]>(`/admin/cms/events${qs.toString() ? '?' + qs : ''}`);
};
export const getEvent = (id: string) => req<CmsEvent>(`/admin/cms/events/${id}`);
export const createEvent = (data: Partial<CmsEvent>) =>
  req<CmsEvent>('/admin/cms/events', { method: 'POST', body: JSON.stringify(data) });
export const updateEvent = (id: string, data: Partial<CmsEvent>) =>
  req<CmsEvent>(`/admin/cms/events/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEvent = (id: string) =>
  req<void>(`/admin/cms/events/${id}`, { method: 'DELETE' });

// ── CMS Pages ─────────────────────────────────────────────────────────────────

export type CmsPage = {
  slug: string; title: string; content: string;
  metaDescription: string | null; isPublished: boolean; updatedAt: string;
};

export const listPages = () => req<CmsPage[]>('/admin/cms/pages');
export const getPage = (slug: string) => req<CmsPage>(`/admin/cms/pages/${slug}`);
export const upsertPage = (slug: string, data: Partial<CmsPage>) =>
  req<CmsPage>(`/admin/cms/pages/${slug}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePage = (slug: string) =>
  req<void>(`/admin/cms/pages/${slug}`, { method: 'DELETE' });

// ── Board Members ─────────────────────────────────────────────────────────────

export type BoardMember = {
  id: string; name: string; title: string; bio: string | null;
  avatarUrl: string | null; order: number; isActive: boolean;
};

export const listBoardMembers = () => req<BoardMember[]>('/admin/cms/board-members');
export const createBoardMember = (data: Partial<BoardMember>) =>
  req<BoardMember>('/admin/cms/board-members', { method: 'POST', body: JSON.stringify(data) });
export const updateBoardMember = (id: string, data: Partial<BoardMember>) =>
  req<BoardMember>(`/admin/cms/board-members/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteBoardMember = (id: string) =>
  req<void>(`/admin/cms/board-members/${id}`, { method: 'DELETE' });

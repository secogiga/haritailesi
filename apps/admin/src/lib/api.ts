const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export function getCurrentUserRoles(): string[] {
  if (typeof window === 'undefined') return [];
  const token = localStorage.getItem('access_token');
  if (!token) return [];
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!)) as { roles?: string[] };
    return payload.roles ?? [];
  } catch {
    return [];
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${refreshToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json() as { accessToken: string };
    localStorage.setItem('access_token', data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options?: RequestInit, retry = true): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) return request<T>(path, options, false);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
    return Promise.reject(new Error('Oturum süresi doldu'));
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') return undefined as T;
  return res.json() as Promise<T>;
}

export const adminApi = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  listApplications: (params?: { type?: string; state?: string; cursor?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{
      data: Array<{
        id: string; type: string; state: string; applicantEmail: string;
        createdAt: string; updatedAt: string;
        formData: Record<string, unknown>;
      }>;
      next_cursor: string | null;
      has_more: boolean;
    }>(`/admin/applications${qs ? `?${qs}` : ''}`);
  },

  getApplication: (id: string) =>
    request<{
      id: string; type: string; state: string; applicantEmail: string;
      formData: Record<string, unknown>; adminNotes: string | null;
      createdAt: string; paymentDueAt: string | null;
      paymentStatus: 'pending' | 'reminded' | 'expired' | 'verified' | 'failed' | 'waived' | null;
      stateLogs: Array<{ fromState: string | null; toState: string; createdAt: string; reason: string | null }>;
      validNextStates: string[];
    }>(`/admin/applications/${id}`),

  transitionState: (
    id: string,
    toState: string,
    options?: { reason?: string; paymentAmountKurus?: number; paymentDescription?: string },
  ) =>
    request(`/admin/applications/${id}/state`, {
      method: 'PATCH',
      body: JSON.stringify({ toState, ...options }),
    }),

  updateNotes: (id: string, adminNotes: string) =>
    request<{ syncedToProfile: boolean }>(`/admin/applications/${id}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ adminNotes }),
    }),

  resendStateEmail: (id: string) =>
    request(`/admin/applications/${id}/resend-state-email`, { method: 'POST' }),

  sendInterviewInvite: (id: string, data: { meetUrl?: string }) =>
    request(`/admin/applications/${id}/send-interview-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  resendSetup: (id: string) =>
    request(`/admin/applications/${id}/resend-setup`, { method: 'POST' }),

  resendPaymentReminder: (id: string) =>
    request(`/admin/applications/${id}/resend-payment-reminder`, { method: 'POST' }),

  sendWhatsapp: (id: string, message: string) =>
    request(`/admin/applications/${id}/send-whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    }),

  waivePayment: (id: string, reason: string) =>
    request(`/admin/applications/${id}/waive-payment`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  extendPaymentDueDate: (id: string, extraDays: number) =>
    request(`/admin/applications/${id}/payment/extend-due-date`, {
      method: 'PATCH',
      body: JSON.stringify({ extraDays }),
    }),

  markPaymentFailed: (id: string, reason: string) =>
    request(`/admin/applications/${id}/payment/mark-failed`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  revokeWaiver: (id: string) =>
    request(`/admin/applications/${id}/payment/revoke-waiver`, { method: 'POST' }),

  deleteApplication: (id: string) =>
    request<{ id: string; deleted: boolean }>(`/admin/applications/${id}`, { method: 'DELETE' }),

  getPaymentSummary: () =>
    request<PaymentSummary>('/admin/payments/summary'),

  listPayments: (params?: {
    status?: string; tier?: string; from?: string; to?: string;
    overdue?: string; waived?: string; proofPending?: string;
    cursor?: string; limit?: string;
  }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v !== '' && v !== undefined)) as Record<string, string>
    ).toString();
    return request<{
      data: PaymentRow[];
      next_cursor: string | null;
      has_more: boolean;
    }>(`/admin/payments${qs ? `?${qs}` : ''}`);
  },

  getTimeline: (id: string) =>
    request<TimelineEvent[]>(`/admin/applications/${id}/timeline`),

  // ─── Scheduling ───────────────────────────────────────────────────────────────

  listSlots: (params?: { slotType?: string; onlyAvailable?: boolean; from?: string; to?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined && v !== '')
        .reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {}),
    ).toString();
    return request<AvailabilitySlot[]>(`/admin/scheduling/slots${qs ? `?${qs}` : ''}`);
  },

  createSlot: (data: { startAt: string; endAt: string; slotType?: string; capacity?: number; notes?: string }) =>
    request<AvailabilitySlot>('/admin/scheduling/slots', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteSlot: (id: string) =>
    request(`/admin/scheduling/slots/${id}`, { method: 'DELETE' }),

  createInterviewRequest: (applicationId: string, data: { slotId: string; meetUrl?: string }) =>
    request<{ id: string; confirmUrl: string; confirmToken: string }>(`/admin/applications/${applicationId}/request-interview`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getInterviewRequest: (applicationId: string) =>
    request<{ id: string; state: string; slot: AvailabilitySlot; meetUrl: string | null } | null>(
      `/admin/applications/${applicationId}/interview-request`,
    ),

  // ─── CMS: Pages ──────────────────────────────────────────────────────────────

  listPages: () =>
    request<CmsPage[]>('/admin/cms/pages'),

  getPage: (slug: string) =>
    request<CmsPage>(`/admin/cms/pages/${slug}`),

  upsertPage: (slug: string, data: { title: string; body?: string; metaDescription?: string; isPublished: boolean }) =>
    request<CmsPage>(`/admin/cms/pages/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletePage: (slug: string) =>
    request(`/admin/cms/pages/${slug}`, { method: 'DELETE' }),

  // ─── CMS: Board Members ───────────────────────────────────────────────────────

  listBoardMembers: () =>
    request<BoardMember[]>('/admin/cms/board-members'),

  getBoardMember: (id: string) =>
    request<BoardMember>(`/admin/cms/board-members/${id}`),

  createBoardMember: (data: Omit<BoardMember, 'id' | 'createdAt' | 'updatedAt'>) =>
    request<BoardMember>('/admin/cms/board-members', { method: 'POST', body: JSON.stringify(data) }),

  updateBoardMember: (id: string, data: Partial<Omit<BoardMember, 'id' | 'createdAt' | 'updatedAt'>>) =>
    request<BoardMember>(`/admin/cms/board-members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteBoardMember: (id: string) =>
    request(`/admin/cms/board-members/${id}`, { method: 'DELETE' }),

  // ─── CMS: Events ─────────────────────────────────────────────────────────────

  listEvents: (type?: string) => {
    const qs = type ? `?type=${type}` : '';
    return request<CmsEvent[]>(`/admin/cms/events${qs}`);
  },

  getEvent: (id: string) =>
    request<CmsEvent>(`/admin/cms/events/${id}`),

  createEvent: (data: Omit<CmsEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) =>
    request<CmsEvent>('/admin/cms/events', { method: 'POST', body: JSON.stringify(data) }),

  updateEvent: (id: string, data: Partial<Omit<CmsEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>) =>
    request<CmsEvent>(`/admin/cms/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteEvent: (id: string) =>
    request(`/admin/cms/events/${id}`, { method: 'DELETE' }),

  listEventAttendees: (id: string) =>
    request<{ count: number; attendees: Array<{ id: string; userId: string | null; displayName: string | null; avatarUrl: string | null; profession: string | null; joinedAt: string; ticketCode: string | null; ticketTier: string; checkedIn: boolean; checkedInAt: string | null; registrationType: string }> }>(`/admin/cms/events/${id}/attendees`),

  checkinAttendance: (id: string, registrationType: 'member' | 'public') =>
    request<{ checkedIn: boolean; checkedInAt: string | null }>(`/admin/cms/attendances/${id}/checkin`, {
      method: 'PATCH',
      body: JSON.stringify({ registrationType }),
    }),

  checkinByTicket: (ticketCode: string) =>
    request<{ success: boolean; displayName: string | null; alreadyCheckedIn: boolean; registrationType: string; checkedIn: boolean }>('/admin/cms/checkin/scan', {
      method: 'POST',
      body: JSON.stringify({ ticketCode }),
    }),

  copyEvent: (id: string) =>
    request<CmsEvent>(`/admin/cms/events/${id}/copy`, { method: 'POST' }),

  listWaitlist: (eventId: string) =>
    request<{ count: number; waitlist: Array<{ id: string; userId: string | null; email: string | null; displayName: string | null; notifiedAt: string | null; createdAt: string }> }>(`/admin/cms/events/${eventId}/waitlist`),

  createDiscussionRoom: (eventId: string) =>
    request<{ postId: string; alreadyExists: boolean }>(`/admin/cms/events/${eventId}/discussion-room`, { method: 'POST' }),

  // ─── Analytics ───────────────────────────────────────────────────────────────

  getEventStats: (id: string) =>
    request<{ viewCount: number; memberRegistrations: number; publicRegistrations: number; totalRegistrations: number; checkedInCount: number; waitlistCount: number; maxCapacity: number | null; fillRate: number | null; registrationTrend: Array<{ day: string; count: number }> }>(`/admin/cms/events/${id}/stats`),

  uploadSpeakerPhoto: async (file: File): Promise<{ key: string; url: string }> => {
    const token = localStorage.getItem('access_token');
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_URL}/api/v1/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) throw new Error('Fotoğraf yüklenemedi.');
    return res.json() as Promise<{ key: string; url: string }>;
  },

  // ─── Sponsors ────────────────────────────────────────────────────────────────

  listSponsors: (eventId: string) =>
    request<EventSponsor[]>(`/admin/cms/events/${eventId}/sponsors`),
  createSponsor: (eventId: string, dto: Partial<EventSponsor>) =>
    request<EventSponsor>(`/admin/cms/events/${eventId}/sponsors`, { method: 'POST', body: JSON.stringify(dto) }),
  updateSponsor: (id: string, dto: Partial<EventSponsor>) =>
    request<EventSponsor>(`/admin/cms/sponsors/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteSponsor: (id: string) =>
    request(`/admin/cms/sponsors/${id}`, { method: 'DELETE' }),
  uploadSponsorLogo: async (file: File): Promise<{ key: string; url: string }> => {
    const token = localStorage.getItem('access_token');
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_URL}/api/v1/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) throw new Error('Logo yüklenemedi.');
    return res.json() as Promise<{ key: string; url: string }>;
  },

  // ─── Speakers ────────────────────────────────────────────────────────────────

  listSpeakers: (eventId: string) =>
    request<EventSpeaker[]>(`/admin/cms/events/${eventId}/speakers`),
  createSpeaker: (eventId: string, dto: Partial<EventSpeaker>) =>
    request<EventSpeaker>(`/admin/cms/events/${eventId}/speakers`, { method: 'POST', body: JSON.stringify(dto) }),
  updateSpeaker: (id: string, dto: Partial<EventSpeaker>) =>
    request<EventSpeaker>(`/admin/cms/speakers/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteSpeaker: (id: string) =>
    request(`/admin/cms/speakers/${id}`, { method: 'DELETE' }),

  // ─── Sessions ─────────────────────────────────────────────────────────────────

  listSessions: (eventId: string) =>
    request<EventSession[]>(`/admin/cms/events/${eventId}/sessions`),
  createSession: (eventId: string, dto: Partial<EventSession>) =>
    request<EventSession>(`/admin/cms/events/${eventId}/sessions`, { method: 'POST', body: JSON.stringify(dto) }),
  updateSession: (id: string, dto: Partial<EventSession>) =>
    request<EventSession>(`/admin/cms/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteSession: (id: string) =>
    request(`/admin/cms/sessions/${id}`, { method: 'DELETE' }),

  // ─── Registration Questions ───────────────────────────────────────────────────

  listRegQuestions: (eventId: string) =>
    request<RegQuestion[]>(`/admin/cms/events/${eventId}/registration-questions`),
  createRegQuestion: (eventId: string, dto: { question: string; questionType?: string; options?: string[]; isRequired?: boolean }) =>
    request<RegQuestion>(`/admin/cms/events/${eventId}/registration-questions`, { method: 'POST', body: JSON.stringify(dto) }),
  deleteRegQuestion: (id: string) =>
    request(`/admin/cms/registration-questions/${id}`, { method: 'DELETE' }),
  listRegAnswers: (eventId: string) =>
    request<RegAnswer[]>(`/admin/cms/events/${eventId}/registration-answers`),

  // ─── Event Invitation ─────────────────────────────────────────────────────────

  sendInvitations: (eventId: string, opts: { segment?: 'all' | 'active'; channel?: 'email' | 'whatsapp' | 'both' } = {}) =>
    request<{ emailSent: number; whatsappSent: number; total: number; eventTitle: string }>(`/admin/cms/events/${eventId}/invite`, { method: 'POST', body: JSON.stringify({ segment: opts.segment ?? 'all', channel: opts.channel ?? 'email' }) }),

  // ─── CMS: Projects ────────────────────────────────────────────────────────────

  listProjects: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<CmsProject[]>(`/admin/cms/projects${qs}`);
  },

  getProject: (id: string) =>
    request<CmsProject>(`/admin/cms/projects/${id}`),

  createProject: (data: Omit<CmsProject, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) =>
    request<CmsProject>('/admin/cms/projects', { method: 'POST', body: JSON.stringify(data) }),

  updateProject: (id: string, data: Partial<Omit<CmsProject, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>) =>
    request<CmsProject>(`/admin/cms/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteProject: (id: string) =>
    request(`/admin/cms/projects/${id}`, { method: 'DELETE' }),

  bulkUpdateLinkedinViews: (items: Array<{ id: string; linkedinViewCount: number; linkedinClickCount?: number; linkedinLikeCount?: number; linkedinCommentCount?: number; linkedinPostUrl?: string }>) =>
    request<{ updated: number }>('/admin/cms/projects/bulk-linkedin-views', {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    }),

  generateKunye: (id: string) =>
    request<Omit<CmsProject, 'id' | 'slug' | 'title' | 'createdAt' | 'updatedAt' | 'createdBy'>>(`/admin/cms/projects/${id}/generate-kunye`, { method: 'POST' }),

  // ─── CMS: Talents ────────────────────────────────────────────────────────────

  listTalents: (params?: { status?: string; category?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    return request<CmsTalent[]>(`/admin/cms/talents${qs ? `?${qs}` : ''}`);
  },

  getTalent: (id: string) =>
    request<CmsTalent>(`/admin/cms/talents/${id}`),

  createTalent: (data: { displayName: string; category: string; title: string; description?: string; mediaUrl?: string; status?: string; isPublished?: boolean; adminNotes?: string }) =>
    request<CmsTalent>('/admin/cms/talents', { method: 'POST', body: JSON.stringify(data) }),

  updateTalent: (id: string, data: { status?: 'pending' | 'approved' | 'rejected'; adminNotes?: string; isPublished?: boolean; displayName?: string; category?: string; title?: string; description?: string; mediaUrl?: string }) =>
    request<CmsTalent>(`/admin/cms/talents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteTalent: (id: string) =>
    request(`/admin/cms/talents/${id}`, { method: 'DELETE' }),

  // ─── CMS: Site Settings ───────────────────────────────────────────────────────

  getSetting: (key: string) =>
    request<Record<string, unknown>>(`/admin/cms/settings/${key}`).catch(() => null),

  upsertSetting: (key: string, data: Record<string, unknown>) =>
    request(`/admin/cms/settings/${key}`, { method: 'PUT', body: JSON.stringify(data) }),

  // ─── Users ────────────────────────────────────────────────────────────────────

  getOnlineUsers: () =>
    request<{ userIds: string[]; count: number }>('/admin/users/online'),

  listUsers: (params?: {
    tier?: string; status?: string; search?: string; cursor?: string;
    city?: string; workStatus?: string; minAge?: string; maxAge?: string;
    minExperience?: string; maxExperience?: string;
    joinedAfter?: string; joinedBefore?: string; sortBy?: string;
    memberOnly?: string; registeredOnly?: string; verificationStatus?: string;
    limit?: string;
  }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v !== '' && v !== undefined)) as Record<string, string>
    ).toString();
    return request<{
      data: AdminUser[];
      next_cursor: string | null;
      has_more: boolean;
    }>(`/admin/users${qs ? `?${qs}` : ''}`);
  },

  getUser: (id: string) =>
    request<AdminUserDetail>(`/admin/users/${id}`),

  updateUserRole: (id: string, role: string, action: 'assign' | 'revoke') =>
    request<{ userId: string; role: string; action: string }>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role, action }),
    }),

  updateUserTier: (id: string, tier: string) =>
    request<{ id: string; membershipTier: string }>(`/admin/users/${id}/tier`, {
      method: 'PATCH',
      body: JSON.stringify({ tier }),
    }),

  updateUserStatus: (id: string, status: string) =>
    request<{ id: string; status: string }>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  setVerificationStatus: (id: string, status: string) =>
    request<{ id: string; verificationStatus: string }>(`/admin/users/${id}/verification-status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  createCorporateRep: (dto: {
    email: string;
    displayName: string;
    corporateName: string;
    corporateRole: string;
  }) =>
    request<{ id: string; email: string; inviteSent: boolean }>('/admin/users/corporate-rep', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  sendUserInvite: (userId: string) =>
    request<{ sent: boolean }>(`/admin/users/${userId}/send-invite`, { method: 'POST' }),

  // ─── Dashboard Stats ──────────────────────────────────────────────────────────

  getDashboardStats: () =>
    request<DashboardStats>('/admin/dashboard'),

  getSahneStats: () =>
    request<SahneStats>('/admin/dashboard/sahne-stats'),

  getOnboardingMetrics: () =>
    request<OnboardingMetrics>('/admin/dashboard/onboarding-metrics'),

  getOnboardingInsights: () =>
    request<OnboardingInsights>('/admin/dashboard/onboarding-insights'),

  getCommunityHealth: () =>
    request<CommunityHealth>('/admin/dashboard/community-health'),

  getLevelStats: () =>
    request<LevelStats>('/admin/dashboard/level-stats'),

  getMutfakBehaviorStats: (periodMonths: 3 | 6 | 12 = 12) =>
    request<MutfakBehaviorStats>(`/admin/dashboard/mutfak-behavior?period=${periodMonths}`),

  getMutfakUserStats: (opts: { period?: number; tier?: string; cursor?: string; limit?: number } = {}) =>
    request<MutfakUserStatsPage>(`/admin/dashboard/mutfak-users?${new URLSearchParams(
      Object.fromEntries(Object.entries({ period: String(opts.period ?? 12), tier: opts.tier ?? '', cursor: opts.cursor ?? '', limit: String(opts.limit ?? 50) }).filter(([,v]) => v !== ''))
    ).toString()}`),

  // ─── Feed Moderation ─────────────────────────────────────────────────────────

  listAdminPosts: (params?: { status?: string; category?: string; type?: string; q?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    return request<AdminPost[]>(`/admin/feed/posts${qs ? `?${qs}` : ''}`);
  },

  createAdminPost: (data: {
    type: string; category: string; title?: string | null; body: string; status: string;
  }) =>
    request<AdminPost>('/admin/feed/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  bulkSetPostStatus: (ids: string[], status: string) =>
    request<{ updated: number }>('/admin/feed/posts/bulk', {
      method: 'POST',
      body: JSON.stringify({ ids, status }),
    }),

  pinPost: (id: string, pinned: boolean) =>
    request<{ id: string; isPinned: boolean }>(`/admin/feed/posts/${id}/pin`, {
      method: 'PATCH',
      body: JSON.stringify({ pinned }),
    }),

  setPostStatus: (id: string, status: string) =>
    request<{ id: string; status: string }>(`/admin/feed/posts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  updateAdminPost: (id: string, data: { title?: string | null; body?: string }) =>
    request<{ id: string; title: string | null; body: string }>(`/admin/feed/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteAdminPost: (id: string) =>
    request<{ id: string }>(`/admin/feed/posts/${id}`, { method: 'DELETE' }),

  // ─── Mentorship ───────────────────────────────────────────────────────────────

  listAdminMentorshipRequests: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<AdminMentorshipRequest[]>(`/mentorship/admin/requests${qs}`);
  },

  listMentorPool: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<AdminMentorProfile[]>(`/mentorship/admin/mentor-pool${qs}`);
  },

  reviewMentor: (id: string, status: 'approved' | 'rejected', note?: string) =>
    request<AdminMentorProfile>(`/mentorship/admin/mentor-pool/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),

  listMenteePool: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<AdminMenteeApplication[]>(`/mentorship/admin/mentee-pool${qs}`);
  },

  adminCreateMatch: (mentorUserId: string, menteeApplicationId: string, engagementType: 'single_session' | 'periodic') =>
    request<AdminMentorshipRequest>('/mentorship/admin/match', {
      method: 'POST',
      body: JSON.stringify({ mentorUserId, menteeApplicationId, engagementType }),
    }),

  // ─── Upload ───────────────────────────────────────────────────────────────────

  uploadFile: async (file: File): Promise<{ key: string; url: string }> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/api/v1/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<{ key: string; url: string }>;
  },

  // ─── Donations ────────────────────────────────────────────────────────────────

  listDonations: (params?: { status?: string; method?: string; userId?: string; cursor?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{
      data: Array<{
        id: string;
        userId: string | null;
        email: string;
        fullName: string;
        amount: number;
        currency: string;
        type: string;
        method: string;
        paymentAccount: string | null;
        status: string;
        referenceCode: string;
        donationCategory: string | null;
        companyName: string | null;
        packageTier: string | null;
        notes: string | null;
        iyzicoPaymentId: string | null;
        proofKey: string | null;
        proofUploadedAt: string | null;
        createdAt: string;
        completedAt: string | null;
      }>;
      next_cursor: string | null;
      has_more: boolean;
    }>(`/donations${qs ? `?${qs}` : ''}`);
  },

  getDonationStats: () =>
    request<{ totalCompleted: number; totalAmount: number; pendingCount: number; thisMonthAmount: number }>('/donations/stats'),

  confirmDonation: (id: string) =>
    request<{ id: string }>(`/donations/${id}/confirm`, { method: 'PATCH' }),

  uploadDonationProof: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ proofKey: string }>(`/donations/${id}/proof`, { method: 'POST', body: form });
  },

  getDonationProofUrl: (id: string) =>
    request<{ url: string }>(`/donations/${id}/proof/url`),

  // ─── Membership ───────────────────────────────────────────────────────────────

  getMembershipStats: () =>
    request<{ total: number; active: number; expired: number; expiringSoon: number }>('/membership/admin/stats'),

  listMembershipSubscriptions: (params?: { status?: string; userId?: string; limit?: number }) => {
    const sp: Record<string, string> = {};
    if (params?.status) sp['status'] = params.status;
    if (params?.userId) sp['userId'] = params.userId;
    if (params?.limit) sp['limit'] = String(params.limit);
    const qs = new URLSearchParams(sp).toString();
    return request<MemberSub[]>(`/membership/admin/subscriptions${qs ? `?${qs}` : ''}`);
  },

  getMembershipFees: (year: number) =>
    request<Array<{ id: string; year: number; tier: string; amountKurus: number; label: string; description: string | null; isActive: boolean }>>(`/membership/admin/fees/${year}`),

  upsertMembershipFee: (dto: { year: number; tier: string; amountKurus: number; label: string; description?: string }) =>
    request<{ id: string }>('/membership/admin/fees', { method: 'PUT', body: JSON.stringify(dto) }),

  adminActivateMembership: (dto: { userId: string; tier: string; notes?: string }) =>
    request<{ id: string }>('/membership/admin/activate', { method: 'POST', body: JSON.stringify(dto) }),

  // ─── Member Notes ─────────────────────────────────────────────────────────────

  deleteUser: (id: string) =>
    request<{ id: string; deleted: boolean }>(`/admin/users/${id}`, { method: 'DELETE' }),

  getMemberNotes: (userId: string) =>
    request<Array<{ id: string; body: string; noteType: string; adminEmail: string; createdAt: string }>>(`/admin/users/${userId}/notes`),

  addMemberNote: (userId: string, body: string, noteType: 'note' | 'email_sent' | 'call') =>
    request<{ id: string }>(`/admin/users/${userId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ body, noteType }),
    }),

  // ─── Community: Feedback ─────────────────────────────────────────────────────

  listFeedback: (params?: Record<string, string>) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return request<{ data: FeedbackItem[]; next_cursor: string | null; has_more: boolean }>(
      `/community/admin/feedback${qs ? `?${qs}` : ''}`
    );
  },

  updateFeedbackStatus: (id: string, status: string, adminNotes?: string, adminReply?: string, assignedTo?: string) =>
    request(`/community/admin/feedback/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        ...(adminReply !== undefined ? { adminReply } : {}),
        ...(assignedTo !== undefined ? { assignedTo } : {}),
      }),
    }),

  getFeedbackHistory: (id: string) =>
    request<FeedbackHistoryEntry[]>(`/community/admin/feedback/${id}/history`),

  getFeedbackStats: () =>
    request<FeedbackStats>('/community/admin/stats'),

  findSimilarResolved: (params: { q?: string; subCategory?: string; category?: string; limit?: number }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))
    ).toString();
    return request<SimilarResolvedTicket[]>(`/community/admin/similar-resolved${qs ? `?${qs}` : ''}`);
  },

  generateReplyDraft: (id: string) =>
    request<{ draft: string }>(`/community/admin/feedback/${id}/ai-draft`, { method: 'POST' }),

  // ─── Marketplace: Content Requests ───────────────────────────────────────────

  listContentRequests: (params?: Record<string, string>) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return request<{ data: ContentRequestItem[]; next_cursor: string | null; has_more: boolean }>(
      `/marketplace/admin/content-requests${qs ? `?${qs}` : ''}`
    );
  },

  updateContentRequest: (id: string, dto: { title?: string; description?: string; contactInfo?: string }) =>
    request(`/marketplace/admin/content-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  reviewContentRequest: (id: string, status: 'approved' | 'rejected', adminNotes?: string) =>
    request(`/marketplace/admin/content-requests/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...(adminNotes ? { adminNotes } : {}) }),
    }),

  deleteContentRequest: (id: string) =>
    request(`/marketplace/admin/content-requests/${id}`, { method: 'DELETE' }),

  // ─── Marketplace: Job Listings ────────────────────────────────────────────────

  listAdminJobListings: (params?: { status?: string; type?: string }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<JobListingItem[]>(`/marketplace/admin/job-listings${qs ? `?${qs}` : ''}`);
  },

  createJobListing: (dto: {
    title: string; company: string; location?: string;
    type: string; description: string; applyUrl?: string;
    applyEmail?: string; tags?: string[];
  }) =>
    request<{ id: string }>('/marketplace/admin/job-listings', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateJobListing: (id: string, data: Record<string, unknown>) =>
    request<{ id: string }>(`/marketplace/admin/job-listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateJobListingStatus: (id: string, status: 'published' | 'closed') =>
    request<{ id: string }>(`/marketplace/admin/job-listings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteJobListing: (id: string) =>
    request(`/marketplace/admin/job-listings/${id}`, { method: 'DELETE' }),

  // ─── Student Clubs ─────────────────────────────────────────────────────────

  listStudentClubs: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<StudentClubItem[]>(`/student-clubs/admin${qs}`);
  },

  createStudentClub: (dto: {
    name: string; slug: string; university: string; city: string;
    contactName: string; contactEmail: string; contactPhone?: string;
    website?: string; memberCount?: number; description?: string; activities?: string;
  }) =>
    request<{ id: string }>('/student-clubs/admin', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateStudentClub: (id: string, data: Record<string, unknown>) =>
    request<{ id: string }>(`/student-clubs/admin/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateStudentClubStatus: (id: string, status: 'pending' | 'active' | 'suspended', adminNotes?: string) =>
    request<{ id: string }>(`/student-clubs/admin/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...(adminNotes ? { adminNotes } : {}) }),
    }),

  deleteStudentClub: (id: string) =>
    request(`/student-clubs/admin/${id}`, { method: 'DELETE' }),

  assignClubRepresentative: (id: string, representativeId: string | null) =>
    request<{ id: string }>(`/student-clubs/admin/${id}/representative`, {
      method: 'PATCH',
      body: JSON.stringify({ representativeId }),
    }),

  listClubNews: (clubId: string) =>
    request<ClubNewsItem[]>(`/student-clubs/${clubId}/news`),

  createClubNews: (clubId: string, dto: { title: string; summary?: string; body?: string }) =>
    request<{ id: string }>(`/student-clubs/admin/${clubId}/news`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  deleteClubNews: (newsId: string) =>
    request(`/student-clubs/admin/news/${newsId}`, { method: 'DELETE' }),

  listClubEvents: (clubId: string) =>
    request<ClubEventItem[]>(`/student-clubs/${clubId}/club-events`),

  createClubEvent: (clubId: string, dto: { title: string; description?: string; eventDate: string; location?: string; registrationUrl?: string }) =>
    request<{ id: string }>(`/student-clubs/admin/${clubId}/club-events`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  deleteClubEvent: (eventId: string) =>
    request(`/student-clubs/admin/club-events/${eventId}`, { method: 'DELETE' }),

  // ─── CMS Trainings ────────────────────────────────────────────────────────────

  listTrainings: () =>
    request<TrainingItem[]>('/admin/cms/trainings'),

  createTraining: (dto: Record<string, unknown>) =>
    request<TrainingItem>('/admin/cms/trainings', { method: 'POST', body: JSON.stringify(dto) }),

  updateTraining: (id: string, dto: Record<string, unknown>) =>
    request<TrainingItem>(`/admin/cms/trainings/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),

  deleteTraining: (id: string) =>
    request(`/admin/cms/trainings/${id}`, { method: 'DELETE' }),

  // ─── Kurs Bölümleri ───────────────────────────────────────────────────────────

  listSections: (trainingId: string) =>
    request<Array<{ id: string; title: string; description: string | null; sortOrder: number; lessons: Array<{ id: string; slug: string; title: string; contentType: string; durationMinutes: number | null; isFree: boolean; sortOrder: number; isPublished: boolean; videoUrl: string | null; body: string | null; viewCount: number }> }>>(`/admin/cms/trainings/${trainingId}/sections`),

  createSection: (trainingId: string, dto: { title: string; description?: string; sortOrder?: number }) =>
    request<{ id: string; title: string; description: string | null; sortOrder: number }>(`/admin/cms/trainings/${trainingId}/sections`, { method: 'POST', body: JSON.stringify(dto) }),

  updateSection: (id: string, dto: { title?: string; description?: string; sortOrder?: number }) =>
    request<{ id: string; title: string }>(`/admin/cms/sections/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  deleteSection: (id: string) =>
    request(`/admin/cms/sections/${id}`, { method: 'DELETE' }),

  // ─── Kurs Dersleri ────────────────────────────────────────────────────────────

  createLesson: (sectionId: string, dto: {
    slug: string; title: string; contentType?: string; videoUrl?: string;
    body?: string; durationMinutes?: number; sortOrder?: number; isFree?: boolean; xpReward?: number;
  }) =>
    request<{ id: string; title: string; slug: string }>(`/admin/cms/sections/${sectionId}/lessons`, { method: 'POST', body: JSON.stringify(dto) }),

  updateLesson: (id: string, dto: Record<string, unknown>) =>
    request<{ id: string; title: string }>(`/admin/cms/lessons/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  deleteLesson: (id: string) =>
    request(`/admin/cms/lessons/${id}`, { method: 'DELETE' }),

  listAnnouncements: (trainingId: string) =>
    request<Array<{ id: string; title: string; body: string; createdAt: string }>>(`/admin/cms/trainings/${trainingId}/announcements`),

  createAnnouncement: (trainingId: string, dto: { title: string; body: string }) =>
    request<{ id: string; title: string; body: string; createdAt: string }>(`/admin/cms/trainings/${trainingId}/announcements`, { method: 'POST', body: JSON.stringify(dto) }),

  deleteAnnouncement: (id: string) =>
    request(`/admin/cms/announcements/${id}`, { method: 'DELETE' }),

  getTrainingAnalytics: (qs = '') =>
    request<{
      totalEnrollments: number;
      completedCount: number;
      completionRate: number;
      avgProgress: number;
      quizAttempts: number;
      quizPassRate: number;
      avgQuizScore: number;
      totalCertificates: number;
      topCourses: Array<{ id: string; title: string; slug: string; enrollmentCount: number; level: string | null; format: string | null }>;
    }>(`/admin/cms/trainings/analytics${qs}`),

  // ─── Quiz Yönetimi ───────────────────────────────────────────────────────────

  listQuizzes: (trainingId: string) =>
    request<Array<{ id: string; title: string; passingScore: number; maxAttempts: number; randomizeQuestions: boolean; questionPoolSize: number | null; showCorrectAnswers: boolean; timeLimitMinutes: number | null; questions: unknown[] }>>(`/admin/cms/trainings/${trainingId}/quizzes`),

  updateQuizSettings: (quizId: string, dto: { maxAttempts?: number; randomizeQuestions?: boolean; questionPoolSize?: number | null; showCorrectAnswers?: boolean; timeLimitMinutes?: number | null; passingScore?: number; title?: string }) =>
    request<{ id: string; title: string; passingScore: number; maxAttempts: number }>(`/admin/cms/quizzes/${quizId}/settings`, { method: 'PATCH', body: JSON.stringify(dto) }),

  // ─── Ödeme Yönetimi ──────────────────────────────────────────────────────────

  inviteUserToCourse: (trainingId: string, email: string) =>
    request<{ invited: boolean; email: string; displayName: string }>(`/admin/cms/trainings/${trainingId}/invite`, {
      method: 'POST', body: JSON.stringify({ email }),
    }),

  listCoursePayments: () =>
    request<Array<{
      id: string; amount: string; status: string;
      paymentRef: string | null; adminNote: string | null;
      createdAt: string; trainingId: string; trainingTitle: string;
      userId: string; displayName: string | null; email: string;
    }>>('/admin/cms/course-payments'),

  confirmCoursePayment: (id: string, adminNote?: string) =>
    request<{ confirmed: boolean }>(`/admin/cms/course-payments/${id}/confirm`, {
      method: 'POST', body: JSON.stringify({ adminNote }),
    }),

  rejectCoursePayment: (id: string, adminNote?: string) =>
    request<{ rejected: boolean }>(`/admin/cms/course-payments/${id}/reject`, {
      method: 'POST', body: JSON.stringify({ adminNote }),
    }),

  uploadLessonPdf: async (file: File): Promise<{ key: string; url: string }> => {
    const token = localStorage.getItem('access_token');
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_URL}/api/v1/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) throw new Error('PDF yüklenemedi.');
    return res.json() as Promise<{ key: string; url: string }>;
  },

  // ─── Q&A ─────────────────────────────────────────────────────────────────────

  listQaQuestions: (params?: { status?: string; category?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    return request<QaQuestion[]>(`/qa/admin${qs ? `?${qs}` : ''}`);
  },

  createQaQuestion: (dto: { email: string; displayName?: string; questionText: string; category: string }) =>
    request<{ id: string; submitted: boolean }>('/qa', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateQaQuestion: (id: string, dto: { questionText?: string; displayName?: string; category?: string; isFeatured?: boolean }) =>
    request<QaQuestion>(`/qa/admin/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  setQaStatus: (id: string, status: string) =>
    request<{ id: string; status: string }>(`/qa/admin/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  setQaPublish: (id: string, dto: { isMutfakPublished?: boolean; isSahnePublished?: boolean }) =>
    request<{ id: string; isMutfakPublished: boolean; isSahnePublished: boolean }>(`/qa/admin/${id}/publish`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  deleteQaQuestion: (id: string) =>
    request<{ id: string; deleted: boolean }>(`/qa/admin/${id}`, { method: 'DELETE' }),

  addQaAnswer: (questionId: string, dto: { body: string; isPublished?: boolean }) =>
    request<QaAnswer>(`/qa/admin/${questionId}/answers`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateQaAnswer: (answerId: string, dto: { body: string }) =>
    request<{ id: string; body: string }>(`/qa/admin/answers/${answerId}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  publishQaAnswer: (answerId: string, isPublished: boolean) =>
    request<{ id: string; isPublished: boolean }>(`/qa/admin/answers/${answerId}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublished }),
    }),

  deleteQaAnswer: (answerId: string) =>
    request<{ deleted: boolean }>(`/qa/admin/answers/${answerId}`, { method: 'DELETE' }),

  // ─── Exam Resources ───────────────────────────────────────────────────────────

  listExamResources: (exam?: string, type?: string) => {
    const params = new URLSearchParams();
    if (exam) params.set('exam', exam);
    if (type) params.set('type', type);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<ExamResource[]>(`/admin/cms/exam-resources${qs}`);
  },

  createExamResource: (dto: Record<string, unknown>) =>
    request<ExamResource>('/admin/cms/exam-resources', { method: 'POST', body: JSON.stringify(dto) }),

  updateExamResource: (id: string, dto: Record<string, unknown>) =>
    request<ExamResource>(`/admin/cms/exam-resources/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),

  deleteExamResource: (id: string) =>
    request(`/admin/cms/exam-resources/${id}`, { method: 'DELETE' }),

  // ─── Admin Messaging ──────────────────────────────────────────────────────────

  sendBroadcast: (dto: {
    target: 'user' | 'tier' | 'all';
    targetUserId?: string;
    targetTier?: string;
    subject: string;
    body: string;
    sendEmail?: boolean;
    sendNotification?: boolean;
  }) =>
    request<{ sent: number }>('/admin/messages/send', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  previewBroadcastCount: (target: string, targetTier?: string, targetUserId?: string) => {
    const params = new URLSearchParams({ target });
    if (targetTier) params.set('targetTier', targetTier);
    if (targetUserId) params.set('targetUserId', targetUserId);
    return request<{ count: number }>(`/admin/messages/preview-count?${params.toString()}`);
  },

  getBroadcastHistory: () =>
    request<Array<{
      id: string;
      target: string;
      targetTier: string | null;
      subject: string;
      body: string;
      sentCount: number;
      sentEmail: boolean;
      sentNotification: boolean;
      createdAt: string;
      adminDisplayName: string | null;
    }>>('/admin/messages/history'),

  // ─── Admin Inbox (direct DM threads) ─────────────────────────────────────────

  getAdminInboxThreads: () =>
    request<Array<{
      threadId: string;
      user1Id: string;
      user2Id: string;
      lastMessageAt: string;
      lastBody: string | null;
      unreadCount: number;
      counterpart: { id: string; displayName: string | null; avatarUrl: string | null; profession: string | null } | null;
    }>>('/admin/messages/inbox'),

  getAdminInboxMessages: (userId: string, opts?: { before?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (opts?.before) params.set('before', opts.before);
    if (opts?.limit) params.set('limit', String(opts.limit));
    const qs = params.toString();
    return request<{
      data: Array<{ id: string; threadId: string; senderId: string; recipientId: string; body: string; isRead: boolean; createdAt: string }>;
      hasMore: boolean;
    }>(`/admin/messages/inbox/${userId}${qs ? `?${qs}` : ''}`);
  },

  sendAdminInboxMessage: (userId: string, body: string) =>
    request<{ id: string; threadId: string; senderId: string; recipientId: string; body: string; isRead: boolean; createdAt: string }>(
      `/admin/messages/inbox/${userId}`,
      { method: 'POST', body: JSON.stringify({ body }) },
    ),

  deleteAdminInboxThread: (userId: string) =>
    request<void>(`/admin/messages/inbox/${userId}`, { method: 'DELETE' }),

  // ─── Store: Faturalar ────────────────────────────────────────────────────

  listInvoices: (params?: { status?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const q = qs.toString();
    return request<StoreInvoice[]>(`/store/admin/invoices${q ? `?${q}` : ''}`);
  },

  retryInvoice: (id: string) =>
    request<StoreInvoice>(`/store/admin/invoices/${id}/retry`, { method: 'POST' }),

  // ─── Store: Koleksiyonlar ─────────────────────────────────────────────────

  listCollections: () =>
    request<StoreCollection[]>('/store/admin/collections'),

  createCollection: (dto: { slug: string; title: string; description?: string; coverImage?: string; productIds?: string[]; sortOrder?: number }) =>
    request<{ id: string }>('/store/admin/collections', { method: 'POST', body: JSON.stringify(dto) }),

  updateCollection: (id: string, dto: Partial<{ title: string; description: string; coverImage: string; productIds: string[]; isActive: boolean; sortOrder: number }>) =>
    request<StoreCollection>(`/store/admin/collections/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  deleteCollection: (id: string) =>
    request<void>(`/store/admin/collections/${id}`, { method: 'DELETE' }),

  // ─── Store: Escrow Ödemeler ───────────────────────────────────────────────

  getPayoutSummary: () =>
    request<{ summary: StorePayoutSummaryItem[]; payouts: SellerPayout[] }>('/store/admin/payouts/summary'),

  listPayouts: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<SellerPayout[]>(`/store/admin/payouts${qs}`);
  },

  createPayout: (sellerId: string, itemIds: string[], adminNotes?: string) =>
    request<{ id: string; totalAmount: number }>('/store/admin/payouts', {
      method: 'POST',
      body: JSON.stringify({ sellerId, itemIds, ...(adminNotes ? { adminNotes } : {}) }),
    }),

  markPayoutPaid: (id: string, adminNotes?: string) =>
    request<SellerPayout>(`/store/admin/payouts/${id}/paid`, {
      method: 'PATCH',
      body: JSON.stringify({ adminNotes: adminNotes ?? '' }),
    }),

  // ─── Store: Satıcılar ─────────────────────────────────────────────────────

  listStoreSellers: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<StoreSeller[]>(`/store/admin/sellers${qs}`);
  },

  reviewStoreSeller: (id: string, dto: {
    status: 'approved' | 'rejected' | 'suspended';
    adminNotes?: string;
    commissionRate?: number;
    iyzicоSubMerchantKey?: string;
  }) =>
    request<StoreSeller>(`/store/admin/sellers/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  updateStoreSeller: (id: string, dto: {
    commissionRate?: number;
    iyzicоSubMerchantKey?: string;
    iban?: string;
    adminNotes?: string;
  }) =>
    request<StoreSeller>(`/store/admin/sellers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  // ─── Store: Ürünler ───────────────────────────────────────────────────────

  listAdminStoreProducts: async (params?: { type?: string; status?: string; ownerType?: string }): Promise<StoreProduct[]> => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    const res = await request<StoreProduct[] | { data: StoreProduct[] }>(`/store/admin/products${qs ? `?${qs}` : ''}`);
    return Array.isArray(res) ? res : (res as { data: StoreProduct[] }).data ?? [];
  },

  createStoreProduct: (dto: {
    slug: string; ownerType: 'vakif' | 'seller'; sellerId?: string;
    title: string; subtitle?: string; description: string;
    type: 'digital' | 'physical' | 'app';
    price: number; memberPrice?: number;
    images?: string[]; downloadUrl?: string; stock?: number;
    tags?: string[]; badgeLabel?: string; badgeColor?: string;
    status?: string; sortOrder?: number;
  }) =>
    request<{ id: string }>('/store/admin/products', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateStoreProduct: (id: string, dto: Record<string, unknown>) =>
    request<StoreProduct>(`/store/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  deleteStoreProduct: (id: string) =>
    request(`/store/admin/products/${id}`, { method: 'DELETE' }),

  // ─── Store: Kuponlar ──────────────────────────────────────────────────────

  listStoreCoupons: () =>
    request<StoreCoupon[]>('/store/admin/coupons'),

  createStoreCoupon: (dto: {
    code: string; description?: string;
    discountType: 'percentage' | 'fixed'; discountValue: number;
    minOrderAmount?: number; maxUses?: number; expiresAt?: string;
  }) =>
    request<{ id: string }>('/store/admin/coupons', { method: 'POST', body: JSON.stringify(dto) }),

  toggleStoreCoupon: (id: string, isActive: boolean) =>
    request<{ id: string; isActive: boolean }>(`/store/admin/coupons/${id}/toggle`, {
      method: 'PATCH', body: JSON.stringify({ isActive }),
    }),

  deleteStoreCoupon: (id: string) =>
    request(`/store/admin/coupons/${id}`, { method: 'DELETE' }),

  // ─── Store: Analytics ─────────────────────────────────────────────────────

  getStoreAnalytics: (days?: number) =>
    request<StoreAnalytics>(`/store/admin/analytics${days ? `?days=${days}` : ''}`),

  getAdvancedAnalytics: (days?: number) =>
    request<StoreAdvancedAnalytics>(`/store/admin/analytics/advanced${days ? `?days=${days}` : ''}`),

  // ─── Store: Reviews ───────────────────────────────────────────────────────

  listAdminReviews: (published?: boolean) => {
    const qs = published !== undefined ? `?published=${published}` : '';
    return request<StoreReview[]>(`/store/admin/reviews${qs}`);
  },

  publishReview: (id: string, isPublished: boolean) =>
    request<{ id: string; isPublished: boolean }>(`/store/admin/reviews/${id}/publish`, {
      method: 'PATCH', body: JSON.stringify({ isPublished }),
    }),

  deleteReview: (id: string) =>
    request(`/store/admin/reviews/${id}`, { method: 'DELETE' }),

  // ─── Store: Gift Cards ────────────────────────────────────────────────────

  listGiftCards: () => request<StoreGiftCard[]>('/store/admin/gift-cards'),

  createGiftCard: (dto: { purchasedByEmail: string; recipientEmail: string; recipientName: string; amount: number; message?: string; expiresAt?: string }) =>
    request<{ id: string; code: string }>('/store/admin/gift-cards', { method: 'POST', body: JSON.stringify(dto) }),

  // ─── Store: İade ─────────────────────────────────────────────────────────

  listReturns: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<StoreReturn[]>(`/store/admin/returns${qs}`);
  },

  resolveReturn: (id: string, dto: { status: 'approved' | 'rejected' | 'completed'; adminNotes?: string; refundAmount?: number; restockItems?: boolean }) =>
    request<{ id: string; status: string }>(`/store/admin/returns/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  // ─── Store: Kargo ─────────────────────────────────────────────────────────

  calculateShipping: (weightGrams: number, city: string) =>
    request<Array<{ provider: string; cost: number; estimatedDays: number }>>('/store/shipping/calculate', {
      method: 'POST', body: JSON.stringify({ weightGrams, city }),
    }),

  createShipment: (orderId: string, provider: 'yurtici' | 'mng' | 'ptt') =>
    request<{ id: string; trackingNumber: string }>(`/store/admin/orders/${orderId}/shipments`, {
      method: 'POST', body: JSON.stringify({ provider }),
    }),

  getShipments: (orderId: string) =>
    request<StoreShipment[]>(`/store/admin/orders/${orderId}/shipments`),

  // ─── Store: Abonelikler ───────────────────────────────────────────────────

  listAdminSubscriptions: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<StoreSubscription[]>(`/store/admin/subscriptions${qs}`);
  },

  cancelSubscription: (id: string) =>
    request<{ id: string; cancelled: boolean }>(`/store/subscriptions/${id}/cancel`, { method: 'PATCH' }),

  // ─── Store: B2B ───────────────────────────────────────────────────────────

  listB2bGroups: () => request<Array<{ id: string; name: string; discountPct: number }>>('/store/admin/b2b/groups'),

  createB2bGroup: (name: string, discountPct: number) =>
    request<{ id: string }>('/store/admin/b2b/groups', { method: 'POST', body: JSON.stringify({ name, discountPct }) }),

  setB2bPrice: (groupId: string, productId: string, priceKurus: number) =>
    request('/store/admin/b2b/prices', { method: 'POST', body: JSON.stringify({ groupId, productId, priceKurus }) }),

  // ─── Store: Kargo İade Etiketi ────────────────────────────────────────────

  sendStockNotifications: (productId: string) =>
    request<{ notified: number }>(`/store/admin/products/${productId}/send-stock-notifications`, { method: 'POST' }),

  // ─── Store: Email Marketing ───────────────────────────────────────────────

  sendStoreCampaign: (dto: { subject: string; body: string; targetType: 'all_buyers' | 'product_buyers' }) =>
    request<{ sent: number }>('/store/admin/campaigns', { method: 'POST', body: JSON.stringify(dto) }),

  // ─── Store: Siparişler ────────────────────────────────────────────────────

  listAdminStoreOrders: (params?: { status?: string; paymentStatus?: string; limit?: number }) => {
    const sp: Record<string, string> = {};
    if (params?.status) sp.status = params.status;
    if (params?.paymentStatus) sp.paymentStatus = params.paymentStatus;
    if (params?.limit) sp.limit = String(params.limit);
    const qs = new URLSearchParams(sp).toString();
    return request<StoreOrder[]>(`/store/admin/orders${qs ? `?${qs}` : ''}`);
  },

  getStoreOrder: (id: string) =>
    request<StoreOrder & { items: StoreOrderItem[] }>(`/store/admin/orders/${id}`),

  updateStoreOrderStatus: (id: string, status: string) =>
    request<{ id: string }>(`/store/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  updateStoreItemShipping: (itemId: string, dto: {
    shippingStatus: 'preparing' | 'shipped' | 'delivered';
    trackingNumber?: string;
    trackingCompany?: string;
  }) =>
    request<{ id: string }>(`/store/admin/orders/items/${itemId}/shipping`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  // ── Newsletter ──────────────────────────────────────────────────────────
  getNewsletterSubscribers: (limit = 50, offset = 0) =>
    request<BrevoSubscribers>(`/admin/newsletter/subscribers?limit=${limit}&offset=${offset}`),

  updateSubscriberStatus: (email: string, emailBlacklisted: boolean) =>
    request<{ ok: boolean }>(`/admin/newsletter/subscribers/${encodeURIComponent(email)}/status`, {
      method: 'PATCH', body: JSON.stringify({ emailBlacklisted }),
    }),

  removeSubscriber: (email: string) =>
    request<{ ok: boolean }>(`/admin/newsletter/subscribers/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    }),

  getMonthlyContent: (month: string) =>
    request<MonthlyContent>(`/admin/newsletter/monthly-content?month=${month}`),

  listNewsletters: () =>
    request<Newsletter[]>('/admin/newsletter/newsletters'),

  getNewsletter: (id: string) =>
    request<Newsletter>(`/admin/newsletter/newsletters/${id}`),

  createNewsletter: (dto: {
    title: string; month: string; subject: string;
    htmlBody?: string; selectedContent?: Record<string, unknown>;
    channels?: string[]; whatsappTemplateName?: string; whatsappLanguage?: string;
    scheduledAt?: string;
  }) =>
    request<Newsletter>('/admin/newsletter/newsletters', { method: 'POST', body: JSON.stringify(dto) }),

  updateNewsletter: (id: string, dto: Partial<{
    title: string; subject: string; htmlBody: string;
    selectedContent: Record<string, unknown>; channels: string[];
    whatsappTemplateName: string; whatsappLanguage: string;
    scheduledAt: string | null;
  }>) =>
    request<Newsletter>(`/admin/newsletter/newsletters/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),

  deleteNewsletter: (id: string) =>
    request<{ ok: boolean }>(`/admin/newsletter/newsletters/${id}`, { method: 'DELETE' }),

  testSendNewsletter: (id: string, email: string) =>
    request<{ ok: boolean }>(`/admin/newsletter/newsletters/${id}/test`, { method: 'POST', body: JSON.stringify({ email }) }),

  sendNewsletter: (id: string) =>
    request<Newsletter>(`/admin/newsletter/newsletters/${id}/send`, { method: 'POST' }),

  getNewsletterStats: (id: string) =>
    request<{ delivered: number; opens: number; clicks: number; unsubscriptions: number; hardBounces: number; softBounces: number; openRate: number; clickRate: number } | null>(
      `/admin/newsletter/newsletters/${id}/stats`
    ),

  getWhatsappTemplates: () =>
    request<{ templates: Array<{ name: string; status: string; language: string; category: string }> }>(
      '/admin/newsletter/whatsapp-templates'
    ),

  uploadNewsletterImage: async (file: File): Promise<{ key: string; url: string }> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_URL}/api/v1/admin/newsletter/upload-image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<{ key: string; url: string }>;
  },

  getWelcomeSettings: () =>
    request<{ enabled: boolean; subject: string; html: string }>('/admin/newsletter/welcome-settings'),

  updateWelcomeSettings: (body: { enabled: boolean; subject: string; html: string }) =>
    request<{ ok: boolean }>('/admin/newsletter/welcome-settings', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  // ── Newsletter Automations ──────────────────────────────────────────────────
  listAutomations: () =>
    request<NewsletterAutomation[]>('/admin/newsletter/automations'),

  createAutomation: (dto: { name: string; description?: string; triggerType: string; steps: AutomationStep[] }) =>
    request<NewsletterAutomation>('/admin/newsletter/automations', { method: 'POST', body: JSON.stringify(dto) }),

  updateAutomation: (id: string, dto: Partial<{ name: string; description: string; steps: AutomationStep[]; status: string }>) =>
    request<NewsletterAutomation>(`/admin/newsletter/automations/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),

  setAutomationStatus: (id: string, status: 'active' | 'paused' | 'archived') =>
    request<NewsletterAutomation>(`/admin/newsletter/automations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  deleteAutomation: (id: string) =>
    request<{ ok: boolean }>(`/admin/newsletter/automations/${id}`, { method: 'DELETE' }),

  getAutomationLogs: (id: string) =>
    request<AutomationLog[]>(`/admin/newsletter/automations/${id}/logs`),

  // ── Subscriber Profiles & Tags ─────────────────────────────────────────────
  listNewsletterTags: () =>
    request<Array<{ slug: string; label: string; color: string }>>('/admin/newsletter/tags'),

  createNewsletterTag: (body: { slug: string; label: string; color?: string }) =>
    request<{ slug: string; label: string; color: string }>('/admin/newsletter/tags', { method: 'POST', body: JSON.stringify(body) }),

  deleteNewsletterTag: (slug: string) =>
    request<{ ok: boolean }>(`/admin/newsletter/tags/${slug}`, { method: 'DELETE' }),

  getSubscriberProfile: (email: string) =>
    request<SubscriberProfile>(`/admin/newsletter/subscriber-profile/${encodeURIComponent(email)}`),

  upsertSubscriberProfile: (email: string, body: { tags?: string[]; interestAreas?: string[]; region?: string; notes?: string }) =>
    request<{ ok: boolean }>(`/admin/newsletter/subscriber-profile/${encodeURIComponent(email)}`, { method: 'PUT', body: JSON.stringify(body) }),

  bulkTagSubscribers: (emails: string[], addTags?: string[], removeTags?: string[]) =>
    request<{ updated: number }>('/admin/newsletter/subscribers/bulk-tag', { method: 'POST', body: JSON.stringify({ emails, addTags, removeTags }) }),

  previewSegment: (body: { tags?: string[]; regions?: string[]; sources?: string[]; interestAreas?: string[]; behavior?: 'active_90d' | 'inactive_90d' | 'never_opened' }) =>
    request<{ count: number; sample: string[]; behaviorDataAvailable: boolean }>('/admin/newsletter/segments/preview', { method: 'POST', body: JSON.stringify(body) }),

  getBrevoContactsCount: () =>
    request<{ count: number }>('/admin/newsletter/brevo-contacts/count'),

  getBrevoGrowth: () =>
    request<{ totalNewThisMonth: number; weeks: Array<{ label: string; count: number }> }>('/admin/newsletter/brevo-contacts/growth'),

  generatePreferenceToken: (email: string) =>
    request<{ token: string; url: string }>('/admin/newsletter/subscribers/generate-token', { method: 'POST', body: JSON.stringify({ email }) }),

  importSubscribers: (emails: string[]) =>
    request<{ added: number; failed: number }>('/admin/newsletter/subscribers/import', { method: 'POST', body: JSON.stringify({ emails }) }),

  previewSegment: (filters: { tags?: string[]; regions?: string[]; sources?: string[]; interestAreas?: string[]; behavior?: string }) =>
    request<{ count: number; sample: string[]; behaviorDataAvailable: boolean }>('/admin/newsletter/segments/preview', { method: 'POST', body: JSON.stringify(filters) }),

  sendToSegment: (id: string, filters: { tags?: string[]; regions?: string[]; sources?: string[]; interestAreas?: string[]; behavior?: string }) =>
    request<{ ok: boolean; recipientCount: number; campaignId: number }>(`/admin/newsletter/newsletters/${id}/send-segment`, { method: 'POST', body: JSON.stringify(filters) }),

  getInactiveSubscribers: (days?: number) =>
    request<{ count: number; emails: string[]; thresholdDays: number }>(`/admin/newsletter/inactive-subscribers${days ? `?days=${days}` : ''}`),
};

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AutomationStep {
  delayDays: number;
  subject: string;
  htmlBody: string;
  previewText?: string;
}

export interface NewsletterAutomation {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  status: string;
  steps: AutomationStep[];
  createdAt: string;
  updatedAt: string;
}

export interface SubscriberProfile {
  email: string;
  tags: string[];
  interestAreas: string[];
  region: string | null;
  source: string | null;
  notes: string | null;
}

export interface AutomationLog {
  id: string;
  automationId: string;
  subscriberEmail: string;
  stepIndex: number;
  status: string;
  scheduledAt: string;
  sentAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoardMember {
  id: string;
  name: string;
  title: string;
  bio?: string | null;
  photoKey?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CmsEvent {
  id: string;
  slug: string;
  title: string;
  type: string;
  dateStart: string;
  dateEnd?: string | null;
  location?: string | null;
  description?: string | null;
  body?: string | null;
  registrationUrl?: string | null;
  meetingUrl?: string | null;
  coverImageKey?: string | null;
  maxCapacity?: number | null;
  isCancelled?: boolean;
  attendeeCount?: number;
  publicCount?: number;
  isPublished: boolean;
  source?: string | null;
  price?: number;
  paymentUrl?: string | null;
  mutfakPostId?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventSponsor {
  id: string;
  eventId: string;
  companyName: string;
  logoKey?: string | null;
  websiteUrl?: string | null;
  tier: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface EventSpeaker {
  id: string;
  eventId: string;
  name: string;
  title?: string | null;
  affiliation?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  linkedinUrl?: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface EventSession {
  id: string;
  eventId: string;
  speakerId?: string | null;
  speakerName?: string | null;
  speakerTitle?: string | null;
  speakerAffiliation?: string | null;
  speakerAvatarUrl?: string | null;
  title: string;
  description?: string | null;
  sessionType: string;
  hall?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface RegQuestion {
  id: string;
  eventId: string;
  question: string;
  questionType: string;
  options?: string[] | null;
  isRequired: boolean;
  sortOrder: number;
}

export interface RegAnswer {
  attendanceId: string;
  userId: string;
  displayName: string | null;
  question: string;
  answer: string;
}

export interface CmsProject {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  body?: string | null;
  status: 'active' | 'completed' | 'archived';
  coverImageKey?: string | null;
  isPublished: boolean;
  type: 'sahne' | 'linkedin';
  authorName?: string | null;
  authorInitials?: string | null;
  authorAvatarColor?: string | null;
  authorTag?: string | null;
  authorTagColor?: string | null;
  accentGradient?: string | null;
  linkedinUrl?: string | null;
  linkedinViewCount?: number;
  linkedinClickCount?: number;
  linkedinLikeCount?: number;
  linkedinCommentCount?: number;
  linkedinPostUrl?: string | null;
  viewCount?: number;
  hashtags?: string[] | null;
  externalLinks?: Array<{ label: string; href: string }> | null;
  imageKeys?: string[] | null;
  // Künye alanları
  problem?: string | null;
  solution?: string | null;
  features?: string[] | null;
  gains?: { time?: boolean; cost?: boolean; quality?: boolean; safety?: boolean } | null;
  innovationScore?: { local?: boolean; national?: boolean; sector?: boolean; academic?: boolean } | null;
  maturityLevel?: string | null;
  impactDomains?: string[] | null;
  targetAudience?: string[] | null;
  projectType?: string[] | null;
  editorialNote?: string | null;
  editorialScore?: number | null;
  editorialStrengths?: string[] | null;
  // Haritakademi künye
  university?: string | null;
  graduationType?: string | null;
  graduationYear?: number | null;
  projectCategory?: string | null;
  // Ödül
  awardCohortMonth?: number | null;
  awardRank?: number | null;
  finalist?: boolean;
  winner?: boolean;
  awardCommunityVotes?: number | null;
  awardFinalScore?: number | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  membershipTier: string;
  status: string;
  createdAt: string;
  displayName: string | null;
  city: string | null;
  profession: string | null;
  workStatus: string | null;
  experienceYears: number | null;
  skillTags: string[];
  corporateName: string | null;
  verificationStatus: string;
  level: 'izleyici' | 'katilimci' | 'katki_sunan' | 'etki_yaratan';
}

export interface DashboardStats {
  users: {
    total: number;
    newThisMonth: number;
    newLastMonth: number;
    byTier: Record<string, number>;
    byStatus: Record<string, number>;
  };
  applications: {
    pending: number;
    byState: Record<string, number>;
  };
  events: {
    total: number;
    published: number;
    upcoming: number;
    totalViews: number;
    byType: Array<{ type: string; count: number; views: number }>;
  };
  projects: {
    total: number;
    byStatus: Record<string, number>;
  };
  contentRequests: {
    pending: number;
    byType: Record<string, number>;
  };
  marketplace: {
    publishedListings: number;
  };
  studentClubs: {
    active: number;
    pending: number;
  };
  mentorship: {
    pending: number;
    accepted: number;
    completed: number;
    activeMentors: number;
    totalSessions: number;
    totalSessionParticipants: number;
  };
  feed: {
    publishedPosts: number;
    newPostsThisMonth: number;
    newPostsLastMonth: number;
    totalComments: number;
    totalReactions: number;
    byType: Array<{ type: string; count: number }>;
    topCategories: Array<{ category: string; count: number }>;
  };
  sahne: {
    totalViews: number;
    byContentType: Array<{ type: string; views: number; count: number }>;
  };
  memberDetails: {
    topCities: Array<{ city: string; count: number }>;
    byWorkStatus: Array<{ workStatus: string; count: number }>;
    byExperienceBand: Array<{ band: string; count: number }>;
    byAgeBand: Array<{ band: string; count: number }>;
    byVerificationStatus: Record<string, number>;
    recentlyActive: number;
    byJoinMonth: Array<{ month: string; count: number }>;
  };
}

export interface AdminPost {
  id: string;
  type: string;
  category: string;
  title: string | null;
  body: string;
  status: string;
  isPinned: boolean;
  createdAt: string;
  authorId: string;
  displayName: string;
  reactionCount: number;
  commentCount: number;
}

export interface MentorshipSession {
  id: string;
  engagementId: string;
  sessionNumber: number;
  scheduledAt: string | null;
  status: string; // 'pending' | 'scheduled' | 'completed' | 'cancelled'
  actualDurationMinutes: number | null;
  menteeNote: string | null;
  menteeRating: number | null;
  mentorNote: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface AdminMentorshipRequest {
  id: string;
  status: string;
  engagementType: string; // 'single_session' | 'periodic'
  periodMonths: number | null;
  topic: string;
  goal: string;
  preferredFormat: string;
  initiatedBy: string;
  createdAt: string;
  completedAt: string | null;
  mentorNote: string | null;
  menteeFinalRating: number | null;
  menteeFinalComment: string | null;
  mentorFinalComment: string | null;
  sessions: MentorshipSession[];
  mentee: { id: string; email: string; profile: { displayName: string } | null };
  mentor: { id: string; email: string; profile: { displayName: string } | null };
}

export interface AdminMentorProfile {
  id: string;
  userId: string;
  adminStatus: string;
  adminNote: string | null;
  expertiseAreas: string[];
  bio: string | null;
  sessionFormat: string;
  sessionDurationMin: number;
  sessionDurationMax: number;
  capacityType: string; // 'monthly' | 'periodic' | 'both'
  city: string | null;
  monthlyCapacity: number;
  periodicCapacity: number;
  isAcceptingRequests: boolean;
  completedSessionCount: number;
  createdAt: string;
  user: { id: string; email: string; profile: { displayName: string; profession: string | null } | null };
}

export interface AdminMenteeApplication {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  topic: string;
  goal: string;
  preferredFormat: string;
  engagementType: string; // 'single_session' | 'periodic'
  source: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    profile: {
      displayName: string;
      city: string | null;
      profession: string | null;
      bio: string | null;
      birthDate: string | null;
      graduationYear: number | null;
      workStatus: string | null;
      professionalExperienceYears: number | null;
      skillTags: string[];
      linkedinUrl: string | null;
    } | null;
  } | null;
}

export interface FeedbackItem {
  id: string; ticketNo: number; email: string | null; name: string | null; subject: string; body: string;
  type: string; source: string; status: string; adminNotes: string | null; adminReply: string | null;
  createdAt: string; urgency: string | null; subCategory: string | null; expectation: string | null;
  userType: string | null; assignedTo: string | null; attachmentUrls: string | null;
  satisfactionScore: number | null; aiSummary: string | null; routingActions: string | null;
  displayName: string | null; userId: string | null; resolvedAt: string | null;
}

export interface FeedbackHistoryEntry {
  id: string; feedbackId: string; fromStatus: string | null; toStatus: string;
  changedBy: string | null; adminNotes: string | null; createdAt: string;
}

export interface FeedbackStats {
  total: number;
  byStatus: Array<{ status: string; count: number }>;
  bySource: Array<{ source: string; count: number }>;
  byUrgency: Array<{ urgency: string | null; count: number }>;
  byUserType: Array<{ userType: string | null; count: number }>;
  byExpectation: Array<{ expectation: string | null; count: number }>;
  avgSatisfaction: string | null;
  topCategories: Array<{ category: string; count: number }>;
}

export interface SimilarResolvedTicket {
  id: string; ticketNo: number; subject: string; body: string;
  subCategory: string | null; adminNotes: string | null; adminReply: string | null;
  satisfactionScore: number | null; source: string; resolvedAt: string | null; createdAt: string;
}

export interface ContentRequestItem {
  id: string; email: string; displayName: string; source: string;
  type: string; title: string; description: string; contactInfo: string | null;
  status: string; adminNotes: string | null; createdAt: string;
}

export interface JobListingItem {
  id: string; title: string; company: string; location: string | null;
  type: string; description: string; applyUrl: string | null; applyEmail: string | null;
  contactPhone: string | null; price: string | null; source: string | null;
  tags: string[]; status: string; publishedAt: string | null; expiresAt: string | null; createdAt: string;
}

export interface StudentClubItem {
  id: string; name: string; slug: string; university: string; city: string;
  contactName: string; contactEmail: string; contactPhone: string | null;
  website: string | null; memberCount: number; description: string | null;
  activities: string | null; logoKey: string | null;
  status: 'pending' | 'active' | 'suspended'; adminNotes: string | null;
  representativeId: string | null;
  createdAt: string; updatedAt: string;
}

export interface ClubNewsItem {
  id: string; clubId: string; title: string; summary: string | null; body: string | null;
  isPublished: boolean; publishedAt: string; createdAt: string;
}

export interface ClubEventItem {
  id: string; clubId: string; title: string; description: string | null;
  eventDate: string; location: string | null; registrationUrl: string | null;
  isPublished: boolean; createdAt: string;
}

export interface TrainingItem {
  id: string; slug: string; title: string;
  instructor: string | null; instructorTitle: string | null;
  instructorBio: string | null; instructorAvatarKey: string | null;
  format: string | null; level: string | null; duration: string | null;
  price: string | null; memberPrice: string | null;
  accessLevel: string; description: string | null; body: string | null;
  coverImageKey: string | null; tags: string[]; prerequisites: string[];
  certificateThreshold: number | null; enrollmentCount: number;
  isPublished: boolean; registrationUrl: string | null;
  startDate: string | null; source: string | null;
  lessonCount?: number; createdAt: string; updatedAt: string;
  enrollStats?: { total: number; invited: number; ongoing: number; finished: number };
}

export interface ExamResource {
  id: string; examKey: string; resourceType: string; title: string;
  content: string | null; resourceUrl: string | null; eventDate: string | null;
  isPublished: boolean; sortOrder: number; createdAt: string; updatedAt: string;
}

export interface QaAnswer {
  id: string;
  questionId: string;
  submitterUserId: string | null;
  submitterEmail: string | null;
  submitterName: string | null;
  body: string;
  source: string;
  isPublished: boolean;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QaQuestion {
  id: string;
  userId: string | null;
  email: string;
  displayName: string | null;
  questionText: string;
  category: string;
  status: string;
  isMutfakPublished: boolean;
  isSahnePublished: boolean;
  feedPostId: string | null;
  isFeatured: boolean;
  viewCount: number;
  source: string;
  createdAt: string;
  updatedAt: string;
  answers: QaAnswer[];
}

export interface MemberSub {
  id: string;
  memberNumber: string;
  membershipTier: string;
  status: string;
  startsAt: string;
  expiresAt: string;
  createdAt: string;
  guestEmail: string | null;
  user?: { id: string; email: string; profile?: { displayName: string; profession?: string | null } | null } | null;
}

export interface AdminUserDetail extends AdminUser {
  verificationStatus: string;
  lastLoginAt: string | null;
  profile: {
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    city: string | null;
    profession: string | null;
    birthDate: string | null;
    graduationYear: number | null;
    workStatus: string | null;
    experienceYears: number | null;
    professionalExperienceYears: number | null;
    linkedinUrl: string | null;
    websiteUrl: string | null;
    skillTags: string[];
    portfolioUrl: string | null;
    corporateName: string | null;
    corporateRole: string | null;
  } | null;
  functionalRoles: string[];
  applications: Array<{
    id: string;
    type: string;
    state: string;
    createdAt: string;
    formData: Record<string, unknown>;
  }>;
}

export interface SahneStats {
  summary: {
    totalViews: number;
    totalPublished: number;
    avgViewsPerContent: number;
  };
  events: {
    total: number; published: number; upcoming: number; past: number; totalViews: number;
    byType: Array<{ type: string; count: number; views: number }>;
  };
  trainings: {
    total: number; published: number; totalViews: number;
    byFormat: Array<{ format: string; count: number; views: number }>;
    byLevel: Array<{ level: string; count: number }>;
  };
  projects: {
    total: number; published: number; totalViews: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  competitions: { total: number; active: number; ended: number; totalViews: number };
  surveys: { total: number; active: number; ended: number; totalViews: number; totalResponses: number };
  examResources: {
    total: number; published: number; totalViews: number;
    byKey: Array<{ examKey: string; count: number; views: number }>;
  };
  qa: { publishedQuestions: number; publishedAnswers: number; pendingQuestions: number };
  contentTable: Array<{ type: string; label: string; count: number; views: number }>;
}

// ─── Mutfak Behavioral Analytics ─────────────────────────────────────────────

export interface MutfakTierActions {
  // ── Modül Ziyaretleri (20 modül) ──────────────────────────────────────────
  visitHaberita: number;
  visitHaritakariyer: number;
  visitHaritakademi: number;
  visitHaritailesiTV: number;
  visitReklam: number;
  visitForum: number;
  visitMentorluk: number;
  visitSoruCevap: number;
  visitAnketler: number;
  visitHaritailesiVakfi: number;
  visitMutfak: number;
  visitMagaza: number;
  visitEgitimler: number;
  visitEtkinlikler: number;
  visitTalepGorus: number;
  visitBagis: number;
  visitIlanPanosu: number;
  visitHaritailesiGenc: number;
  visitYarismalar: number;
  visitSinavlar: number;
  // ── Mutfak Feed ────────────────────────────────────────────────────────────
  posts: number;
  comments: number;
  reactions: number;
  // ── Forum ──────────────────────────────────────────────────────────────────
  forumQuestions: number;
  forumAnswers: number;
  // ── Mentorluk ──────────────────────────────────────────────────────────────
  mentorlukMenteeApplied: number;
  mentorlukMentorApplied: number;
  mentorSessions: number;
  menteeSessions: number;
  // ── Soru & Cevap ───────────────────────────────────────────────────────────
  qaQuestions: number;
  qaAnswers: number;
  // ── Anketler ───────────────────────────────────────────────────────────────
  surveyAnswers: number;
  // ── Etkinlikler ────────────────────────────────────────────────────────────
  eventsAttended: number;
  etkinlikCreated: number;
  // ── Eğitimler ──────────────────────────────────────────────────────────────
  trainingsAccessed: number;
  egitimCreated: number;
  // ── Yarışmalar ─────────────────────────────────────────────────────────────
  competitionEntries: number;
  // ── Mağaza ─────────────────────────────────────────────────────────────────
  magazaProductCreated: number;
  magazaPurchased: number;
  // ── İlan Panosu ────────────────────────────────────────────────────────────
  ilanCreated: number;
  // ── Form Gönderimleri ──────────────────────────────────────────────────────
  reklamFormSubmitted: number;
  talepFormSubmitted: number;
  bagisFormSubmitted: number;
}

export interface MutfakBehaviorStats {
  generatedAt: string;
  periodMonths: number;
  overview: {
    totalMutfakMembers: number;
    activeLastMonth: number;
    totalActionsThisPeriod: number;
    avgActionsPerMember: number;
    topTier: string;
    topTierActionCount: number;
  };
  tierMatrix: Array<{
    tier: string;
    memberCount: number;
    totalActions: number;
    avgActionsPerMember: number;
    actions: MutfakTierActions;
    topAction: string | null;
  }>;
  monthlyTrend: Array<{
    month: string;
    total: number;
    byTier: Record<string, number>;
  }>;
  actionDistribution: Array<{
    key: keyof MutfakTierActions;
    label: string;
    totalCount: number;
    byTier: Record<string, number>;
  }>;
  topContributors: Array<{
    tier: string;
    userId: string;
    displayName: string | null;
    totalActions: number;
    topAction: string;
    breakdown: Partial<MutfakTierActions>;
  }>;
  profileDepth: Array<{
    tier: string;
    total: number;
    avgCompletionPct: number;
    withBio: number;
    withProfession: number;
    withCity: number;
    withLinkedIn: number;
  }>;
  conversionByMonth: Array<{
    month: string;
    sahneSigned: number;
    mutfakConverted: number;
  }>;
  cohortRetention: Array<{
    cohortMonth: string;
    size: number;
    active30d: number;
    active60d: number;
    active90d: number;
  }>;
}

// ─── Per-user action table ────────────────────────────────────────────────────

export interface MutfakUserRow {
  userId: string;
  displayName: string | null;
  email: string | null;
  tier: string;
  city: string | null;
  profession: string | null;
  joinedAt: string;
  lastActiveAt: string | null;
  actions: MutfakTierActions;
  totalActions: number;
}

export interface MutfakUserStatsPage {
  total: number;
  cursor: string | null;
  users: MutfakUserRow[];
}

export interface CmsTalent {
  id: string;
  userId: string | null;
  displayName: string;
  category: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingInsights {
  insights: Array<{
    id: string;
    type: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    body: string;
    metric?: number;
    unit?: string;
    recommendation: string;
  }>;
  segmentFunnel: Array<{
    segment: string;
    key: string;
    total: number;
    profilePct: number;
    ahaPct: number;
    active30dPct: number;
  }>;
  scoreDistribution: {
    onboarding: Record<string, number>;
    engagement: Record<string, number>;
    communityHealth: Record<string, number>;
  };
  retentionCorrelations: Array<{
    action: string;
    label: string;
    retentionRate: number;
    sampleSize: number;
  }>;
  anomalies: Array<{
    metric: string;
    label: string;
    current: number;
    previous: number;
    changePct: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  eventTracking: Record<string, number>;
  meta: {
    ahaRetentionRate: number;
    nonAhaRetentionRate: number;
    ahaRetentionMultiplier: number;
  };
}

export interface OnboardingMetrics {
  funnel: {
    applied: number;
    approved: number;
    activated: number;
    profileComplete: number;
    ahaMoment: number;
  };
  ahaBreakdown: {
    firstEventAttended: number;
    firstMentorMatch: number;
    firstPostCreated: number;
    firstProjectShared: number;
  };
  avgDaysToAha: number;
  dropoffByStep: {
    afterApproval: number;
    afterActivation: number;
    afterProfile: number;
  };
  retentionByMonth: Array<{
    month: string;
    cohortSize: number;
    retained: number;
    rate: number;
  }>;
}

export interface TimelineEvent {
  id: string;
  at: string;
  type: 'state_change' | 'audit' | 'notes' | 'interview' | 'payment';
  title: string;
  description?: string;
  actor?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentSummary {
  pendingPayments: number;
  overduePayments: number;
  remindedPayments: number;
  waitingVerification: number;
  verifiedThisMonth: number;
  failedPayments: number;
  waivedPayments: number;
  expiredPayments: number;
  totalVerifiedAmountKurus: number;
  remindersSentThisMonth: number;
}

export interface PaymentRow {
  id: string;
  type: string;
  state: string;
  applicantEmail: string;
  applicantUserId: string | null;
  paymentStatus: string;
  paymentDueAt: string | null;
  paymentAmountKurus: number | null;
  paymentDescription: string | null;
  reminderCount: number;
  lastReminderAt: string | null;
  createdAt: string;
  displayName: string | null;
  membershipTier: string | null;
}

export interface AvailabilitySlot {
  id: string;
  adminId: string;
  startAt: string;
  endAt: string;
  slotType: 'membership' | 'mentorship';
  capacity: number;
  bookedCount: number;
  notes: string | null;
  createdAt: string;
  admin?: { id: string; profile?: { displayName: string } | null };
}

export interface CommunityHealth {
  atRisk: Array<{
    userId: string;
    displayName: string | null;
    email: string;
    membershipTier: string;
    daysSinceLogin: number | null;
    onboardingComplete: boolean;
    riskReasons: Array<'inactive_10d' | 'abandoned_onboarding' | 'mentor_no_response'>;
  }>;
  healthSummary: {
    totalActive: number;
    atRiskCount: number;
    ahaReachedPct: number;
    activeRatioPct: number;
    avgAhaScore: number;
  };
  trends: Array<{
    metric: string;
    label: string;
    thisWeek: number;
    lastWeek: number;
    changePct: number;
  }>;
  productInsights: Array<{
    id: string;
    title: string;
    body: string;
    type: 'trend' | 'opportunity' | 'warning';
  }>;
}

export interface StoreReturn {
  id: string; orderId: string; orderItemId: string | null;
  buyerId: string | null; buyerEmail: string; reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  adminNotes: string | null; refundAmount: number | null; restockItems: boolean;
  resolvedAt: string | null; createdAt: string;
}

export interface StoreShipment {
  id: string; orderId: string; provider: string;
  trackingNumber: string | null; trackingUrl: string | null;
  shippingCostKurus: number; status: string; labelUrl: string | null; createdAt: string;
}

export interface StoreSubscription {
  id: string; productId: string | null; buyerId: string | null;
  buyerEmail: string; buyerName: string;
  interval: 'monthly' | 'quarterly' | 'yearly';
  priceKurus: number; status: 'active' | 'paused' | 'cancelled' | 'past_due';
  nextBillingAt: string | null; cancelledAt: string | null; createdAt: string;
}

export interface StoreAdvancedAnalytics {
  period: number;
  avgLTV: number;
  topCustomers: Array<{ email: string; total: number }>;
  repeatBuyers: number;
  conversionRate: number;
  periodRevenue: number;
  totalOrders: number;
  salesByDay: Array<{ label: string; count: number }>;
}

export interface StoreAnalytics {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  period: number;
  dailyTrend: Array<{ day: string; orders: number; revenue: number }>;
  topProducts: Array<{ title: string; quantity: number; revenue: number }>;
}

export interface StoreReview {
  id: string;
  productId: string | null;
  orderId: string | null;
  buyerId: string | null;
  buyerName: string;
  buyerEmail: string;
  rating: number;
  comment: string | null;
  isPublished: boolean;
  createdAt: string;
}

export interface StoreGiftCard {
  id: string;
  code: string;
  originalAmount: number;
  balance: number;
  purchasedByEmail: string;
  recipientEmail: string;
  recipientName: string;
  message: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface StoreCoupon {
  id: string;
  code: string;
  description: string | null;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface StoreSeller {
  id: string;
  userId: string | null;
  applicantName: string;
  email: string;
  phone: string | null;
  businessType: 'bireysel' | 'kurumsal';
  businessName: string | null;
  taxNumber: string | null;
  iban: string | null;
  productDescription: string;
  commissionRate: string | null;
  iyzicоSubMerchantKey: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  appliedFrom: 'sahne' | 'mutfak';
  adminNotes: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface StoreProduct {
  id: string;
  slug: string;
  ownerType: 'vakif' | 'seller';
  sellerId: string | null;
  title: string;
  subtitle: string | null;
  description: string;
  type: 'digital' | 'physical' | 'app';
  price: number;
  memberPrice: number | null;
  images: string[];
  downloadUrl: string | null;
  stock: number | null;
  tags: string[];
  badgeLabel: string | null;
  badgeColor: string | null;
  variants: Array<{ name: string; values: string[]; priceModifier?: number }>;
  status: 'draft' | 'active' | 'paused' | 'archived';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreOrder {
  id: string;
  buyerId: string | null;
  buyerName: string;
  buyerEmail: string;
  shippingAddress: Record<string, unknown> | null;
  subtotal: number;
  total: number;
  iyzicоConversationId: string | null;
  iyzicоPaymentId: string | null;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  status: 'pending' | 'processing' | 'partially_shipped' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  notes: string | null;
  createdAt: string;
}

export interface StoreOrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productSnapshot: { title: string; price: number; type: string; ownerType: string; downloadUrl: string | null };
  sellerId: string | null;
  quantity: number;
  unitPrice: number;
  commissionAmount: number;
  sellerAmount: number;
  shippingStatus: 'pending' | 'preparing' | 'shipped' | 'delivered';
  trackingNumber: string | null;
  trackingCompany: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  payoutStatus: 'held' | 'released' | 'disputed' | 'cancelled';
  buyerConfirmedAt: string | null;
  autoReleaseAt: string | null;
  createdAt: string;
}

export interface StoreInvoice {
  id: string;
  orderId: string;
  invoiceNumber: string;
  invoiceType: 'e_arsiv' | 'e_fatura';
  status: 'draft' | 'sent' | 'failed' | 'cancelled';
  buyerName: string;
  buyerEmail: string;
  buyerTaxNumber: string | null;
  subtotal: number;
  vatAmount: number;
  total: number;
  providerInvoiceId: string | null;
  webhookSentAt: string | null;
  issuedAt: string;
  createdAt: string;
}

export interface StoreCollection {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  productIds: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface StorePayoutSummaryItem {
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  iban: string | null;
  releasedAmount: number;
  itemCount: number;
  itemIds: string[];
}

export interface SellerPayout {
  id: string;
  sellerId: string;
  totalAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  itemIds: string[];
  adminNotes: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface LevelStats {
  distribution: {
    izleyici: number;
    katilimci: number;
    katki_sunan: number;
    etki_yaratan: number;
    total: number;
  };
  topActions: Array<{ actionId: string; count: number }>;
  trackedUsers: number;
}

// ─── Newsletter ───────────────────────────────────────────────────────────────

export interface Newsletter {
  id: string;
  title: string;
  month: string;
  subject: string;
  htmlBody: string | null;
  selectedContent: Record<string, unknown> | null;
  channels: string[];
  whatsappTemplateName: string | null;
  whatsappLanguage: string | null;
  brevioCampaignId: number | null;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduledAt: string | null;
  sentAt: string | null;
  emailCount: number | null;
  whatsappCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyContent {
  month: string;
  events: Array<{ id: string; slug: string; title: string; type: string; dateStart: string; location: string | null; isPublished: boolean }>;
  trainings: Array<{ id: string; slug: string; title: string; instructor: string | null; level: string | null; format: string | null; isPublished: boolean; startDate: string | null }>;
  jobs: Array<{ id: string; title: string; company: string; location: string | null; type: string; publishedAt: string | null }>;
  competitions: Array<{ id: string; slug: string; title: string; deadline: string | null }>;
  qa: Array<{ id: string; questionText: string; category: string; createdAt: string; isFeatured: boolean }>;
  projects: Array<{ id: string; slug: string; title: string; authorName: string | null; authorTag: string | null; status: string; isPublished: boolean }>;
  talents: Array<{ id: string; title: string; category: string; displayName: string; isPublished: boolean }>;
  surveys: Array<{ id: string; title: string; description: string | null; status: string; responseCount: number }>;
  products: Array<{ id: string; slug: string; title: string; type: string; price: number }>;
  idols: Array<{ id: string; name: string; title: string; organization: string; description?: string; mediaUrl?: string }>;
}

export interface BrevoSubscribers {
  contacts: Array<{ email: string; createdAt: string; emailBlacklisted: boolean }>;
  count: number;
}

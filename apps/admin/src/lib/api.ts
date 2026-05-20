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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }

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
      createdAt: string; stateLogs: Array<{ fromState: string | null; toState: string; createdAt: string; reason: string | null }>;
      validNextStates: string[];
    }>(`/admin/applications/${id}`),

  transitionState: (id: string, toState: string, reason?: string) =>
    request(`/admin/applications/${id}/state`, {
      method: 'PATCH',
      body: JSON.stringify({ toState, reason }),
    }),

  updateNotes: (id: string, adminNotes: string) =>
    request(`/admin/applications/${id}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ adminNotes }),
    }),

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
    request<{ count: number; attendees: Array<{ userId: string; displayName: string | null; avatarUrl: string | null; profession: string | null; joinedAt: string }> }>(`/admin/cms/events/${id}/attendees`),

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

  updateFeedbackStatus: (id: string, status: string, adminNotes?: string) =>
    request(`/community/admin/feedback/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...(adminNotes ? { adminNotes } : {}) }),
    }),

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
};

// ─── Types ─────────────────────────────────────────────────────────────────────

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
  isPublished: boolean;
  source?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
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
  hashtags?: string[] | null;
  externalLinks?: Array<{ label: string; href: string }> | null;
  imageKeys?: string[] | null;
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
  id: string; email: string | null; subject: string; body: string;
  type: string; source: string; status: string; adminNotes: string | null; createdAt: string;
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
  format: string | null; level: string | null; duration: string | null;
  price: string | null; memberPrice: string | null; description: string | null;
  tags: string[]; isPublished: boolean; registrationUrl: string | null;
  startDate: string | null; source: string | null; createdAt: string; updatedAt: string;
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

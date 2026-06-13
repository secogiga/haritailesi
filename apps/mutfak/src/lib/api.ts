const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ── Unified fetch with automatic 401 → refresh → retry ───────────────────────

let _refreshing: Promise<string> | null = null;

async function apiFetch<T>(
  path: string,
  init: RequestInit & { token?: string; isForm?: boolean; timeoutMs?: number },
): Promise<T> {
  const { token, isForm, timeoutMs = 15_000, ...fetchInit } = init;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const makeHeaders = (t?: string): HeadersInit => ({
    ...(!isForm ? { 'Content-Type': 'application/json' } : {}),
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  });

  const doFetch = (t?: string) =>
    fetch(`${API_URL}/api/v1${path}`, {
      ...fetchInit,
      headers: makeHeaders(t),
      credentials: 'include',
      signal: fetchInit.signal ?? controller.signal,
    }).finally(() => clearTimeout(timeoutId));

  let res = await doFetch(token);

  // On 401, try refreshing once then retry
  if (res.status === 401 && token && typeof window !== 'undefined') {
    try {
      if (!_refreshing) {
        const rt = localStorage.getItem('mutfak_refresh');
        if (!rt) throw new Error('no-rt');
        _refreshing = fetch(`${API_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ refreshToken: rt }),
        })
          .then(async (r) => {
            if (!r.ok) throw new Error('refresh-failed');
            const data = (await r.json()) as TokenPair;
            localStorage.setItem('mutfak_access', data.accessToken);
            localStorage.setItem('mutfak_refresh', data.refreshToken);
            return data.accessToken;
          })
          .finally(() => { _refreshing = null; });
      }
      const newToken = await _refreshing;
      res = await doFetch(newToken);
    } catch {
      localStorage.removeItem('mutfak_access');
      localStorage.removeItem('mutfak_refresh');
    }
  }

  if (!res.ok) {
    if (res.status === 401) throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? 'İstek başarısız.');
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

function get<T>(path: string, token: string) {
  return apiFetch<T>(path, { method: 'GET', token });
}
function post<T>(path: string, body: unknown, token?: string) {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body), ...(token !== undefined ? { token } : {}) });
}
function patch<T>(path: string, body: unknown, token: string) {
  return apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body), token });
}
function put<T>(path: string, body: unknown, token: string) {
  return apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body), token });
}
function del<T>(path: string, token: string) {
  return apiFetch<T>(path, { method: 'DELETE', token });
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
  title: string;
  subtitle: string | null;
  description: string;
  type: 'digital' | 'physical' | 'app';
  price: number;
  memberPrice: number | null;
  images: string[];
  stock: number | null;
  tags: string[];
  status: string;
}

export interface StoreOrderItem {
  id: string;
  orderId: string;
  productSnapshot: { title: string; price: number; type: string; ownerType: string };
  quantity: number;
  unitPrice: number;
  commissionAmount: number;
  sellerAmount: number;
  shippingStatus: 'pending' | 'preparing' | 'shipped' | 'delivered';
  trackingNumber: string | null;
  trackingCompany: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
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
    skillTags: string[];
    portfolioUrl: string | null;
  } | null;
  functionalRoles: string[];
  badges?: string[];
}


export interface ProfileUpdate {
  displayName?: string;
  bio?: string;
  city?: string;
  profession?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  skillTags?: string[];
  portfolioUrl?: string;
}


export interface Member {
  id: string;
  membershipTier: string;
  createdAt: string;
  lastLoginAt: string | null;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  profession: string | null;
}

export interface MemberProfile extends Member {
  linkedinUrl: string | null;
  websiteUrl: string | null;
  skillTags: string[];
  portfolioUrl: string | null;
  corporateName?: string | null;
  corporateRole?: string | null;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  completedSessionCount?: number;
  isFollowing?: boolean;
  badges?: string[];
}

export interface DmThread {
  threadId: string;
  user1Id: string;
  user2Id: string;
  lastMessageAt: string;
  lastBody: string | null;
  unreadCount: number;
  counterpart: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    profession: string | null;
    isStaff: boolean;
  } | null;
}

export interface DirectMessage {
  id: string;
  threadId: string;
  senderId: string;
  recipientId: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface OgData {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

export interface SearchResult {
  posts: Array<{
    id: string;
    type: string;
    title: string | null;
    body: string;
    createdAt: string;
    authorId: string;
    displayName: string;
    avatarUrl: string | null;
  }>;
  members: Array<{
    id: string;
    displayName: string;
    avatarUrl: string | null;
    profession: string | null;
    city: string | null;
    membershipTier: string;
  }>;
}

export interface FollowUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  profession: string | null;
  membershipTier: string;
  followedAt: string;
}

// ── Feed types ───────────────────────────────────────────────────────────────

export const POST_TYPE_LABELS: Record<string, string> = {
  general: 'Genel',
  question: 'Soru',
  idea: 'Fikir',
  project_call: 'Proje Çağrısı',
  content_draft: 'İçerik Taslağı',
  team_search: 'Ekip Arıyorum',
  mentorship_experience: 'Mentorluk Deneyimi',
  poll: 'Anket',
  announcement: 'Duyuru',
  resource: 'Kaynak',
};

export const POST_CATEGORY_LABELS: Record<string, string> = {
  klasik_haritacilik: 'Klasik Haritacılık',
  cbs: 'CBS / GIS',
  fotogrametri_uzaktan_algilama: 'Fotogrametri & UA',
  insaat: 'İnşaat Ölçmesi',
  gayrimenkul_degerleme: 'Gayrimenkul Değerleme',
  yazilim_teknoloji: 'Yazılım & Teknoloji',
  kariyer: 'Kariyer',
  egitim: 'Eğitim',
  mentorluk: 'Mentorluk',
  gonullulik: 'Gönüllülük',
  proje_gelistirme: 'Proje Geliştirme',
  haritailesi_duyurulari: 'Haritailesi Duyuruları',
};

export const POST_TYPES = Object.keys(POST_TYPE_LABELS) as string[];
export const POST_CATEGORIES = Object.keys(POST_CATEGORY_LABELS) as string[];

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  sortOrder: number;
}

export interface FeedPost {
  id: string;
  type: string;
  category: string;
  title: string | null;
  body: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt?: string;
  authorId: string;
  displayName: string;
  avatarUrl: string | null;
  profession: string | null;
  reactionCount: number;
  commentCount: number;
  viewerReaction?: string | null;
  reactionSummary?: Record<string, number>;
  isBookmarked?: boolean;
  imageUrl?: string | null;
  pollOptions?: PollOption[] | null;
  viewerVote?: string | null;
  libraryRefs?: { type: 'term' | 'guide' | 'regulation'; slug: string; title: string }[];
}

export interface PostComment {
  id: string;
  body: string;
  isDeleted: boolean;
  createdAt: string;
  authorId: string;
  parentId: string | null;
  displayName: string;
  avatarUrl: string | null;
}

export interface FeedPage {
  data: FeedPost[];
  next_cursor: string | null;
  has_more: boolean;
}

export const EXPERTISE_LABELS: Record<string, string> = {
  kadastro: 'Kadastro',
  fotogrametri: 'Fotogrametri',
  uzaktan_algilama: 'Uzaktan Algılama',
  cbs_gis: 'CBS / GIS',
  insaat_olcmesi: 'İnşaat Ölçmesi',
  gayrimenkul: 'Gayrimenkul',
  deniz_hidrografi: 'Deniz Hidrografi',
  yazilim_teknoloji: 'Yazılım & Teknoloji',
  kariyer_danismanligi: 'Kariyer Danışmanlığı',
  akademik_arastirma: 'Akademik Araştırma',
  girisimcilik: 'Girişimcilik',
};

export interface MentorListItem {
  id: string;
  userId: string;
  expertiseAreas: string[];
  bio: string | null;
  sessionFormat: string;
  city: string | null;
  monthlyCapacity: number;
  completedSessionCount: number;
  displayName: string;
  avatarUrl: string | null;
  profession: string | null;
  averageRating: number | null;
  ratingCount: number;
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

export interface MentorshipRequest {
  id: string;
  menteeId: string;
  mentorId: string;
  topic: string;
  goal: string;
  preferredFormat: string;
  engagementType: string; // 'single_session' | 'periodic'
  periodMonths: number | null;
  status: string;
  mentorNote: string | null;
  // dönem sonu değerlendirmesi
  menteeFinalRating: number | null;
  menteeFinalComment: string | null;
  mentorFinalComment: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sessions: MentorshipSession[];
  mentor?: {
    id: string;
    email: string;
    profile: { displayName: string; avatarUrl: string | null; profession: string | null } | null;
  };
  mentee?: {
    id: string;
    email: string;
    profile: { displayName: string; avatarUrl: string | null; profession: string | null; city: string | null } | null;
  };
}

export interface EngagementHistoryItem extends MentorshipRequest {
  role: 'mentee' | 'mentor';
  counterpart: {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    profession: string | null;
  };
}

export interface UpcomingSession {
  id: string;
  sessionRowId?: string;
  sessionNumber?: number;
  engagementType?: string; // 'single_session' | 'periodic'
  topic: string;
  status: string;
  scheduledAt: string | null;
  proposedScheduledAt: string | null;
  rescheduleNote: string | null;
  menteeId: string;
  mentorId: string;
  mentorNote: string | null;
  preferredFormat: string | null;
  role: 'mentee' | 'mentor';
  roomName?: string | null;
  sessionId?: string | null;
  completedAt?: string | null;
  counterpart: {
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    profession: string | null;
  };
}

export interface MyMentorProfile {
  id: string;
  userId: string;
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
  adminStatus: string;
}


export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, string> | null;
  isRead: boolean;
  createdAt: string;
}

export interface CommunityStats {
  memberCount: number;
  postsThisWeek: number;
  activeMentors: number;
}

export interface MyActivityStats {
  reactionsThisWeek: number;
  newFollowersThisWeek: number;
  commentsThisWeek: number;
  postsThisWeek: number;
}

export interface QaAnswer {
  id: string;
  body: string;
  source: string;
  submitterName: string | null;
  tierLabel: string | null;
  updatedAt: string;
}

export interface QaItem {
  id: string;
  displayName: string | null;
  questionText: string;
  category: string;
  isFeatured: boolean;
  viewCount: number;
  feedPostId: string | null;
  createdAt: string;
  answers: QaAnswer[];
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
  registrationUrl: string | null;
  meetingUrl: string | null;
  viewCount: number;
  coverImageKey: string | null;
  maxCapacity: number | null;
  isCancelled: boolean;
  attendeeCount: number;
  isPublished: boolean;
  createdAt: string;
}

export const mutfakApi = {
  login: (email: string, password: string) =>
    post<TokenPair>('/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    post<TokenPair>('/auth/refresh', { refreshToken }),

  logout: (accessToken: string, refreshToken: string) =>
    post<void>('/auth/logout', { refreshToken }, accessToken),

  getMe: (accessToken: string) =>
    get<Me>('/users/me', accessToken),

  heartbeat: (accessToken: string) =>
    fetch(`${API_URL}/api/v1/users/me/heartbeat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => {}),

  updateProfile: (data: ProfileUpdate, accessToken: string) =>
    patch<Me['profile']>('/users/me/profile', data, accessToken),

  uploadAvatar: async (file: File, accessToken: string): Promise<{ avatarUrl: string }> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_URL}/api/v1/users/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message ?? 'Yükleme başarısız.');
    }
    return res.json() as Promise<{ avatarUrl: string }>;
  },

  getSuggestedMembers: (accessToken: string) =>
    get<Array<{ id: string; displayName: string; avatarUrl: string | null; profession: string | null; city: string | null; skillTags: string[] }>>('/users/me/suggested', accessToken),

  listMembers: (accessToken: string, q?: string) => {
    const query = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
    return get<Member[]>(`/users/members${query}`, accessToken);
  },

  getMember: (userId: string, accessToken: string) =>
    get<MemberProfile>(`/users/${userId}`, accessToken),

  // ── Feed ────────────────────────────────────────────────────────────────────

  listPosts: (token: string, params?: { cursor?: string; category?: string; type?: string; q?: string; authorId?: string; limit?: number; filter?: string; sort?: string }) => {
    const qs = new URLSearchParams();
    if (params?.cursor) qs.set('cursor', params.cursor);
    if (params?.category) qs.set('category', params.category);
    if (params?.type) qs.set('type', params.type);
    if (params?.q) qs.set('q', params.q);
    if (params?.authorId) qs.set('authorId', params.authorId);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.filter) qs.set('filter', params.filter);
    if (params?.sort) qs.set('sort', params.sort);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return get<FeedPage>(`/posts${query}`, token);
  },

  getPost: (postId: string, token: string) =>
    get<FeedPost>(`/posts/${postId}`, token),

  createPost: (
    data: { type: string; category: string; title?: string; body: string; pollOptions?: string[]; isPublic?: boolean; libraryRefs?: { type: string; slug: string; title: string }[] },
    token: string,
  ) => post<FeedPost>('/posts', data, token),

  voteOnPoll: (postId: string, optionId: string, token: string) =>
    post<{ optionId: string | null }>(`/posts/${postId}/vote`, { optionId }, token),

  updatePost: (
    id: string,
    data: { title?: string | null; body?: string },
    token: string,
  ) => patch<FeedPost>(`/posts/${id}`, data, token),

  deletePost: (id: string, token: string) =>
    del<FeedPost>(`/posts/${id}`, token),

  reactToPost: (id: string, type: string, token: string) =>
    post<{ reacted: boolean; type: string | null }>(`/posts/${id}/react`, { type }, token),

  listComments: (postId: string, token: string) =>
    get<PostComment[]>(`/posts/${postId}/comments`, token),

  addComment: (postId: string, body: string, token: string, parentId?: string) =>
    post<PostComment>(`/posts/${postId}/comments`, { body, ...(parentId ? { parentId } : {}) }, token),

  deleteComment: (commentId: string, token: string) =>
    del<PostComment>(`/posts/comments/${commentId}`, token),

  // ── Mentorship ──────────────────────────────────────────────────────────────

  listMentors: (token: string, params?: { expertise?: string; format?: string }) => {
    const qs = new URLSearchParams();
    if (params?.expertise) qs.set('expertise', params.expertise);
    if (params?.format) qs.set('format', params.format);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return get<MentorListItem[]>(`/mentorship/mentors${query}`, token);
  },

  sendMentorshipRequest: (
    data: { mentorId: string; topic: string; goal: string; preferredFormat: 'online' | 'in_person' },
    token: string,
  ) => post<MentorshipRequest>('/mentorship/requests', data, token),

  getMyRequests: (token: string) =>
    get<MentorshipRequest[]>('/mentorship/my-requests', token),

  getMyHistory: (token: string) =>
    get<EngagementHistoryItem[]>('/mentorship/my-history', token),

  cancelRequest: (id: string, token: string) =>
    del<MentorshipRequest>(`/mentorship/requests/${id}`, token),

  submitFeedback: (id: string, data: { rating: number; feedbackComment?: string }, token: string) =>
    post<MentorshipRequest>(`/mentorship/requests/${id}/feedback`, data, token),

  getMyMentorProfile: (token: string) =>
    get<MyMentorProfile | undefined>('/mentorship/my-profile', token),

  upsertMentorProfile: (
    data: {
      expertiseAreas: string[];
      bio?: string;
      sessionFormat: 'online' | 'in_person' | 'both';
      city?: string;
      monthlyCapacity: number;
      periodicCapacity?: number;
      sessionDurationMin?: number;
      sessionDurationMax?: number;
      capacityType?: 'monthly' | 'periodic' | 'both';
      isAcceptingRequests: boolean;
    },
    token: string,
  ) => put<MyMentorProfile>('/mentorship/my-profile', data, token),

  getIncomingRequests: (token: string) =>
    get<MentorshipRequest[]>('/mentorship/incoming-requests', token),

  respondToRequest: (
    id: string,
    data: { action: 'accept' | 'reject'; mentorNote?: string },
    token: string,
  ) => patch<MentorshipRequest>(`/mentorship/requests/${id}/respond`, data, token),

  completeSession: (id: string, token: string) =>
    patch<MentorshipRequest>(`/mentorship/requests/${id}/complete`, {}, token),

  proposeReschedule: (id: string, data: { scheduledAt: string; rescheduleNote?: string }, token: string) =>
    patch<MentorshipRequest>(`/mentorship/requests/${id}/reschedule`, data, token),

  respondToReschedule: (id: string, action: 'accept' | 'reject', token: string) =>
    patch<MentorshipRequest>(`/mentorship/requests/${id}/reschedule/respond`, { action }, token),

  // ── Oturum Yönetimi ─────────────────────────────────────────────────────────

  getEngagementSessions: (engagementId: string, token: string) =>
    get<MentorshipSession[]>(`/mentorship/engagements/${engagementId}/sessions`, token),

  scheduleSession: (sessionId: string, scheduledAt: string, token: string) =>
    patch<MentorshipSession>(`/mentorship/sessions/${sessionId}/schedule`, { scheduledAt }, token),

  completeSessionById: (sessionId: string, token: string) =>
    patch<MentorshipSession>(`/mentorship/sessions/${sessionId}/complete`, {}, token),

  submitSessionNote: (
    sessionId: string,
    data: { note: string; rating?: number },
    token: string,
  ) => post<MentorshipSession>(`/mentorship/sessions/${sessionId}/note`, data, token),

  submitFinalEvaluation: (
    engagementId: string,
    data: { comment: string; rating?: number },
    token: string,
  ) => post<MentorshipRequest>(`/mentorship/engagements/${engagementId}/final-evaluation`, data, token),

  // ── Sessions ────────────────────────────────────────────────────────────────

  getMyUpcomingSessions: (token: string) =>
    get<UpcomingSession[]>('/sessions/my-upcoming', token),

  getMyUnratedSessions: (token: string) =>
    get<UpcomingSession[]>('/sessions/my-to-rate', token),

  startSession: (
    data: { referenceType: string; referenceId: string },
    token: string,
  ) => post<{ roomName: string; sessionId: string }>('/sessions/start', data, token),

  // ── Auth extras ─────────────────────────────────────────────────────────────

  forgotPassword: (email: string) =>
    post<void>('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    post<void>('/auth/reset-password', { token, newPassword }),

  setupPassword: (token: string, password: string) =>
    post<{ accessToken: string; refreshToken: string }>('/auth/setup-password', { token, password }),

  changePassword: (data: { currentPassword: string; newPassword: string }, token: string) =>
    post<void>('/auth/change-password', data, token),

  // ── Follow ──────────────────────────────────────────────────────────────────

  followUser: (userId: string, token: string) =>
    post<{ following: boolean }>(`/users/${userId}/follow`, {}, token),

  unfollowUser: (userId: string, token: string) =>
    del<{ following: boolean }>(`/users/${userId}/follow`, token),

  getFollowers: (userId: string, token: string) =>
    get<FollowUser[]>(`/users/${userId}/followers`, token),

  getFollowing: (userId: string, token: string) =>
    get<FollowUser[]>(`/users/${userId}/following`, token),

  // ── Bookmarks ───────────────────────────────────────────────────────────────

  bookmarkPost: (postId: string, token: string) =>
    post<{ bookmarked: boolean }>(`/posts/${postId}/bookmark`, {}, token),

  getMyBookmarks: (token: string) =>
    get<FeedPost[]>('/posts/bookmarks/my', token),

  // ── Post image ──────────────────────────────────────────────────────────────

  uploadPostImage: async (postId: string, file: File, token: string): Promise<{ imageKey: string }> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_URL}/api/v1/posts/${postId}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message ?? 'Yükleme başarısız.');
    }
    return res.json() as Promise<{ imageKey: string }>;
  },

  // ── Messages ─────────────────────────────────────────────────────────────────

  getThreads: (token: string) =>
    get<DmThread[]>('/messages', token),

  getMessages: (userId: string, token: string, opts?: { before?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (opts?.before) params.set('before', opts.before);
    if (opts?.limit) params.set('limit', String(opts.limit));
    const qs = params.toString();
    return get<{ data: DirectMessage[]; hasMore: boolean }>(`/messages/${userId}${qs ? `?${qs}` : ''}`, token);
  },

  sendMessage: (userId: string, body: string, token: string) =>
    post<DirectMessage>(`/messages/${userId}`, { body }, token),

  markThreadRead: (userId: string, token: string) =>
    patch<void>(`/messages/${userId}/read`, {}, token),

  deleteThread: (userId: string, token: string) =>
    del<void>(`/messages/${userId}`, token),

  // ── Search ───────────────────────────────────────────────────────────────────

  search: (q: string, token: string, type: 'all' | 'posts' | 'members' = 'all') => {
    const qs = new URLSearchParams({ q, type });
    return get<SearchResult>(`/search?${qs}`, token);
  },

  // ── OG Scraper ───────────────────────────────────────────────────────────────

  scrapeOg: (url: string, token: string) => {
    const qs = new URLSearchParams({ url });
    return get<OgData>(`/og?${qs}`, token);
  },

  // ── Notifications ────────────────────────────────────────────────────────────

  getNotifications: (token: string) =>
    get<Notification[]>('/notifications/my', token),

  markNotificationsRead: (token: string) =>
    patch<{ ok: boolean }>('/notifications/mark-read', {}, token),

  getNotificationPreferences: (token: string) =>
    get<Record<string, boolean>>('/notifications/preferences', token),

  updateNotificationPreferences: (prefs: Record<string, boolean>, token: string) =>
    patch<void>('/notifications/preferences', prefs, token),

  getMyStats: (token: string) =>
    get<MyActivityStats>('/users/me/stats', token),

  getCommunityStats: () => {
    const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
    return fetch(`${API_URL}/api/v1/stats`)
      .then((r) => r.ok ? r.json() as Promise<CommunityStats> : Promise.reject(new Error('stats failed')))
      .catch(() => null as CommunityStats | null);
  },

  // ── Events ───────────────────────────────────────────────────────────────────

  listEvents: (type?: string) => {
    const qs = type ? `?type=${encodeURIComponent(type)}` : '';
    const url = `${API_URL}/api/v1/cms/events${qs}`;
    return fetch(url).then(async (r) => {
      if (!r.ok) throw new Error('Etkinlikler yüklenemedi');
      return r.json() as Promise<CmsEvent[]>;
    });
  },

  rsvpEvent: (eventId: string, token: string) =>
    post<{ rsvp: boolean }>(`/cms/events/${eventId}/rsvp`, {}, token),

  cancelRsvpEvent: (eventId: string, token: string) =>
    del<{ rsvp: boolean }>(`/cms/events/${eventId}/rsvp`, token),

  getMyRsvps: (token: string) =>
    get<string[]>('/cms/events-rsvp/mine', token),

  toggleSessionFavorite: (sessionId: string, token: string) =>
    post<{ favorited: boolean }>(`/cms/sessions/${sessionId}/favorite`, {}, token),

  getMySessionFavorites: (eventId: string, token: string) =>
    get<string[]>(`/cms/events/${eventId}/my-favorites`, token),

  submitContentRequest: (
    dto: { email: string; displayName: string; source: string; type: string; title: string; description: string; contactInfo?: string },
    token: string,
  ) => post<{ id: string }>('/marketplace/content-requests', dto, token),

  getEventRegistrationQuestions: (eventId: string) => {
    const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
    return fetch(`${API_URL}/api/v1/cms/events/${eventId}/registration-questions`)
      .then(r => r.ok ? r.json() as Promise<Array<{ id: string; question: string; questionType: string; options: string[] | null; isRequired: boolean }>> : [])
      .catch(() => [] as Array<{ id: string; question: string; questionType: string; options: string[] | null; isRequired: boolean }>);
  },

  submitRegistrationAnswers: (attendanceId: string, answers: Array<{ questionId: string; answer: string }>, token: string) =>
    post<void>(`/cms/attendances/${attendanceId}/answers`, { answers }, token),

  // ── Community ─────────────────────────────────────────────────────────────

  submitCommunityFeedback: (
    data: { email?: string; subject: string; body: string; type: 'talep' | 'gorus'; urgency?: string; subCategory?: string; expectation?: string; userType?: string; attachmentUrls?: string[] },
    token?: string,
  ) => {
    const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
    return fetch(`${API_URL}/api/v1/community/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...data, source: 'mutfak' }),
    }).then(async (r) => {
      if (!r.ok) throw new Error('Gönderim başarısız oldu.');
      return r.json() as Promise<{ id: string; ticketNo: number }>;
    });
  },

  getMyTickets: (token: string) => {
    const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
    return fetch(`${API_URL}/api/v1/community/my-tickets`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (r) => {
      if (!r.ok) throw new Error('Talepler alınamadı.');
      return r.json() as Promise<Array<{
        id: string; ticketNo: number; subject: string; type: string;
        status: string; adminReply: string | null; createdAt: string; resolvedAt: string | null;
      }>>;
    });
  },

  // ── Student Club (rep portal) ─────────────────────────────────────────────

  getMyClub: (token: string) =>
    get<{
      id: string; name: string; slug: string; university: string; city: string;
      contactName: string; contactEmail: string; contactPhone: string | null;
      website: string | null; memberCount: number; description: string | null;
      activities: string | null; status: string;
    } | null>('/student-clubs/mine', token),

  updateMyClub: (token: string, data: {
    description?: string; activities?: string; contactPhone?: string;
    website?: string; memberCount?: number;
  }) =>
    patch<{ id: string }>('/student-clubs/mine', data, token),

  applyClub: (data: {
    name: string; slug: string; university: string; city: string;
    contactName: string; contactEmail: string; contactPhone?: string;
    website?: string; description?: string; activities?: string;
  }) => {
    const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
    return fetch(`${API_URL}/api/v1/student-clubs/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(async r => {
      if (!r.ok) { const e = await r.json().catch(() => ({})) as { message?: string }; throw new Error(e.message ?? 'Hata'); }
      return r.json() as Promise<{ id: string }>;
    });
  },

  listQa: (params?: { category?: string }) =>
    apiFetch<QaItem[]>(`/qa/mutfak${params?.category ? `?category=${params.category}` : ''}`, {}),

  submitQaQuestion: (
    token: string,
    dto: { questionText: string; category: string; displayName?: string; showFullName?: boolean },
  ) =>
    apiFetch<{ id: string; submitted: boolean }>('/qa/me', {
      method: 'POST',
      token,
      body: JSON.stringify(dto),
    }),

  submitQaAnswer: (
    token: string,
    questionId: string,
    dto: { body: string; showFullName?: boolean },
  ) =>
    apiFetch<{ id: string; submitted: boolean }>(`/qa/${questionId}/answers/me`, {
      method: 'POST',
      token,
      body: JSON.stringify(dto),
    }),

  submitMentorApplication: (
    data: { email: string; displayName: string; type: 'mentor' | 'mentee'; expertise?: string; goals?: string; preferredFormat?: string },
    token?: string,
  ) => {
    const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
    return fetch(`${API_URL}/api/v1/community/mentor-apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...data, source: 'mutfak' }),
    }).then(async (r) => {
      if (!r.ok) throw new Error('Başvuru gönderilemedi.');
      return r.json() as Promise<{ id: string }>;
    });
  },

  // ── Talents ────────────────────────────────────────────────────────────────

  submitTalent: (
    token: string,
    data: { displayName: string; category: string; title: string; description?: string; mediaUrl?: string },
  ) =>
    apiFetch<{ id: string }>('/cms/talents', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  // ── Store: Satıcı başvurusu ────────────────────────────────────────────────

  applyAsSeller: (
    token: string,
    dto: {
      applicantName: string; email: string; phone?: string;
      businessType: 'bireysel' | 'kurumsal'; businessName?: string;
      taxNumber?: string; iban?: string; productDescription: string;
    },
  ) =>
    apiFetch<{ id: string }>('/store/sellers/apply/member', {
      method: 'POST',
      token,
      body: JSON.stringify({ ...dto, appliedFrom: 'mutfak' }),
    }),

  // ── Store: Satıcı profili + siparişleri ───────────────────────────────────

  getMySellerProfile: (token: string) =>
    apiFetch<StoreSeller | null>('/store/seller/me', { method: 'GET', token }),

  getMySellerProducts: (token: string) =>
    apiFetch<{ data: StoreProduct[] }>('/store/seller/me/products', { method: 'GET', token }),

  getMySellerOrders: (token: string) =>
    apiFetch<{ data: StoreOrderItem[] }>('/store/seller/me/orders', { method: 'GET', token }),

  getMySellerBalance: (token: string) =>
    apiFetch<{ held: number; released: number; totalPaid: number }>('/store/seller/me/balance', { method: 'GET', token }),

  updateMyItemShipping: (
    token: string,
    itemId: string,
    dto: { shippingStatus: 'preparing' | 'shipped' | 'delivered'; trackingNumber?: string; trackingCompany?: string },
  ) =>
    apiFetch<{ id: string }>(`/store/seller/me/orders/items/${itemId}/shipping`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(dto),
    }),

  // ── Analytics Events ───────────────────────────────────────────────────────

  trackEvent: (
    token: string,
    eventType: string,
    metadata?: Record<string, unknown>,
  ) =>
    apiFetch<void>('/users/me/events', {
      method: 'POST',
      token,
      body: JSON.stringify({ eventType, metadata }),
    }).catch(() => undefined), // fire-and-forget, never throw

  searchLibraryTerms: (q: string) =>
    apiFetch<{ id: string; slug: string | null; term: string; definition: string }[]>(
      `/library/terms?q=${encodeURIComponent(q)}&limit=8`,
      { method: 'GET' },
    ).catch(() => []),

  searchLibraryGuides: (q: string) =>
    apiFetch<{ id: string; slug: string; title: string; summary: string }[]>(
      `/library/guides?q=${encodeURIComponent(q)}&limit=8`,
      { method: 'GET' },
    ).catch(() => []),

  submitLibraryContribution: (
    token: string,
    data: { contentType: string; contentId?: string; body: string },
  ) =>
    apiFetch<{ submitted: boolean }>('/library/suggestions', {
      method: 'POST', token, body: JSON.stringify(data),
    }),

  getMyLibrarySubmissions: (token: string) =>
    apiFetch<{
      id: string; content_type: string; content_id: string | null;
      body: string; status: string; admin_note: string | null; created_at: string;
    }[]>('/library/me/suggestions', { method: 'GET', token }),

  getLibraryPrefs: (token: string) =>
    apiFetch<{
      fieldPref: string | null;
      bookmarks: {
        terms: Array<{ id: string; title: string; slug: string }>;
        guides: Array<{ id: string; title: string; slug: string }>;
        regulations: Array<{ id: string; title: string; slug: string }>;
      };
    }>('/library/me/prefs', { method: 'GET', token }),

  getLibraryReadingList: (token: string) =>
    apiFetch<Array<{
      id: string; content_type: string; content_id: string; created_at: string;
    }>>('/library/me/reading-list', { method: 'GET', token }),
};

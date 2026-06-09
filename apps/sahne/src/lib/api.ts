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
  maxCapacity: number | null;
  attendeeCount: number;
  isCancelled: boolean;
  isPublished: boolean;
  price: number;
  paymentUrl: string | null;
  mutfakPostId: string | null;
  createdAt: string;
}

export interface EventDiscussion {
  post: {
    id: string;
    title: string | null;
    body: string;
    createdAt: string;
    authorName: string | null;
    authorAvatar: string | null;
  };
  commentCount: number;
  comments: Array<{
    id: string;
    body: string;
    createdAt: string;
    authorName: string | null;
    authorAvatar: string | null;
  }>;
}

export interface EventSpeaker {
  id: string;
  name: string;
  title?: string | null;
  affiliation?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  linkedinUrl?: string | null;
  sortOrder: number;
}

export interface EventSession {
  id: string;
  title: string;
  description?: string | null;
  sessionType: string;
  hall?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  sortOrder: number;
  speakerId?: string | null;
  speakerName?: string | null;
  speakerTitle?: string | null;
  speakerAffiliation?: string | null;
  speakerAvatarUrl?: string | null;
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
  viewCount: number;
  linkedinViewCount: number;
  linkedinClickCount: number;
  linkedinLikeCount: number;
  linkedinCommentCount: number;
  linkedinPostUrl: string | null;
  type: 'sahne' | 'linkedin';
  authorName: string | null;
  authorInitials: string | null;
  authorAvatarColor: string | null;
  authorTag: string | null;
  authorTagColor: string | null;
  accentGradient: string | null;
  linkedinUrl: string | null;
  hashtags: string[] | null;
  externalLinks: Array<{ label: string; href: string }> | null;
  imageKeys: string[] | null;
  // Künye alanları
  problem: string | null;
  solution: string | null;
  features: string[] | null;
  gains: { time?: boolean; cost?: boolean; quality?: boolean; safety?: boolean } | null;
  innovationScore: { local?: boolean; national?: boolean; sector?: boolean; academic?: boolean } | null;
  maturityLevel: string | null;
  impactDomains: string[] | null;
  targetAudience: string[] | null;
  projectType: string[] | null;
  editorialNote: string | null;
  editorialScore: number | null;
  editorialStrengths: string[] | null;
  // Haritakademi
  university: string | null;
  graduationType: string | null;
  graduationYear: number | null;
  projectCategory: string | null;
  awardCohortMonth: number | null;
  awardRank: number | null;
  finalist: boolean;
  winner: boolean;
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

async function jobListingByIdGet(id: string): Promise<JobListing | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/marketplace/job-listings/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<JobListing>;
  } catch {
    return null;
  }
}

async function jobListingsGet(type?: string): Promise<JobListing[]> {
  try {
    const qs = type ? `?type=${encodeURIComponent(type)}&limit=200` : '?limit=200';
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
  instructorBio: string | null;
  instructorAvatarKey: string | null;
  format: string | null;
  level: string | null;
  duration: string | null;
  price: string | null;
  memberPrice: string | null;
  accessLevel: string;
  description: string | null;
  body: string | null;
  coverImageKey: string | null;
  tags: string[];
  prerequisites: string[];
  certificateThreshold: number | null;
  enrollmentCount: number;
  viewCount: number;
  isPublished: boolean;
  registrationUrl: string | null;
  startDate: string | null;
  mutfakPostId: string | null;
  createdAt: string;
  // computed
  lessonCount?: number;
}

export interface TrainingSection {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  lessons: TrainingLesson[];
}

export interface TrainingLesson {
  id: string;
  slug: string;
  title: string;
  contentType: string;
  durationMinutes: number | null;
  isFree: boolean;
  sortOrder: number;
}

export interface TrainingDetail extends Training {
  sections: TrainingSection[];
  totalLessons: number;
  totalMinutes: number;
  avgRating: number | null;
  reviewCount: number;
}

export interface CourseReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  displayName: string | null;
  avatarUrl: string | null;
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

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  completedCount: number;
  totalEnrollments: number;
  avgProgress: number;
}

export interface CourseBadge {
  code: string;
  name: string;
  emoji: string;
  description: string;
  awardedAt: string;
}

async function trainingsGet(): Promise<Training[]> {
  const result = await cmsGet<Training[]>('/trainings');
  return result ?? [];
}

async function trainingLeaderboardGet(limit = 10): Promise<LeaderboardEntry[]> {
  const result = await cmsGet<LeaderboardEntry[]>(`/trainings/leaderboard?limit=${limit}`);
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

export interface CmsTalent {
  id: string;
  userId: string | null;
  displayName: string;
  category: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  isPublished: boolean;
  createdAt: string;
}

async function talentsGet(category?: string): Promise<CmsTalent[]> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  const result = await cmsGet<CmsTalent[]>(`/talents${qs}`);
  return result ?? [];
}

export interface HaberitaWidgetFeatured {
  title?: string;
  excerpt?: string;
  imageUrl?: string;
  url?: string;
  category?: string;
  excerptMaxChars?: number;
}

export interface HaberitaWidget {
  featured?: HaberitaWidgetFeatured;
  sideLinks?: Array<{ title?: string; url?: string }>;
}

export const cms = {
  events: (type?: string) =>
    cmsGet<CmsEvent[]>(`/events${type ? `?type=${type}` : ''}`),
  event: (slug: string) => cmsGet<CmsEvent>(`/events/${slug}`),
  eventDiscussion: (postId: string) => cmsGet<EventDiscussion>(`/discussions/${postId}`),
  trainingDetail: (slug: string) => cmsGet<TrainingDetail>(`/trainings/${slug}`),
  trainingReviews: (slug: string) => cmsGet<CourseReview[]>(`/trainings/${slug}/reviews`),
  eventSponsors: (id: string) => cmsGet<Array<{ id: string; companyName: string; logoKey: string | null; websiteUrl: string | null; tier: string; description: string | null }>>(`/events/${id}/sponsors`),
  eventSpeakers: (id: string) => cmsGet<EventSpeaker[]>(`/events/${id}/speakers`),
  eventSessions: (id: string) => cmsGet<EventSession[]>(`/events/${id}/sessions`),
  eventRegistrationQuestions: (id: string) => cmsGet<Array<{ id: string; question: string; questionType: string; options: string[] | null; isRequired: boolean }>>(`/events/${id}/registration-questions`),
  projects: (opts?: { status?: string; type?: string }) => {
    const params = new URLSearchParams();
    if (opts?.status) params.set('status', opts.status);
    if (opts?.type) params.set('type', opts.type);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return cmsGet<CmsProject[]>(`/projects${qs}`);
  },
  project: (slug: string) => cmsGet<CmsProject>(`/projects/${slug}`),
  search: cmsSearch,
  memberCities: memberCitiesGet,
  studentClubs: studentClubsGet,
  jobListings: jobListingsGet,
  jobListingById: jobListingByIdGet,
  trainings: trainingsGet,
  trainingLeaderboard: trainingLeaderboardGet,
  examResources: examResourcesGet,
  talents: talentsGet,
};

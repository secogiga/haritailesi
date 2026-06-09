import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  real,
  index,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core';
import { projectStatusEnum } from './enums';
import { users } from './users';

// ─── Site Settings ─────────────────────────────────────────────────────────────
// Key-value store for CMS-managed site configuration (JSON values as text)

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull().default('{}'),
  label: text('label'),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Pages ─────────────────────────────────────────────────────────────────────
// Slug-addressed static content: hakkimizda, iletisim, mg-program, mg-sartlar…

export const pages = pgTable(
  'pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    body: text('body'),
    metaDescription: text('meta_description'),
    isPublished: boolean('is_published').notNull().default(false),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('pages_slug_idx').on(t.slug)],
);

// ─── Board Members ─────────────────────────────────────────────────────────────

export const boardMembers = pgTable('board_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  title: text('title').notNull(),
  bio: text('bio'),
  photoKey: text('photo_key'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Events ────────────────────────────────────────────────────────────────────

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    type: text('type').notNull().default('diger'),
    dateStart: timestamp('date_start', { withTimezone: true }).notNull(),
    dateEnd: timestamp('date_end', { withTimezone: true }),
    location: text('location'),
    description: text('description'),
    body: text('body'),
    registrationUrl: text('registration_url'),
    meetingUrl: text('meeting_url'),
    maxCapacity: integer('max_capacity'),
    isCancelled: boolean('is_cancelled').notNull().default(false),
    viewCount: integer('view_count').notNull().default(0),
    coverImageKey: text('cover_image_key'),
    isPublished: boolean('is_published').notNull().default(false),
    source: text('source'),
    // Ücretli bilet (kuruş cinsinden; 0 = ücretsiz)
    price: integer('price').notNull().default(0),
    paymentUrl: text('payment_url'),
    // Mutfak tartışma odası (bağlı post ID)
    mutfakPostId: uuid('mutfak_post_id'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('events_slug_idx').on(t.slug),
    index('events_date_start_idx').on(t.dateStart),
    index('events_type_idx').on(t.type),
  ],
);

// ─── Event Attendances ─────────────────────────────────────────────────────────
// Tracks which authenticated users clicked "join" on an online event.
// Populated when Mutfak has an events page; ready for gamification now.

export const eventAttendances = pgTable(
  'event_attendances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    ticketCode: text('ticket_code').unique(),      // QR kodu için benzersiz bilet kodu
    ticketTier: text('ticket_tier').notNull().default('standard'), // standard | vip
    firstJoinedAt: timestamp('first_joined_at', { withTimezone: true }).notNull().defaultNow(),
    joinCount: integer('join_count').notNull().default(1),
    // Kapı check-in
    checkedIn: boolean('checked_in').notNull().default(false),
    checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('event_attendances_event_user_idx').on(t.eventId, t.userId)],
);

// ─── Event Sponsors ────────────────────────────────────────────────────────────

export const eventSponsors = pgTable(
  'event_sponsors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    companyName: text('company_name').notNull(),
    logoKey: text('logo_key'),
    websiteUrl: text('website_url'),
    tier: text('tier').notNull().default('bronz'), // 'altin' | 'gumus' | 'bronz' | 'paydas'
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('event_sponsors_event_idx').on(t.eventId),
    index('event_sponsors_tier_idx').on(t.eventId, t.tier),
  ],
);

// ─── Event Public Registrations (üyeliksiz kayıt) ─────────────────────────────

export const eventPublicRegistrations = pgTable(
  'event_public_registrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    phone: text('phone'),
    whatsappConsent: boolean('whatsapp_consent').notNull().default(false),
    ticketCode: text('ticket_code').notNull().unique(),
    ticketTier: text('ticket_tier').notNull().default('standard'), // standard | vip
    answers: jsonb('answers').$type<Record<string, string>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    // Kapı check-in
    checkedIn: boolean('checked_in').notNull().default(false),
    checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
  },
  (t) => [
    index('event_pub_reg_event_idx').on(t.eventId),
    index('event_pub_reg_email_idx').on(t.eventId, t.email),
  ],
);

// ─── Event Waitlist ───────────────────────────────────────────────────────────
// Kapasite dolu olduğunda bekleme listesi. Hem üyeler hem de anonim kullanıcılar.

export const eventWaitlist = pgTable(
  'event_waitlist',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    email: text('email'),
    displayName: text('display_name'),
    phone: text('phone'),
    notifiedAt: timestamp('notified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('event_waitlist_event_idx').on(t.eventId),
    index('event_waitlist_event_user_idx').on(t.eventId, t.userId),
  ],
);

// ─── Event Session Favorites (Wishlist) ───────────────────────────────────────

export const eventSessionFavorites = pgTable(
  'event_session_favorites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id').notNull().references(() => eventSessions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('esf_session_user_idx').on(t.sessionId, t.userId),
    index('esf_session_idx').on(t.sessionId),
    index('esf_user_idx').on(t.userId),
  ],
);

// ─── Event Speakers ────────────────────────────────────────────────────────────

export const eventSpeakers = pgTable(
  'event_speakers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    title: text('title'),           // "Prof. Dr.", "Ar. Gör." vb.
    affiliation: text('affiliation'), // "ODTÜ", "Karadeniz Teknik Ün." vb.
    bio: text('bio'),
    avatarUrl: text('avatar_url'),
    linkedinUrl: text('linkedin_url'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('event_speakers_event_idx').on(t.eventId)],
);

// ─── Event Sessions (Gündem) ───────────────────────────────────────────────────

export const eventSessions = pgTable(
  'event_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    speakerId: uuid('speaker_id').references(() => eventSpeakers.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description'),
    sessionType: text('session_type').notNull().default('talk'), // talk | panel | break | workshop | keynote
    status: text('status').notNull().default('confirmed'),       // proposal | confirmed | announced | published | refused
    hall: text('hall'),             // "Ana Salon", "Salon A" vb.
    startTime: timestamp('start_time', { withTimezone: true }),
    endTime: timestamp('end_time', { withTimezone: true }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('event_sessions_event_idx').on(t.eventId)],
);

// ─── Event Registration Questions ─────────────────────────────────────────────

export const eventRegistrationQuestions = pgTable(
  'event_registration_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    questionType: text('question_type').notNull().default('text'), // text | select | checkbox
    options: jsonb('options').$type<string[]>(),                   // select tipi için seçenekler
    isRequired: boolean('is_required').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('event_reg_questions_event_idx').on(t.eventId)],
);

// ─── Event Registration Answers ────────────────────────────────────────────────

export const eventRegistrationAnswers = pgTable(
  'event_registration_answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    attendanceId: uuid('attendance_id').notNull().references(() => eventAttendances.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id').notNull().references(() => eventRegistrationQuestions.id, { onDelete: 'cascade' }),
    answer: text('answer').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
);

// ─── Projects ──────────────────────────────────────────────────────────────────

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    summary: text('summary'),
    body: text('body'),
    status: projectStatusEnum('status').notNull().default('active'),
    coverImageKey: text('cover_image_key'),
    viewCount: integer('view_count').notNull().default(0),
    linkedinViewCount: integer('linkedin_view_count').notNull().default(0),
    linkedinClickCount: integer('linkedin_click_count').notNull().default(0),
    linkedinLikeCount: integer('linkedin_like_count').notNull().default(0),
    linkedinCommentCount: integer('linkedin_comment_count').notNull().default(0),
    linkedinPostUrl: text('linkedin_post_url'),
    isPublished: boolean('is_published').notNull().default(false),
    // Proje tipi: 'sahne' (detaylı içerik) | 'linkedin' (dış link kartı)
    type: text('type').notNull().default('sahne'),
    // Proje sahibi bilgileri
    authorName: text('author_name'),
    authorInitials: text('author_initials'),
    authorAvatarColor: text('author_avatar_color'),
    authorTag: text('author_tag'),
    authorTagColor: text('author_tag_color'),
    accentGradient: text('accent_gradient'),
    // LinkedIn tipi için
    linkedinUrl: text('linkedin_url'),
    // Sahne tipi için ek alanlar
    hashtags: text('hashtags').array(),
    externalLinks: jsonb('external_links').$type<Array<{ label: string; href: string }>>(),
    imageKeys: text('image_keys').array(),
    // Proje kartı yapısal alanları
    problem: text('problem'),
    solution: text('solution'),
    features: text('features').array(),
    gains: jsonb('gains').$type<{ time?: boolean; cost?: boolean; quality?: boolean; safety?: boolean }>(),
    innovationScore: jsonb('innovation_score').$type<{ local?: boolean; national?: boolean; sector?: boolean; academic?: boolean }>(),
    maturityLevel: text('maturity_level'),
    impactDomains: text('impact_domains').array(),
    targetAudience: text('target_audience').array(),
    projectType: text('project_type').array(),
    editorialNote: text('editorial_note'),
    editorialScore: real('editorial_score'),
    editorialStrengths: jsonb('editorial_strengths').$type<string[]>(),
    // Haritakademi künye alanları
    university: text('university'),
    graduationType: text('graduation_type'),
    graduationYear: integer('graduation_year'),
    projectCategory: text('project_category'),
    // Aylık ödül alanları
    awardCohortMonth: integer('award_cohort_month'),
    awardRank: integer('award_rank'),
    finalist: boolean('finalist').notNull().default(false),
    winner: boolean('winner').notNull().default(false),
    awardCommunityVotes: integer('award_community_votes'),
    awardFinalScore: real('award_final_score'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('projects_slug_idx').on(t.slug),
    index('projects_status_idx').on(t.status),
    index('projects_type_idx').on(t.type),
    index('projects_award_idx').on(t.awardCohortMonth, t.awardRank),
    index('projects_university_idx').on(t.university),
    index('projects_category_idx').on(t.projectCategory),
  ],
);

// ─── Talents ───────────────────────────────────────────────────────────────────

export const talents = pgTable(
  'talents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    displayName: text('display_name').notNull(),
    category: text('category').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    mediaUrl: text('media_url'),
    // pending | approved | rejected
    status: text('status').notNull().default('pending'),
    adminNotes: text('admin_notes'),
    isPublished: boolean('is_published').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('talents_status_idx').on(t.status),
    index('talents_category_idx').on(t.category),
    index('talents_user_id_idx').on(t.userId),
  ],
);

// ─── Aylık Bültenler ───────────────────────────────────────────────────────────

export const newsletters = pgTable(
  'newsletters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    month: text('month').notNull(), // "2026-06"
    subject: text('subject').notNull(),
    htmlBody: text('html_body'),
    selectedContent: jsonb('selected_content').$type<{
      events: string[];
      trainings: string[];
      intro: string;
      highlight: string;
    }>().default({ events: [], trainings: [], intro: '', highlight: '' }),
    channels: jsonb('channels').$type<string[]>().default([]),
    whatsappTemplateName: text('whatsapp_template_name'),
    whatsappLanguage: text('whatsapp_language').default('tr'),
    brevioCampaignId: integer('brevo_campaign_id'),
    status: text('status').notNull().default('draft'), // draft | scheduled | sending | sent | failed
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    emailCount: integer('email_count'),
    whatsappCount: integer('whatsapp_count'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('newsletters_month_idx').on(t.month),
    index('newsletters_status_idx').on(t.status),
  ],
);

// ─── Project Likes ─────────────────────────────────────────────────────────────

export const projectLikes = pgTable(
  'project_likes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('project_likes_project_user_idx').on(t.projectId, t.userId),
    index('project_likes_project_idx').on(t.projectId),
    index('project_likes_user_idx').on(t.userId),
  ],
);

// ─── Project Favorites ─────────────────────────────────────────────────────────

export const projectFavorites = pgTable(
  'project_favorites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('project_favorites_project_user_idx').on(t.projectId, t.userId),
    index('project_favorites_project_idx').on(t.projectId),
    index('project_favorites_user_idx').on(t.userId),
  ],
);

// ─── Project Comments ──────────────────────────────────────────────────────────

export const projectComments = pgTable(
  'project_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull(),
    body: text('body').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    verificationToken: text('verification_token').notNull().unique(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('project_comments_project_idx').on(t.projectId),
    index('project_comments_email_idx').on(t.email),
    index('project_comments_token_idx').on(t.verificationToken),
    index('project_comments_verified_idx').on(t.projectId, t.emailVerified),
  ],
);


"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectComments = exports.projectFavorites = exports.projectLikes = exports.newsletters = exports.talents = exports.projects = exports.eventRegistrationAnswers = exports.eventRegistrationQuestions = exports.eventSessions = exports.eventSpeakers = exports.eventSessionFavorites = exports.eventWaitlist = exports.eventPublicRegistrations = exports.eventSponsors = exports.eventAttendances = exports.events = exports.boardMembers = exports.pages = exports.siteSettings = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var enums_1 = require("./enums");
var users_1 = require("./users");
// ─── Site Settings ─────────────────────────────────────────────────────────────
// Key-value store for CMS-managed site configuration (JSON values as text)
exports.siteSettings = (0, pg_core_1.pgTable)('site_settings', {
    key: (0, pg_core_1.text)('key').primaryKey(),
    value: (0, pg_core_1.text)('value').notNull().default('{}'),
    label: (0, pg_core_1.text)('label'),
    updatedBy: (0, pg_core_1.uuid)('updated_by').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
// ─── Pages ─────────────────────────────────────────────────────────────────────
// Slug-addressed static content: hakkimizda, iletisim, mg-program, mg-sartlar…
exports.pages = (0, pg_core_1.pgTable)('pages', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    slug: (0, pg_core_1.text)('slug').notNull().unique(),
    title: (0, pg_core_1.text)('title').notNull(),
    body: (0, pg_core_1.text)('body'),
    metaDescription: (0, pg_core_1.text)('meta_description'),
    isPublished: (0, pg_core_1.boolean)('is_published').notNull().default(false),
    updatedBy: (0, pg_core_1.uuid)('updated_by').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [(0, pg_core_1.index)('pages_slug_idx').on(t.slug)]; });
// ─── Board Members ─────────────────────────────────────────────────────────────
exports.boardMembers = (0, pg_core_1.pgTable)('board_members', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)('name').notNull(),
    title: (0, pg_core_1.text)('title').notNull(),
    bio: (0, pg_core_1.text)('bio'),
    photoKey: (0, pg_core_1.text)('photo_key'),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
// ─── Events ────────────────────────────────────────────────────────────────────
exports.events = (0, pg_core_1.pgTable)('events', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    slug: (0, pg_core_1.text)('slug').notNull().unique(),
    title: (0, pg_core_1.text)('title').notNull(),
    type: (0, pg_core_1.text)('type').notNull().default('diger'),
    dateStart: (0, pg_core_1.timestamp)('date_start', { withTimezone: true }).notNull(),
    dateEnd: (0, pg_core_1.timestamp)('date_end', { withTimezone: true }),
    location: (0, pg_core_1.text)('location'),
    description: (0, pg_core_1.text)('description'),
    body: (0, pg_core_1.text)('body'),
    registrationUrl: (0, pg_core_1.text)('registration_url'),
    meetingUrl: (0, pg_core_1.text)('meeting_url'),
    maxCapacity: (0, pg_core_1.integer)('max_capacity'),
    isCancelled: (0, pg_core_1.boolean)('is_cancelled').notNull().default(false),
    viewCount: (0, pg_core_1.integer)('view_count').notNull().default(0),
    coverImageKey: (0, pg_core_1.text)('cover_image_key'),
    isPublished: (0, pg_core_1.boolean)('is_published').notNull().default(false),
    source: (0, pg_core_1.text)('source'),
    // Ücretli bilet (kuruş cinsinden; 0 = ücretsiz)
    price: (0, pg_core_1.integer)('price').notNull().default(0),
    paymentUrl: (0, pg_core_1.text)('payment_url'),
    // Mutfak tartışma odası (bağlı post ID)
    mutfakPostId: (0, pg_core_1.uuid)('mutfak_post_id'),
    createdBy: (0, pg_core_1.uuid)('created_by').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('events_slug_idx').on(t.slug),
    (0, pg_core_1.index)('events_date_start_idx').on(t.dateStart),
    (0, pg_core_1.index)('events_type_idx').on(t.type),
]; });
// ─── Event Attendances ─────────────────────────────────────────────────────────
// Tracks which authenticated users clicked "join" on an online event.
// Populated when Mutfak has an events page; ready for gamification now.
exports.eventAttendances = (0, pg_core_1.pgTable)('event_attendances', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    eventId: (0, pg_core_1.uuid)('event_id').notNull().references(function () { return exports.events.id; }, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    ticketCode: (0, pg_core_1.text)('ticket_code').unique(), // QR kodu için benzersiz bilet kodu
    ticketTier: (0, pg_core_1.text)('ticket_tier').notNull().default('standard'), // standard | vip
    firstJoinedAt: (0, pg_core_1.timestamp)('first_joined_at', { withTimezone: true }).notNull().defaultNow(),
    joinCount: (0, pg_core_1.integer)('join_count').notNull().default(1),
    // Kapı check-in
    checkedIn: (0, pg_core_1.boolean)('checked_in').notNull().default(false),
    checkedInAt: (0, pg_core_1.timestamp)('checked_in_at', { withTimezone: true }),
}, function (t) { return [(0, pg_core_1.uniqueIndex)('event_attendances_event_user_idx').on(t.eventId, t.userId)]; });
// ─── Event Sponsors ────────────────────────────────────────────────────────────
exports.eventSponsors = (0, pg_core_1.pgTable)('event_sponsors', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    eventId: (0, pg_core_1.uuid)('event_id').notNull().references(function () { return exports.events.id; }, { onDelete: 'cascade' }),
    companyName: (0, pg_core_1.text)('company_name').notNull(),
    logoKey: (0, pg_core_1.text)('logo_key'),
    websiteUrl: (0, pg_core_1.text)('website_url'),
    tier: (0, pg_core_1.text)('tier').notNull().default('bronz'), // 'altin' | 'gumus' | 'bronz' | 'paydas'
    description: (0, pg_core_1.text)('description'),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('event_sponsors_event_idx').on(t.eventId),
    (0, pg_core_1.index)('event_sponsors_tier_idx').on(t.eventId, t.tier),
]; });
// ─── Event Public Registrations (üyeliksiz kayıt) ─────────────────────────────
exports.eventPublicRegistrations = (0, pg_core_1.pgTable)('event_public_registrations', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    eventId: (0, pg_core_1.uuid)('event_id').notNull().references(function () { return exports.events.id; }, { onDelete: 'cascade' }),
    email: (0, pg_core_1.text)('email').notNull(),
    displayName: (0, pg_core_1.text)('display_name').notNull(),
    phone: (0, pg_core_1.text)('phone'),
    whatsappConsent: (0, pg_core_1.boolean)('whatsapp_consent').notNull().default(false),
    ticketCode: (0, pg_core_1.text)('ticket_code').notNull().unique(),
    ticketTier: (0, pg_core_1.text)('ticket_tier').notNull().default('standard'), // standard | vip
    answers: (0, pg_core_1.jsonb)('answers').$type(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    // Kapı check-in
    checkedIn: (0, pg_core_1.boolean)('checked_in').notNull().default(false),
    checkedInAt: (0, pg_core_1.timestamp)('checked_in_at', { withTimezone: true }),
}, function (t) { return [
    (0, pg_core_1.index)('event_pub_reg_event_idx').on(t.eventId),
    (0, pg_core_1.index)('event_pub_reg_email_idx').on(t.eventId, t.email),
]; });
// ─── Event Waitlist ───────────────────────────────────────────────────────────
// Kapasite dolu olduğunda bekleme listesi. Hem üyeler hem de anonim kullanıcılar.
exports.eventWaitlist = (0, pg_core_1.pgTable)('event_waitlist', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    eventId: (0, pg_core_1.uuid)('event_id').notNull().references(function () { return exports.events.id; }, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    email: (0, pg_core_1.text)('email'),
    displayName: (0, pg_core_1.text)('display_name'),
    phone: (0, pg_core_1.text)('phone'),
    notifiedAt: (0, pg_core_1.timestamp)('notified_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('event_waitlist_event_idx').on(t.eventId),
    (0, pg_core_1.index)('event_waitlist_event_user_idx').on(t.eventId, t.userId),
]; });
// ─── Event Session Favorites (Wishlist) ───────────────────────────────────────
exports.eventSessionFavorites = (0, pg_core_1.pgTable)('event_session_favorites', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    sessionId: (0, pg_core_1.uuid)('session_id').notNull().references(function () { return exports.eventSessions.id; }, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('esf_session_user_idx').on(t.sessionId, t.userId),
    (0, pg_core_1.index)('esf_session_idx').on(t.sessionId),
    (0, pg_core_1.index)('esf_user_idx').on(t.userId),
]; });
// ─── Event Speakers ────────────────────────────────────────────────────────────
exports.eventSpeakers = (0, pg_core_1.pgTable)('event_speakers', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    eventId: (0, pg_core_1.uuid)('event_id').notNull().references(function () { return exports.events.id; }, { onDelete: 'cascade' }),
    name: (0, pg_core_1.text)('name').notNull(),
    title: (0, pg_core_1.text)('title'), // "Prof. Dr.", "Ar. Gör." vb.
    affiliation: (0, pg_core_1.text)('affiliation'), // "ODTÜ", "Karadeniz Teknik Ün." vb.
    bio: (0, pg_core_1.text)('bio'),
    avatarUrl: (0, pg_core_1.text)('avatar_url'),
    linkedinUrl: (0, pg_core_1.text)('linkedin_url'),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [(0, pg_core_1.index)('event_speakers_event_idx').on(t.eventId)]; });
// ─── Event Sessions (Gündem) ───────────────────────────────────────────────────
exports.eventSessions = (0, pg_core_1.pgTable)('event_sessions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    eventId: (0, pg_core_1.uuid)('event_id').notNull().references(function () { return exports.events.id; }, { onDelete: 'cascade' }),
    speakerId: (0, pg_core_1.uuid)('speaker_id').references(function () { return exports.eventSpeakers.id; }, { onDelete: 'set null' }),
    title: (0, pg_core_1.text)('title').notNull(),
    description: (0, pg_core_1.text)('description'),
    sessionType: (0, pg_core_1.text)('session_type').notNull().default('talk'), // talk | panel | break | workshop | keynote
    status: (0, pg_core_1.text)('status').notNull().default('confirmed'), // proposal | confirmed | announced | published | refused
    hall: (0, pg_core_1.text)('hall'), // "Ana Salon", "Salon A" vb.
    startTime: (0, pg_core_1.timestamp)('start_time', { withTimezone: true }),
    endTime: (0, pg_core_1.timestamp)('end_time', { withTimezone: true }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [(0, pg_core_1.index)('event_sessions_event_idx').on(t.eventId)]; });
// ─── Event Registration Questions ─────────────────────────────────────────────
exports.eventRegistrationQuestions = (0, pg_core_1.pgTable)('event_registration_questions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    eventId: (0, pg_core_1.uuid)('event_id').notNull().references(function () { return exports.events.id; }, { onDelete: 'cascade' }),
    question: (0, pg_core_1.text)('question').notNull(),
    questionType: (0, pg_core_1.text)('question_type').notNull().default('text'), // text | select | checkbox
    options: (0, pg_core_1.jsonb)('options').$type(), // select tipi için seçenekler
    isRequired: (0, pg_core_1.boolean)('is_required').notNull().default(false),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
}, function (t) { return [(0, pg_core_1.index)('event_reg_questions_event_idx').on(t.eventId)]; });
// ─── Event Registration Answers ────────────────────────────────────────────────
exports.eventRegistrationAnswers = (0, pg_core_1.pgTable)('event_registration_answers', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    attendanceId: (0, pg_core_1.uuid)('attendance_id').notNull().references(function () { return exports.eventAttendances.id; }, { onDelete: 'cascade' }),
    questionId: (0, pg_core_1.uuid)('question_id').notNull().references(function () { return exports.eventRegistrationQuestions.id; }, { onDelete: 'cascade' }),
    answer: (0, pg_core_1.text)('answer').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
});
// ─── Projects ──────────────────────────────────────────────────────────────────
exports.projects = (0, pg_core_1.pgTable)('projects', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    slug: (0, pg_core_1.text)('slug').notNull().unique(),
    title: (0, pg_core_1.text)('title').notNull(),
    summary: (0, pg_core_1.text)('summary'),
    body: (0, pg_core_1.text)('body'),
    status: (0, enums_1.projectStatusEnum)('status').notNull().default('active'),
    coverImageKey: (0, pg_core_1.text)('cover_image_key'),
    viewCount: (0, pg_core_1.integer)('view_count').notNull().default(0),
    linkedinViewCount: (0, pg_core_1.integer)('linkedin_view_count').notNull().default(0),
    linkedinClickCount: (0, pg_core_1.integer)('linkedin_click_count').notNull().default(0),
    linkedinLikeCount: (0, pg_core_1.integer)('linkedin_like_count').notNull().default(0),
    linkedinCommentCount: (0, pg_core_1.integer)('linkedin_comment_count').notNull().default(0),
    linkedinPostUrl: (0, pg_core_1.text)('linkedin_post_url'),
    isPublished: (0, pg_core_1.boolean)('is_published').notNull().default(false),
    // Proje tipi: 'sahne' (detaylı içerik) | 'linkedin' (dış link kartı)
    type: (0, pg_core_1.text)('type').notNull().default('sahne'),
    // Proje sahibi bilgileri
    authorName: (0, pg_core_1.text)('author_name'),
    authorInitials: (0, pg_core_1.text)('author_initials'),
    authorAvatarColor: (0, pg_core_1.text)('author_avatar_color'),
    authorTag: (0, pg_core_1.text)('author_tag'),
    authorTagColor: (0, pg_core_1.text)('author_tag_color'),
    accentGradient: (0, pg_core_1.text)('accent_gradient'),
    // LinkedIn tipi için
    linkedinUrl: (0, pg_core_1.text)('linkedin_url'),
    // Sahne tipi için ek alanlar
    hashtags: (0, pg_core_1.text)('hashtags').array(),
    externalLinks: (0, pg_core_1.jsonb)('external_links').$type(),
    imageKeys: (0, pg_core_1.text)('image_keys').array(),
    // Proje kartı yapısal alanları
    problem: (0, pg_core_1.text)('problem'),
    solution: (0, pg_core_1.text)('solution'),
    features: (0, pg_core_1.text)('features').array(),
    gains: (0, pg_core_1.jsonb)('gains').$type(),
    innovationScore: (0, pg_core_1.jsonb)('innovation_score').$type(),
    maturityLevel: (0, pg_core_1.text)('maturity_level'),
    impactDomains: (0, pg_core_1.text)('impact_domains').array(),
    targetAudience: (0, pg_core_1.text)('target_audience').array(),
    projectType: (0, pg_core_1.text)('project_type').array(),
    editorialNote: (0, pg_core_1.text)('editorial_note'),
    editorialScore: (0, pg_core_1.real)('editorial_score'),
    editorialStrengths: (0, pg_core_1.jsonb)('editorial_strengths').$type(),
    createdBy: (0, pg_core_1.uuid)('created_by').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('projects_slug_idx').on(t.slug),
    (0, pg_core_1.index)('projects_status_idx').on(t.status),
    (0, pg_core_1.index)('projects_type_idx').on(t.type),
]; });
// ─── Talents ───────────────────────────────────────────────────────────────────
exports.talents = (0, pg_core_1.pgTable)('talents', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    displayName: (0, pg_core_1.text)('display_name').notNull(),
    category: (0, pg_core_1.text)('category').notNull(),
    title: (0, pg_core_1.text)('title').notNull(),
    description: (0, pg_core_1.text)('description'),
    mediaUrl: (0, pg_core_1.text)('media_url'),
    // pending | approved | rejected
    status: (0, pg_core_1.text)('status').notNull().default('pending'),
    adminNotes: (0, pg_core_1.text)('admin_notes'),
    isPublished: (0, pg_core_1.boolean)('is_published').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('talents_status_idx').on(t.status),
    (0, pg_core_1.index)('talents_category_idx').on(t.category),
    (0, pg_core_1.index)('talents_user_id_idx').on(t.userId),
]; });
// ─── Aylık Bültenler ───────────────────────────────────────────────────────────
exports.newsletters = (0, pg_core_1.pgTable)('newsletters', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    title: (0, pg_core_1.text)('title').notNull(),
    month: (0, pg_core_1.text)('month').notNull(), // "2026-06"
    subject: (0, pg_core_1.text)('subject').notNull(),
    htmlBody: (0, pg_core_1.text)('html_body'),
    selectedContent: (0, pg_core_1.jsonb)('selected_content').$type().default({ events: [], trainings: [], intro: '', highlight: '' }),
    channels: (0, pg_core_1.jsonb)('channels').$type().default([]),
    whatsappTemplateName: (0, pg_core_1.text)('whatsapp_template_name'),
    whatsappLanguage: (0, pg_core_1.text)('whatsapp_language').default('tr'),
    brevioCampaignId: (0, pg_core_1.integer)('brevo_campaign_id'),
    status: (0, pg_core_1.text)('status').notNull().default('draft'), // draft | scheduled | sending | sent | failed
    scheduledAt: (0, pg_core_1.timestamp)('scheduled_at', { withTimezone: true }),
    sentAt: (0, pg_core_1.timestamp)('sent_at', { withTimezone: true }),
    emailCount: (0, pg_core_1.integer)('email_count'),
    whatsappCount: (0, pg_core_1.integer)('whatsapp_count'),
    createdBy: (0, pg_core_1.uuid)('created_by').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('newsletters_month_idx').on(t.month),
    (0, pg_core_1.index)('newsletters_status_idx').on(t.status),
]; });
// ─── Project Likes ─────────────────────────────────────────────────────────────
exports.projectLikes = (0, pg_core_1.pgTable)('project_likes', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    projectId: (0, pg_core_1.uuid)('project_id').notNull().references(function () { return exports.projects.id; }, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('project_likes_project_user_idx').on(t.projectId, t.userId),
    (0, pg_core_1.index)('project_likes_project_idx').on(t.projectId),
    (0, pg_core_1.index)('project_likes_user_idx').on(t.userId),
]; });
// ─── Project Favorites ─────────────────────────────────────────────────────────
exports.projectFavorites = (0, pg_core_1.pgTable)('project_favorites', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    projectId: (0, pg_core_1.uuid)('project_id').notNull().references(function () { return exports.projects.id; }, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('project_favorites_project_user_idx').on(t.projectId, t.userId),
    (0, pg_core_1.index)('project_favorites_project_idx').on(t.projectId),
    (0, pg_core_1.index)('project_favorites_user_idx').on(t.userId),
]; });
// ─── Project Comments ──────────────────────────────────────────────────────────
exports.projectComments = (0, pg_core_1.pgTable)('project_comments', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    projectId: (0, pg_core_1.uuid)('project_id').notNull().references(function () { return exports.projects.id; }, { onDelete: 'cascade' }),
    firstName: (0, pg_core_1.text)('first_name').notNull(),
    lastName: (0, pg_core_1.text)('last_name').notNull(),
    email: (0, pg_core_1.text)('email').notNull(),
    body: (0, pg_core_1.text)('body').notNull(),
    emailVerified: (0, pg_core_1.boolean)('email_verified').notNull().default(false),
    verificationToken: (0, pg_core_1.text)('verification_token').notNull().unique(),
    verifiedAt: (0, pg_core_1.timestamp)('verified_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('project_comments_project_idx').on(t.projectId),
    (0, pg_core_1.index)('project_comments_email_idx').on(t.email),
    (0, pg_core_1.index)('project_comments_token_idx').on(t.verificationToken),
    (0, pg_core_1.index)('project_comments_verified_idx').on(t.projectId, t.emailVerified),
]; });

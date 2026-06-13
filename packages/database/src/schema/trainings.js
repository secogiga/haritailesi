"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userCourseBadges = exports.courseAnnouncements = exports.lessonQuestions = exports.coursePayments = exports.courseCertificates = exports.quizAttempts = exports.quizQuestions = exports.courseQuizzes = exports.courseReviews = exports.lessonProgress = exports.courseEnrollments = exports.courseLessons = exports.courseSections = exports.trainings = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var users_1 = require("./users");
// ─── CMS Eğitimler ────────────────────────────────────────────────────────────
exports.trainings = (0, pg_core_1.pgTable)('cms_trainings', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    slug: (0, pg_core_1.text)('slug').notNull().unique(),
    title: (0, pg_core_1.text)('title').notNull(),
    instructor: (0, pg_core_1.text)('instructor'),
    instructorTitle: (0, pg_core_1.text)('instructor_title'),
    instructorBio: (0, pg_core_1.text)('instructor_bio'),
    instructorAvatarKey: (0, pg_core_1.text)('instructor_avatar_key'),
    instructorUserId: (0, pg_core_1.uuid)('instructor_user_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    format: (0, pg_core_1.text)('format'), // Online | Yüz Yüze | Hibrit
    level: (0, pg_core_1.text)('level'), // Başlangıç | Orta | İleri
    duration: (0, pg_core_1.text)('duration'), // "12 saat · 6 oturum"
    price: (0, pg_core_1.text)('price'), // null = ücretsiz (display)
    memberPrice: (0, pg_core_1.text)('member_price'),
    accessLevel: (0, pg_core_1.text)('access_level').notNull().default('member'), // public | member | premium
    description: (0, pg_core_1.text)('description'),
    body: (0, pg_core_1.text)('body'), // Kurs hakkında uzun açıklama (markdown)
    coverImageKey: (0, pg_core_1.text)('cover_image_key'),
    tags: (0, pg_core_1.jsonb)('tags').$type().default([]),
    prerequisites: (0, pg_core_1.jsonb)('prerequisites').$type().default([]), // training slug'ları
    certificateThreshold: (0, pg_core_1.integer)('certificate_threshold').default(70), // quiz geçme notu %
    viewCount: (0, pg_core_1.integer)('view_count').notNull().default(0),
    enrollmentCount: (0, pg_core_1.integer)('enrollment_count').notNull().default(0),
    isPublished: (0, pg_core_1.boolean)('is_published').notNull().default(false),
    registrationUrl: (0, pg_core_1.text)('registration_url'), // dış kayıt linki (opsiyonel)
    startDate: (0, pg_core_1.timestamp)('start_date', { withTimezone: true }),
    mutfakPostId: (0, pg_core_1.uuid)('mutfak_post_id'),
    source: (0, pg_core_1.text)('source'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('trainings_slug_idx').on(t.slug),
    (0, pg_core_1.index)('trainings_published_idx').on(t.isPublished),
    (0, pg_core_1.index)('trainings_level_idx').on(t.level),
    (0, pg_core_1.index)('trainings_format_idx').on(t.format),
]; });
// ─── Kurs Bölümleri ───────────────────────────────────────────────────────────
exports.courseSections = (0, pg_core_1.pgTable)('course_sections', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    trainingId: (0, pg_core_1.uuid)('training_id').notNull().references(function () { return exports.trainings.id; }, { onDelete: 'cascade' }),
    title: (0, pg_core_1.text)('title').notNull(),
    description: (0, pg_core_1.text)('description'),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [(0, pg_core_1.index)('course_sections_training_idx').on(t.trainingId)]; });
// ─── Kurs Dersleri ────────────────────────────────────────────────────────────
exports.courseLessons = (0, pg_core_1.pgTable)('course_lessons', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    sectionId: (0, pg_core_1.uuid)('section_id').notNull().references(function () { return exports.courseSections.id; }, { onDelete: 'cascade' }),
    trainingId: (0, pg_core_1.uuid)('training_id').notNull().references(function () { return exports.trainings.id; }, { onDelete: 'cascade' }),
    slug: (0, pg_core_1.text)('slug').notNull(),
    title: (0, pg_core_1.text)('title').notNull(),
    description: (0, pg_core_1.text)('description'),
    // Ders tipi: video | text | pdf | quiz | live
    contentType: (0, pg_core_1.text)('content_type').notNull().default('video'),
    videoUrl: (0, pg_core_1.text)('video_url'), // YouTube/Vimeo URL
    videoEmbed: (0, pg_core_1.text)('video_embed'), // iframe embed kodu
    body: (0, pg_core_1.text)('body'), // metin içerik (markdown)
    pdfKey: (0, pg_core_1.text)('pdf_key'), // MinIO PDF anahtarı
    durationMinutes: (0, pg_core_1.integer)('duration_minutes'),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isFree: (0, pg_core_1.boolean)('is_free').notNull().default(false),
    isPublished: (0, pg_core_1.boolean)('is_published').notNull().default(true),
    viewCount: (0, pg_core_1.integer)('view_count').notNull().default(0),
    xpReward: (0, pg_core_1.integer)('xp_reward').notNull().default(10), // tamamlama XP'si
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('course_lessons_section_idx').on(t.sectionId),
    (0, pg_core_1.index)('course_lessons_training_idx').on(t.trainingId),
    (0, pg_core_1.uniqueIndex)('course_lessons_training_slug_idx').on(t.trainingId, t.slug),
]; });
// ─── Kurs Kayıtları (Enrollment) ──────────────────────────────────────────────
exports.courseEnrollments = (0, pg_core_1.pgTable)('course_enrollments', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    trainingId: (0, pg_core_1.uuid)('training_id').notNull().references(function () { return exports.trainings.id; }, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    enrolledAt: (0, pg_core_1.timestamp)('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
    lastAccessedAt: (0, pg_core_1.timestamp)('last_accessed_at', { withTimezone: true }),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { withTimezone: true }),
    progressPct: (0, pg_core_1.integer)('progress_pct').notNull().default(0), // 0-100
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('course_enrollments_training_user_idx').on(t.trainingId, t.userId),
    (0, pg_core_1.index)('course_enrollments_user_idx').on(t.userId),
    (0, pg_core_1.index)('course_enrollments_training_idx').on(t.trainingId),
]; });
// ─── Ders İlerlemesi ──────────────────────────────────────────────────────────
exports.lessonProgress = (0, pg_core_1.pgTable)('lesson_progress', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    lessonId: (0, pg_core_1.uuid)('lesson_id').notNull().references(function () { return exports.courseLessons.id; }, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { withTimezone: true }).notNull().defaultNow(),
    timeSpentSeconds: (0, pg_core_1.integer)('time_spent_seconds').default(0),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('lesson_progress_lesson_user_idx').on(t.lessonId, t.userId),
    (0, pg_core_1.index)('lesson_progress_user_idx').on(t.userId),
]; });
// ─── Kurs Yorumları ───────────────────────────────────────────────────────────
exports.courseReviews = (0, pg_core_1.pgTable)('course_reviews', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    trainingId: (0, pg_core_1.uuid)('training_id').notNull().references(function () { return exports.trainings.id; }, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    rating: (0, pg_core_1.integer)('rating').notNull(), // 1-5
    comment: (0, pg_core_1.text)('comment'),
    isPublished: (0, pg_core_1.boolean)('is_published').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('course_reviews_training_user_idx').on(t.trainingId, t.userId),
    (0, pg_core_1.index)('course_reviews_training_idx').on(t.trainingId),
]; });
// ─── Quiz Soruları ────────────────────────────────────────────────────────────
exports.courseQuizzes = (0, pg_core_1.pgTable)('course_quizzes', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    trainingId: (0, pg_core_1.uuid)('training_id').notNull().references(function () { return exports.trainings.id; }, { onDelete: 'cascade' }),
    lessonId: (0, pg_core_1.uuid)('lesson_id').references(function () { return exports.courseLessons.id; }, { onDelete: 'cascade' }),
    title: (0, pg_core_1.text)('title').notNull(),
    passingScore: (0, pg_core_1.integer)('passing_score').notNull().default(70),
    maxAttempts: (0, pg_core_1.integer)('max_attempts').notNull().default(0), // 0 = sınırsız
    randomizeQuestions: (0, pg_core_1.boolean)('randomize_questions').notNull().default(false),
    questionPoolSize: (0, pg_core_1.integer)('question_pool_size'), // null = hepsi
    showCorrectAnswers: (0, pg_core_1.boolean)('show_correct_answers').notNull().default(true),
    timeLimitMinutes: (0, pg_core_1.integer)('time_limit_minutes'), // null = süresiz
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [(0, pg_core_1.index)('course_quizzes_training_idx').on(t.trainingId)]; });
exports.quizQuestions = (0, pg_core_1.pgTable)('quiz_questions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    quizId: (0, pg_core_1.uuid)('quiz_id').notNull().references(function () { return exports.courseQuizzes.id; }, { onDelete: 'cascade' }),
    question: (0, pg_core_1.text)('question').notNull(),
    questionType: (0, pg_core_1.text)('question_type').notNull().default('single'), // single | multi | text
    options: (0, pg_core_1.jsonb)('options').$type(),
    correctAnswers: (0, pg_core_1.jsonb)('correct_answers').$type().notNull().default([]),
    explanation: (0, pg_core_1.text)('explanation'),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
}, function (t) { return [(0, pg_core_1.index)('quiz_questions_quiz_idx').on(t.quizId)]; });
exports.quizAttempts = (0, pg_core_1.pgTable)('quiz_attempts', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    quizId: (0, pg_core_1.uuid)('quiz_id').notNull().references(function () { return exports.courseQuizzes.id; }, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    score: (0, pg_core_1.integer)('score').notNull(),
    passed: (0, pg_core_1.boolean)('passed').notNull().default(false),
    answers: (0, pg_core_1.jsonb)('answers').$type(),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('quiz_attempts_quiz_idx').on(t.quizId),
    (0, pg_core_1.index)('quiz_attempts_user_idx').on(t.userId),
]; });
// ─── Kurs Sertifikaları ───────────────────────────────────────────────────────
exports.courseCertificates = (0, pg_core_1.pgTable)('course_certificates', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    trainingId: (0, pg_core_1.uuid)('training_id').notNull().references(function () { return exports.trainings.id; }, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    certificateCode: (0, pg_core_1.text)('certificate_code').notNull().unique(),
    issuedAt: (0, pg_core_1.timestamp)('issued_at', { withTimezone: true }).notNull().defaultNow(),
    quizScore: (0, pg_core_1.integer)('quiz_score'), // aldığı puan
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('course_certificates_training_user_idx').on(t.trainingId, t.userId),
    (0, pg_core_1.index)('course_certificates_code_idx').on(t.certificateCode),
]; });
// ─── Kurs Ödemeleri ───────────────────────────────────────────────────────────
exports.coursePayments = (0, pg_core_1.pgTable)('course_payments', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    trainingId: (0, pg_core_1.uuid)('training_id').notNull().references(function () { return exports.trainings.id; }, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    amount: (0, pg_core_1.text)('amount').notNull(), // "1800 TL"
    paymentRef: (0, pg_core_1.text)('payment_ref'), // EFT referans / dekont no
    status: (0, pg_core_1.text)('status').notNull().default('pending'), // pending | confirmed | rejected
    adminNote: (0, pg_core_1.text)('admin_note'),
    confirmedAt: (0, pg_core_1.timestamp)('confirmed_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('course_payments_training_idx').on(t.trainingId),
    (0, pg_core_1.index)('course_payments_user_idx').on(t.userId),
    (0, pg_core_1.index)('course_payments_status_idx').on(t.status),
]; });
// ─── Ders Soruları (Q&A) ──────────────────────────────────────────────────────
exports.lessonQuestions = (0, pg_core_1.pgTable)('lesson_questions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    lessonId: (0, pg_core_1.uuid)('lesson_id').notNull().references(function () { return exports.courseLessons.id; }, { onDelete: 'cascade' }),
    trainingId: (0, pg_core_1.uuid)('training_id').notNull().references(function () { return exports.trainings.id; }, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    question: (0, pg_core_1.text)('question').notNull(),
    answer: (0, pg_core_1.text)('answer'),
    answeredAt: (0, pg_core_1.timestamp)('answered_at', { withTimezone: true }),
    answeredByUserId: (0, pg_core_1.uuid)('answered_by_user_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    isPublished: (0, pg_core_1.boolean)('is_published').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('lesson_questions_lesson_idx').on(t.lessonId),
    (0, pg_core_1.index)('lesson_questions_training_idx').on(t.trainingId),
    (0, pg_core_1.index)('lesson_questions_user_idx').on(t.userId),
]; });
// ─── Kurs Duyuruları ──────────────────────────────────────────────────────────
exports.courseAnnouncements = (0, pg_core_1.pgTable)('course_announcements', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    trainingId: (0, pg_core_1.uuid)('training_id').notNull().references(function () { return exports.trainings.id; }, { onDelete: 'cascade' }),
    title: (0, pg_core_1.text)('title').notNull(),
    body: (0, pg_core_1.text)('body').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [(0, pg_core_1.index)('course_announcements_training_idx').on(t.trainingId)]; });
// ─── Kullanıcı Rozetleri ──────────────────────────────────────────────────────
exports.userCourseBadges = (0, pg_core_1.pgTable)('user_course_badges', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    badgeCode: (0, pg_core_1.text)('badge_code').notNull(), // first-enrollment | first-completion | quiz-ace | triple-crown | certified
    awardedAt: (0, pg_core_1.timestamp)('awarded_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: (0, pg_core_1.jsonb)('metadata').$type(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('user_course_badges_user_code_idx').on(t.userId, t.badgeCode),
    (0, pg_core_1.index)('user_course_badges_user_idx').on(t.userId),
]; });

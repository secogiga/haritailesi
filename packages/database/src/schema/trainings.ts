import { pgTable, uuid, text, boolean, integer, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

// ─── CMS Eğitimler ────────────────────────────────────────────────────────────

export const trainings = pgTable(
  'cms_trainings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    instructor: text('instructor'),
    instructorTitle: text('instructor_title'),
    instructorBio: text('instructor_bio'),
    instructorAvatarKey: text('instructor_avatar_key'),
    instructorUserId: uuid('instructor_user_id').references(() => users.id, { onDelete: 'set null' }),
    format: text('format'),           // Online | Yüz Yüze | Hibrit
    level: text('level'),             // Başlangıç | Orta | İleri
    duration: text('duration'),       // "12 saat · 6 oturum"
    price: text('price'),             // null = ücretsiz (display)
    memberPrice: text('member_price'),
    accessLevel: text('access_level').notNull().default('member'), // public | member | premium
    description: text('description'),
    body: text('body'),               // Kurs hakkında uzun açıklama (markdown)
    coverImageKey: text('cover_image_key'),
    tags: jsonb('tags').$type<string[]>().default([]),
    prerequisites: jsonb('prerequisites').$type<string[]>().default([]), // training slug'ları
    certificateThreshold: integer('certificate_threshold').default(70), // quiz geçme notu %
    viewCount: integer('view_count').notNull().default(0),
    enrollmentCount: integer('enrollment_count').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(false),
    registrationUrl: text('registration_url'), // dış kayıt linki (opsiyonel)
    startDate: timestamp('start_date', { withTimezone: true }),
    mutfakPostId: uuid('mutfak_post_id'),
    source: text('source'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('trainings_slug_idx').on(t.slug),
    index('trainings_published_idx').on(t.isPublished),
    index('trainings_level_idx').on(t.level),
    index('trainings_format_idx').on(t.format),
  ],
);

// ─── Kurs Bölümleri ───────────────────────────────────────────────────────────

export const courseSections = pgTable(
  'course_sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    trainingId: uuid('training_id').notNull().references(() => trainings.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('course_sections_training_idx').on(t.trainingId)],
);

// ─── Kurs Dersleri ────────────────────────────────────────────────────────────

export const courseLessons = pgTable(
  'course_lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sectionId: uuid('section_id').notNull().references(() => courseSections.id, { onDelete: 'cascade' }),
    trainingId: uuid('training_id').notNull().references(() => trainings.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    // Ders tipi: video | text | pdf | quiz | live
    contentType: text('content_type').notNull().default('video'),
    videoUrl: text('video_url'),       // YouTube/Vimeo URL
    videoEmbed: text('video_embed'),   // iframe embed kodu
    body: text('body'),                // metin içerik (markdown)
    pdfKey: text('pdf_key'),           // MinIO PDF anahtarı
    durationMinutes: integer('duration_minutes'),
    sortOrder: integer('sort_order').notNull().default(0),
    isFree: boolean('is_free').notNull().default(false),
    isPublished: boolean('is_published').notNull().default(true),
    viewCount: integer('view_count').notNull().default(0),
    xpReward: integer('xp_reward').notNull().default(10),  // tamamlama XP'si
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('course_lessons_section_idx').on(t.sectionId),
    index('course_lessons_training_idx').on(t.trainingId),
    uniqueIndex('course_lessons_training_slug_idx').on(t.trainingId, t.slug),
  ],
);

// ─── Kurs Kayıtları (Enrollment) ──────────────────────────────────────────────

export const courseEnrollments = pgTable(
  'course_enrollments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    trainingId: uuid('training_id').notNull().references(() => trainings.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
    lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    progressPct: integer('progress_pct').notNull().default(0), // 0-100
  },
  (t) => [
    uniqueIndex('course_enrollments_training_user_idx').on(t.trainingId, t.userId),
    index('course_enrollments_user_idx').on(t.userId),
    index('course_enrollments_training_idx').on(t.trainingId),
  ],
);

// ─── Ders İlerlemesi ──────────────────────────────────────────────────────────

export const lessonProgress = pgTable(
  'lesson_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id').notNull().references(() => courseLessons.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
    timeSpentSeconds: integer('time_spent_seconds').default(0),
  },
  (t) => [
    uniqueIndex('lesson_progress_lesson_user_idx').on(t.lessonId, t.userId),
    index('lesson_progress_user_idx').on(t.userId),
  ],
);

// ─── Kurs Yorumları ───────────────────────────────────────────────────────────

export const courseReviews = pgTable(
  'course_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    trainingId: uuid('training_id').notNull().references(() => trainings.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(), // 1-5
    comment: text('comment'),
    isPublished: boolean('is_published').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('course_reviews_training_user_idx').on(t.trainingId, t.userId),
    index('course_reviews_training_idx').on(t.trainingId),
  ],
);

// ─── Quiz Soruları ────────────────────────────────────────────────────────────

export const courseQuizzes = pgTable(
  'course_quizzes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    trainingId: uuid('training_id').notNull().references(() => trainings.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id').references(() => courseLessons.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    passingScore: integer('passing_score').notNull().default(70),
    maxAttempts: integer('max_attempts').notNull().default(0),          // 0 = sınırsız
    randomizeQuestions: boolean('randomize_questions').notNull().default(false),
    questionPoolSize: integer('question_pool_size'),                    // null = hepsi
    showCorrectAnswers: boolean('show_correct_answers').notNull().default(true),
    timeLimitMinutes: integer('time_limit_minutes'),                    // null = süresiz
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('course_quizzes_training_idx').on(t.trainingId)],
);

export const quizQuestions = pgTable(
  'quiz_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    quizId: uuid('quiz_id').notNull().references(() => courseQuizzes.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    questionType: text('question_type').notNull().default('single'), // single | multi | text
    options: jsonb('options').$type<string[]>(),
    correctAnswers: jsonb('correct_answers').$type<string[]>().notNull().default([]),
    explanation: text('explanation'),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('quiz_questions_quiz_idx').on(t.quizId)],
);

export const quizAttempts = pgTable(
  'quiz_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    quizId: uuid('quiz_id').notNull().references(() => courseQuizzes.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    score: integer('score').notNull(),
    passed: boolean('passed').notNull().default(false),
    answers: jsonb('answers').$type<Record<string, string | string[]>>(),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('quiz_attempts_quiz_idx').on(t.quizId),
    index('quiz_attempts_user_idx').on(t.userId),
  ],
);

// ─── Kurs Sertifikaları ───────────────────────────────────────────────────────

export const courseCertificates = pgTable(
  'course_certificates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    trainingId: uuid('training_id').notNull().references(() => trainings.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    certificateCode: text('certificate_code').notNull().unique(),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    quizScore: integer('quiz_score'), // aldığı puan
  },
  (t) => [
    uniqueIndex('course_certificates_training_user_idx').on(t.trainingId, t.userId),
    index('course_certificates_code_idx').on(t.certificateCode),
  ],
);

// ─── Kurs Ödemeleri ───────────────────────────────────────────────────────────

export const coursePayments = pgTable(
  'course_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    trainingId: uuid('training_id').notNull().references(() => trainings.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    amount: text('amount').notNull(),                // "1800 TL"
    paymentRef: text('payment_ref'),                 // EFT referans / dekont no
    status: text('status').notNull().default('pending'), // pending | confirmed | rejected
    adminNote: text('admin_note'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('course_payments_training_idx').on(t.trainingId),
    index('course_payments_user_idx').on(t.userId),
    index('course_payments_status_idx').on(t.status),
  ],
);

// ─── Ders Soruları (Q&A) ──────────────────────────────────────────────────────

export const lessonQuestions = pgTable(
  'lesson_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id').notNull().references(() => courseLessons.id, { onDelete: 'cascade' }),
    trainingId: uuid('training_id').notNull().references(() => trainings.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    answer: text('answer'),
    answeredAt: timestamp('answered_at', { withTimezone: true }),
    answeredByUserId: uuid('answered_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    isPublished: boolean('is_published').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('lesson_questions_lesson_idx').on(t.lessonId),
    index('lesson_questions_training_idx').on(t.trainingId),
    index('lesson_questions_user_idx').on(t.userId),
  ],
);

// ─── Kurs Duyuruları ──────────────────────────────────────────────────────────

export const courseAnnouncements = pgTable(
  'course_announcements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    trainingId: uuid('training_id').notNull().references(() => trainings.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('course_announcements_training_idx').on(t.trainingId)],
);

// ─── Kullanıcı Rozetleri ──────────────────────────────────────────────────────

export const userCourseBadges = pgTable(
  'user_course_badges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    badgeCode: text('badge_code').notNull(), // first-enrollment | first-completion | quiz-ace | triple-crown | certified
    awardedAt: timestamp('awarded_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  },
  (t) => [
    uniqueIndex('user_course_badges_user_code_idx').on(t.userId, t.badgeCode),
    index('user_course_badges_user_idx').on(t.userId),
  ],
);

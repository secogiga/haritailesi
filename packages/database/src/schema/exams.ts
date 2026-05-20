import { pgTable, uuid, text, boolean, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// ─── Sınav Hazırlık (Exam Categories + Questions + Attempts) ─────────────────
// Sınav tipleri: kpss | uzmanlik | deger | cbs | diger
// correctOption: 'a' | 'b' | 'c' | 'd' | 'e'

export const examCategories = pgTable(
  'exam_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    examType: text('exam_type').notNull().default('diger'), // kpss|uzmanlik|deger|cbs|diger
    iconEmoji: text('icon_emoji').default('📝'),
    questionCount: integer('question_count').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('exam_cats_type_idx').on(t.examType),
    index('exam_cats_active_idx').on(t.isActive),
  ],
);

export const examQuestions = pgTable(
  'exam_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id').notNull().references(() => examCategories.id, { onDelete: 'cascade' }),
    questionText: text('question_text').notNull(),
    optionA: text('option_a').notNull(),
    optionB: text('option_b').notNull(),
    optionC: text('option_c').notNull(),
    optionD: text('option_d').notNull(),
    optionE: text('option_e'),                  // bazı sınavlarda 5 şık
    correctOption: text('correct_option').notNull(), // 'a'|'b'|'c'|'d'|'e'
    explanation: text('explanation'),           // çözüm açıklaması
    difficulty: text('difficulty').notNull().default('medium'), // easy|medium|hard
    source: text('source'),                     // kaynak kitap/yıl
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('exam_q_category_idx').on(t.categoryId),
    index('exam_q_difficulty_idx').on(t.difficulty),
    index('exam_q_active_idx').on(t.isActive),
  ],
);

export const examAttempts = pgTable(
  'exam_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id').notNull().references(() => examCategories.id),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    score: integer('score').notNull(),
    totalQuestions: integer('total_questions').notNull(),
    timeTakenSeconds: integer('time_taken_seconds'),
    answers: jsonb('answers').notNull().$type<Record<string, string>>(), // questionId → 'a'|'b'...
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('exam_attempts_category_idx').on(t.categoryId),
    index('exam_attempts_user_idx').on(t.userId),
    index('exam_attempts_completed_idx').on(t.completedAt),
  ],
);

// ─── Sınav Kaynakları (Exam Resources) ───────────────────────────────────────
// examKey: kpss | deger | cbs | iha
// resourceType: tip | document | date | video

export const examResources = pgTable(
  'exam_resources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    examKey: text('exam_key').notNull(),           // kpss | deger | cbs | iha
    resourceType: text('resource_type').notNull(), // tip | document | date | video
    title: text('title').notNull(),
    content: text('content'),                      // tip metni veya açıklama
    resourceUrl: text('resource_url'),             // döküman/video URL
    eventDate: timestamp('event_date', { withTimezone: true }), // önemli tarih
    isPublished: boolean('is_published').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    viewCount: integer('view_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('exam_res_key_idx').on(t.examKey),
    index('exam_res_type_idx').on(t.resourceType),
    index('exam_res_published_idx').on(t.isPublished),
  ],
);

export const examCategoriesRelations = relations(examCategories, ({ many }) => ({
  questions: many(examQuestions),
  attempts: many(examAttempts),
}));

export const examQuestionsRelations = relations(examQuestions, ({ one }) => ({
  category: one(examCategories, { fields: [examQuestions.categoryId], references: [examCategories.id] }),
}));

export const examAttemptsRelations = relations(examAttempts, ({ one }) => ({
  category: one(examCategories, { fields: [examAttempts.categoryId], references: [examCategories.id] }),
  user: one(users, { fields: [examAttempts.userId], references: [users.id] }),
}));

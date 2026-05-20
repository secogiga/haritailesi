import {
  pgTable, pgEnum, uuid, text, boolean, integer, timestamp, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { posts } from './feed';
import { postCategoryEnum } from './enums';

// ─── Status enum ──────────────────────────────────────────────────────────────

export const qaStatusEnum = pgEnum('qa_status', [
  'pending',    // Gönderildi, admin incelemedi
  'approved',   // Admin onayladı; isMutfakPublished / isSahnePublished ile kanal seçilir
  'rejected',   // Admin reddetti
  'hidden',     // Yayındaydı, admin gizledi
]);

// ─── Community Questions ───────────────────────────────────────────────────────
// Sahne veya Mutfak'tan gelen sorular.
// İki bağımsız yayın kanalı: Mutfak feed + Sahne SSS.

export const communityQuestions = pgTable(
  'community_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    email: text('email').notNull(),
    displayName: text('display_name'),
    questionText: text('question_text').notNull(),
    category: postCategoryEnum('category').notNull().default('haritailesi_duyurulari'),
    status: qaStatusEnum('status').notNull().default('pending'),

    // Yayın kanalları — bağımsız toggle
    isMutfakPublished: boolean('is_mutfak_published').notNull().default(false),
    isSahnePublished: boolean('is_sahne_published').notNull().default(false),
    isFeatured: boolean('is_featured').notNull().default(false),

    // Mutfak feed entegrasyonu — soru yayınlandığında oluşturulan post
    feedPostId: uuid('feed_post_id').references(() => posts.id, { onDelete: 'set null' }),

    showFullName: boolean('show_full_name').notNull().default(true),
    viewCount: integer('view_count').notNull().default(0),
    source: text('source').notNull().default('sahne'),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('cq_status_idx').on(t.status),
    index('cq_category_idx').on(t.category),
    index('cq_created_at_idx').on(t.createdAt),
    index('cq_featured_idx').on(t.isFeatured),
    index('cq_mutfak_pub_idx').on(t.isMutfakPublished),
    index('cq_sahne_pub_idx').on(t.isSahnePublished),
  ],
);

// ─── Community Answers ─────────────────────────────────────────────────────────
// Bir soruya birden fazla cevap gelebilir (Sahne + Mutfak'tan).
// Admin her cevabı ayrı ayrı inceler; isPublished=true olanlar görünür.

export const communityAnswers = pgTable(
  'community_answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => communityQuestions.id, { onDelete: 'cascade' }),

    // Cevabı gönderen (anonim Sahne → email; Mutfak üyesi → userId)
    submitterUserId: uuid('submitter_user_id').references(() => users.id, { onDelete: 'set null' }),
    submitterEmail: text('submitter_email'),
    submitterName: text('submitter_name'),
    submitterTier: text('submitter_tier'), // 'registered_user' | 'haritailesi_genc' | 'new_graduate_member' | 'individual_member' | 'corporate_member'

    body: text('body').notNull(),
    source: text('source').notNull().default('admin'), // 'sahne' | 'mutfak' | 'admin'

    showFullName: boolean('show_full_name').notNull().default(true),
    isPublished: boolean('is_published').notNull().default(false),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('ca_question_idx').on(t.questionId),
    index('ca_published_idx').on(t.isPublished),
    index('ca_source_idx').on(t.source),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const communityQuestionsRelations = relations(communityQuestions, ({ one, many }) => ({
  user: one(users, { fields: [communityQuestions.userId], references: [users.id] }),
  approvedByUser: one(users, { fields: [communityQuestions.approvedBy], references: [users.id] }),
  feedPost: one(posts, { fields: [communityQuestions.feedPostId], references: [posts.id] }),
  answers: many(communityAnswers),
}));

export const communityAnswersRelations = relations(communityAnswers, ({ one }) => ({
  question: one(communityQuestions, { fields: [communityAnswers.questionId], references: [communityQuestions.id] }),
  submitterUser: one(users, { fields: [communityAnswers.submitterUserId], references: [users.id] }),
  approvedByUser: one(users, { fields: [communityAnswers.approvedBy], references: [users.id] }),
}));

import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { postTypeEnum, postCategoryEnum, postStatusEnum } from './enums';

// ─── Posts ─────────────────────────────────────────────────────────────────────
// Topluluk akışının ana içerik birimi.
// status geçişi: draft → published | pending_review → published | hidden | deleted

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: postTypeEnum('type').notNull().default('general'),
    category: postCategoryEnum('category').notNull().default('haritailesi_duyurulari'),
    title: text('title'),
    body: text('body').notNull(),
    status: postStatusEnum('status').notNull().default('published'),
    isPinned: boolean('is_pinned').notNull().default(false),
    isPublic: boolean('is_public').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('posts_author_idx').on(t.authorId),
    index('posts_status_idx').on(t.status),
    index('posts_created_at_idx').on(t.createdAt),
    index('posts_pinned_idx').on(t.isPinned),
    index('posts_status_created_idx').on(t.status, t.createdAt),
    index('posts_type_idx').on(t.type),
    index('posts_category_idx').on(t.category),
    index('posts_title_trgm_idx').using('gin', t.title.op('gin_trgm_ops')),
    index('posts_body_trgm_idx').using('gin', t.body.op('gin_trgm_ops')),
  ],
);

// ─── Post Reactions ────────────────────────────────────────────────────────────
// Bir kullanıcı bir post'a en fazla bir reaksiyon verebilir (toggle).
// type: 'like' | 'celebrate' | 'support' | 'insightful'

export const postReactions = pgTable(
  'post_reactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull().default('like'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('post_reactions_post_user_unique').on(t.postId, t.userId),
    index('post_reactions_post_idx').on(t.postId),
  ],
);

// ─── Comments ──────────────────────────────────────────────────────────────────
// Düz liste (flat), silinen yorumlar placeholder mesajıyla tutulur.

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id'),
    body: text('body').notNull(),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('comments_post_idx').on(t.postId),
    index('comments_author_idx').on(t.authorId),
    index('comments_parent_idx').on(t.parentId),
  ],
);

// ─── Poll Options ──────────────────────────────────────────────────────────────

export const pollOptions = pgTable(
  'poll_options',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('poll_options_post_idx').on(t.postId)],
);

// ─── Poll Votes ────────────────────────────────────────────────────────────────

export const pollVotes = pgTable(
  'poll_votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    optionId: uuid('option_id')
      .notNull()
      .references(() => pollOptions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('poll_votes_post_user_unique').on(t.postId, t.userId),
    index('poll_votes_option_idx').on(t.optionId),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  reactions: many(postReactions),
  comments: many(comments),
  pollOptions: many(pollOptions),
}));

export const postReactionsRelations = relations(postReactions, ({ one }) => ({
  post: one(posts, { fields: [postReactions.postId], references: [posts.id] }),
  user: one(users, { fields: [postReactions.userId], references: [users.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const pollOptionsRelations = relations(pollOptions, ({ one, many }) => ({
  post: one(posts, { fields: [pollOptions.postId], references: [posts.id] }),
  votes: many(pollVotes),
}));

export const pollVotesRelations = relations(pollVotes, ({ one }) => ({
  post: one(posts, { fields: [pollVotes.postId], references: [posts.id] }),
  option: one(pollOptions, { fields: [pollVotes.optionId], references: [pollOptions.id] }),
  user: one(users, { fields: [pollVotes.userId], references: [users.id] }),
}));

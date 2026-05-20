import { boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { posts } from './feed';

// ─── User Follows ─────────────────────────────────────────────────────────────

export const userFollows = pgTable(
  'user_follows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    followerId: uuid('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    followeeId: uuid('followee_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('user_follows_pair_unique').on(t.followerId, t.followeeId),
    index('user_follows_follower_idx').on(t.followerId),
    index('user_follows_followee_idx').on(t.followeeId),
  ],
);

export const userFollowsRelations = relations(userFollows, ({ one }) => ({
  follower: one(users, { fields: [userFollows.followerId], references: [users.id] }),
  followee: one(users, { fields: [userFollows.followeeId], references: [users.id] }),
}));

// ─── Post Bookmarks ───────────────────────────────────────────────────────────

export const postBookmarks = pgTable(
  'post_bookmarks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('post_bookmarks_user_post_unique').on(t.userId, t.postId),
    index('post_bookmarks_user_idx').on(t.userId),
    index('post_bookmarks_post_idx').on(t.postId),
  ],
);

export const postBookmarksRelations = relations(postBookmarks, ({ one }) => ({
  user: one(users, { fields: [postBookmarks.userId], references: [users.id] }),
  post: one(posts, { fields: [postBookmarks.postId], references: [posts.id] }),
}));

// ─── Direct Messages ──────────────────────────────────────────────────────────

export const dmThreads = pgTable(
  'dm_threads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user1Id: uuid('user1_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    user2Id: uuid('user2_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('dm_threads_pair_unique').on(t.user1Id, t.user2Id),
    index('dm_threads_user1_idx').on(t.user1Id),
    index('dm_threads_user2_idx').on(t.user2Id),
    index('dm_threads_last_message_idx').on(t.lastMessageAt),
  ],
);

export const directMessages = pgTable(
  'direct_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    threadId: uuid('thread_id').notNull().references(() => dmThreads.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    recipientId: uuid('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('direct_messages_thread_idx').on(t.threadId),
    index('direct_messages_sender_idx').on(t.senderId),
    index('direct_messages_recipient_idx').on(t.recipientId),
    index('direct_messages_created_at_idx').on(t.createdAt),
  ],
);

export const dmThreadsRelations = relations(dmThreads, ({ one, many }) => ({
  user1: one(users, { fields: [dmThreads.user1Id], references: [users.id] }),
  user2: one(users, { fields: [dmThreads.user2Id], references: [users.id] }),
  messages: many(directMessages),
}));

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  thread: one(dmThreads, { fields: [directMessages.threadId], references: [dmThreads.id] }),
  sender: one(users, { fields: [directMessages.senderId], references: [users.id] }),
  recipient: one(users, { fields: [directMessages.recipientId], references: [users.id] }),
}));

// ─── User Badges ──────────────────────────────────────────────────────────────

export const userBadges = pgTable(
  'user_badges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    badgeType: text('badge_type').notNull(),
    awardedAt: timestamp('awarded_at', { withTimezone: true }).notNull().defaultNow(),
    awardedBy: uuid('awarded_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (t) => [
    uniqueIndex('user_badges_user_type_unique').on(t.userId, t.badgeType),
    index('user_badges_user_idx').on(t.userId),
  ],
);

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, { fields: [userBadges.userId], references: [users.id] }),
  awardedByUser: one(users, { fields: [userBadges.awardedBy], references: [users.id] }),
}));

// ─── Push Subscriptions ───────────────────────────────────────────────────────

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('push_subs_user_endpoint_unique').on(t.userId, t.endpoint),
    index('push_subs_user_idx').on(t.userId),
  ],
);

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, { fields: [pushSubscriptions.userId], references: [users.id] }),
}));

// ─── Notification Preferences ─────────────────────────────────────────────────

export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
    preferences: jsonb('preferences').$type<Record<string, boolean>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('notif_prefs_user_idx').on(t.userId)],
);

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, { fields: [notificationPreferences.userId], references: [users.id] }),
}));

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationPreferencesRelations = exports.notificationPreferences = exports.pushSubscriptionsRelations = exports.pushSubscriptions = exports.userBadgesRelations = exports.userBadges = exports.directMessagesRelations = exports.dmThreadsRelations = exports.directMessages = exports.dmThreads = exports.postBookmarksRelations = exports.postBookmarks = exports.userFollowsRelations = exports.userFollows = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var users_1 = require("./users");
var feed_1 = require("./feed");
// ─── User Follows ─────────────────────────────────────────────────────────────
exports.userFollows = (0, pg_core_1.pgTable)('user_follows', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    followerId: (0, pg_core_1.uuid)('follower_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    followeeId: (0, pg_core_1.uuid)('followee_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('user_follows_pair_unique').on(t.followerId, t.followeeId),
    (0, pg_core_1.index)('user_follows_follower_idx').on(t.followerId),
    (0, pg_core_1.index)('user_follows_followee_idx').on(t.followeeId),
]; });
exports.userFollowsRelations = (0, drizzle_orm_1.relations)(exports.userFollows, function (_a) {
    var one = _a.one;
    return ({
        follower: one(users_1.users, { fields: [exports.userFollows.followerId], references: [users_1.users.id] }),
        followee: one(users_1.users, { fields: [exports.userFollows.followeeId], references: [users_1.users.id] }),
    });
});
// ─── Post Bookmarks ───────────────────────────────────────────────────────────
exports.postBookmarks = (0, pg_core_1.pgTable)('post_bookmarks', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    postId: (0, pg_core_1.uuid)('post_id').notNull().references(function () { return feed_1.posts.id; }, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('post_bookmarks_user_post_unique').on(t.userId, t.postId),
    (0, pg_core_1.index)('post_bookmarks_user_idx').on(t.userId),
    (0, pg_core_1.index)('post_bookmarks_post_idx').on(t.postId),
]; });
exports.postBookmarksRelations = (0, drizzle_orm_1.relations)(exports.postBookmarks, function (_a) {
    var one = _a.one;
    return ({
        user: one(users_1.users, { fields: [exports.postBookmarks.userId], references: [users_1.users.id] }),
        post: one(feed_1.posts, { fields: [exports.postBookmarks.postId], references: [feed_1.posts.id] }),
    });
});
// ─── Direct Messages ──────────────────────────────────────────────────────────
exports.dmThreads = (0, pg_core_1.pgTable)('dm_threads', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user1Id: (0, pg_core_1.uuid)('user1_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    user2Id: (0, pg_core_1.uuid)('user2_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    lastMessageAt: (0, pg_core_1.timestamp)('last_message_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('dm_threads_pair_unique').on(t.user1Id, t.user2Id),
    (0, pg_core_1.index)('dm_threads_user1_idx').on(t.user1Id),
    (0, pg_core_1.index)('dm_threads_user2_idx').on(t.user2Id),
    (0, pg_core_1.index)('dm_threads_last_message_idx').on(t.lastMessageAt),
]; });
exports.directMessages = (0, pg_core_1.pgTable)('direct_messages', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    threadId: (0, pg_core_1.uuid)('thread_id').notNull().references(function () { return exports.dmThreads.id; }, { onDelete: 'cascade' }),
    senderId: (0, pg_core_1.uuid)('sender_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    recipientId: (0, pg_core_1.uuid)('recipient_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    body: (0, pg_core_1.text)('body').notNull(),
    isRead: (0, pg_core_1.boolean)('is_read').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('direct_messages_thread_idx').on(t.threadId),
    (0, pg_core_1.index)('direct_messages_sender_idx').on(t.senderId),
    (0, pg_core_1.index)('direct_messages_recipient_idx').on(t.recipientId),
    (0, pg_core_1.index)('direct_messages_created_at_idx').on(t.createdAt),
]; });
exports.dmThreadsRelations = (0, drizzle_orm_1.relations)(exports.dmThreads, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        user1: one(users_1.users, { fields: [exports.dmThreads.user1Id], references: [users_1.users.id] }),
        user2: one(users_1.users, { fields: [exports.dmThreads.user2Id], references: [users_1.users.id] }),
        messages: many(exports.directMessages),
    });
});
exports.directMessagesRelations = (0, drizzle_orm_1.relations)(exports.directMessages, function (_a) {
    var one = _a.one;
    return ({
        thread: one(exports.dmThreads, { fields: [exports.directMessages.threadId], references: [exports.dmThreads.id] }),
        sender: one(users_1.users, { fields: [exports.directMessages.senderId], references: [users_1.users.id] }),
        recipient: one(users_1.users, { fields: [exports.directMessages.recipientId], references: [users_1.users.id] }),
    });
});
// ─── User Badges ──────────────────────────────────────────────────────────────
exports.userBadges = (0, pg_core_1.pgTable)('user_badges', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    badgeType: (0, pg_core_1.text)('badge_type').notNull(),
    awardedAt: (0, pg_core_1.timestamp)('awarded_at', { withTimezone: true }).notNull().defaultNow(),
    awardedBy: (0, pg_core_1.uuid)('awarded_by').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('user_badges_user_type_unique').on(t.userId, t.badgeType),
    (0, pg_core_1.index)('user_badges_user_idx').on(t.userId),
]; });
exports.userBadgesRelations = (0, drizzle_orm_1.relations)(exports.userBadges, function (_a) {
    var one = _a.one;
    return ({
        user: one(users_1.users, { fields: [exports.userBadges.userId], references: [users_1.users.id] }),
        awardedByUser: one(users_1.users, { fields: [exports.userBadges.awardedBy], references: [users_1.users.id] }),
    });
});
// ─── Push Subscriptions ───────────────────────────────────────────────────────
exports.pushSubscriptions = (0, pg_core_1.pgTable)('push_subscriptions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    endpoint: (0, pg_core_1.text)('endpoint').notNull(),
    p256dh: (0, pg_core_1.text)('p256dh').notNull(),
    auth: (0, pg_core_1.text)('auth').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('push_subs_user_endpoint_unique').on(t.userId, t.endpoint),
    (0, pg_core_1.index)('push_subs_user_idx').on(t.userId),
]; });
exports.pushSubscriptionsRelations = (0, drizzle_orm_1.relations)(exports.pushSubscriptions, function (_a) {
    var one = _a.one;
    return ({
        user: one(users_1.users, { fields: [exports.pushSubscriptions.userId], references: [users_1.users.id] }),
    });
});
// ─── Notification Preferences ─────────────────────────────────────────────────
exports.notificationPreferences = (0, pg_core_1.pgTable)('notification_preferences', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }).unique(),
    preferences: (0, pg_core_1.jsonb)('preferences').$type().notNull().default({}),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [(0, pg_core_1.index)('notif_prefs_user_idx').on(t.userId)]; });
exports.notificationPreferencesRelations = (0, drizzle_orm_1.relations)(exports.notificationPreferences, function (_a) {
    var one = _a.one;
    return ({
        user: one(users_1.users, { fields: [exports.notificationPreferences.userId], references: [users_1.users.id] }),
    });
});

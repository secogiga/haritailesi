"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pollVotesRelations = exports.pollOptionsRelations = exports.commentsRelations = exports.postReactionsRelations = exports.postsRelations = exports.pollVotes = exports.pollOptions = exports.comments = exports.postReactions = exports.posts = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var users_1 = require("./users");
var enums_1 = require("./enums");
// ─── Posts ─────────────────────────────────────────────────────────────────────
// Topluluk akışının ana içerik birimi.
// status geçişi: draft → published | pending_review → published | hidden | deleted
exports.posts = (0, pg_core_1.pgTable)('posts', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    authorId: (0, pg_core_1.uuid)('author_id')
        .notNull()
        .references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    type: (0, enums_1.postTypeEnum)('type').notNull().default('general'),
    category: (0, enums_1.postCategoryEnum)('category').notNull().default('haritailesi_duyurulari'),
    title: (0, pg_core_1.text)('title'),
    body: (0, pg_core_1.text)('body').notNull(),
    status: (0, enums_1.postStatusEnum)('status').notNull().default('published'),
    isPinned: (0, pg_core_1.boolean)('is_pinned').notNull().default(false),
    isPublic: (0, pg_core_1.boolean)('is_public').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('posts_author_idx').on(t.authorId),
    (0, pg_core_1.index)('posts_status_idx').on(t.status),
    (0, pg_core_1.index)('posts_created_at_idx').on(t.createdAt),
    (0, pg_core_1.index)('posts_pinned_idx').on(t.isPinned),
    (0, pg_core_1.index)('posts_status_created_idx').on(t.status, t.createdAt),
    (0, pg_core_1.index)('posts_type_idx').on(t.type),
    (0, pg_core_1.index)('posts_category_idx').on(t.category),
    (0, pg_core_1.index)('posts_title_trgm_idx').using('gin', t.title.op('gin_trgm_ops')),
    (0, pg_core_1.index)('posts_body_trgm_idx').using('gin', t.body.op('gin_trgm_ops')),
]; });
// ─── Post Reactions ────────────────────────────────────────────────────────────
// Bir kullanıcı bir post'a en fazla bir reaksiyon verebilir (toggle).
// type: 'like' | 'celebrate' | 'support' | 'insightful'
exports.postReactions = (0, pg_core_1.pgTable)('post_reactions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    postId: (0, pg_core_1.uuid)('post_id')
        .notNull()
        .references(function () { return exports.posts.id; }, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    type: (0, pg_core_1.text)('type').notNull().default('like'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('post_reactions_post_user_unique').on(t.postId, t.userId),
    (0, pg_core_1.index)('post_reactions_post_idx').on(t.postId),
]; });
// ─── Comments ──────────────────────────────────────────────────────────────────
// Düz liste (flat), silinen yorumlar placeholder mesajıyla tutulur.
exports.comments = (0, pg_core_1.pgTable)('comments', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    postId: (0, pg_core_1.uuid)('post_id')
        .notNull()
        .references(function () { return exports.posts.id; }, { onDelete: 'cascade' }),
    authorId: (0, pg_core_1.uuid)('author_id')
        .notNull()
        .references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    parentId: (0, pg_core_1.uuid)('parent_id'),
    body: (0, pg_core_1.text)('body').notNull(),
    isDeleted: (0, pg_core_1.boolean)('is_deleted').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('comments_post_idx').on(t.postId),
    (0, pg_core_1.index)('comments_author_idx').on(t.authorId),
    (0, pg_core_1.index)('comments_parent_idx').on(t.parentId),
]; });
// ─── Poll Options ──────────────────────────────────────────────────────────────
exports.pollOptions = (0, pg_core_1.pgTable)('poll_options', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    postId: (0, pg_core_1.uuid)('post_id')
        .notNull()
        .references(function () { return exports.posts.id; }, { onDelete: 'cascade' }),
    text: (0, pg_core_1.text)('text').notNull(),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [(0, pg_core_1.index)('poll_options_post_idx').on(t.postId)]; });
// ─── Poll Votes ────────────────────────────────────────────────────────────────
exports.pollVotes = (0, pg_core_1.pgTable)('poll_votes', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    postId: (0, pg_core_1.uuid)('post_id')
        .notNull()
        .references(function () { return exports.posts.id; }, { onDelete: 'cascade' }),
    optionId: (0, pg_core_1.uuid)('option_id')
        .notNull()
        .references(function () { return exports.pollOptions.id; }, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('poll_votes_post_user_unique').on(t.postId, t.userId),
    (0, pg_core_1.index)('poll_votes_option_idx').on(t.optionId),
]; });
// ─── Relations ────────────────────────────────────────────────────────────────
exports.postsRelations = (0, drizzle_orm_1.relations)(exports.posts, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        author: one(users_1.users, { fields: [exports.posts.authorId], references: [users_1.users.id] }),
        reactions: many(exports.postReactions),
        comments: many(exports.comments),
        pollOptions: many(exports.pollOptions),
    });
});
exports.postReactionsRelations = (0, drizzle_orm_1.relations)(exports.postReactions, function (_a) {
    var one = _a.one;
    return ({
        post: one(exports.posts, { fields: [exports.postReactions.postId], references: [exports.posts.id] }),
        user: one(users_1.users, { fields: [exports.postReactions.userId], references: [users_1.users.id] }),
    });
});
exports.commentsRelations = (0, drizzle_orm_1.relations)(exports.comments, function (_a) {
    var one = _a.one;
    return ({
        post: one(exports.posts, { fields: [exports.comments.postId], references: [exports.posts.id] }),
        author: one(users_1.users, { fields: [exports.comments.authorId], references: [users_1.users.id] }),
    });
});
exports.pollOptionsRelations = (0, drizzle_orm_1.relations)(exports.pollOptions, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        post: one(exports.posts, { fields: [exports.pollOptions.postId], references: [exports.posts.id] }),
        votes: many(exports.pollVotes),
    });
});
exports.pollVotesRelations = (0, drizzle_orm_1.relations)(exports.pollVotes, function (_a) {
    var one = _a.one;
    return ({
        post: one(exports.posts, { fields: [exports.pollVotes.postId], references: [exports.posts.id] }),
        option: one(exports.pollOptions, { fields: [exports.pollVotes.optionId], references: [exports.pollOptions.id] }),
        user: one(users_1.users, { fields: [exports.pollVotes.userId], references: [users_1.users.id] }),
    });
});

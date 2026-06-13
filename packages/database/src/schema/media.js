"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordResetTokensRelations = exports.passwordResetTokens = exports.postImagesRelations = exports.postImages = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var users_1 = require("./users");
var feed_1 = require("./feed");
// ─── Post Images ──────────────────────────────────────────────────────────────
exports.postImages = (0, pg_core_1.pgTable)('post_images', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    postId: (0, pg_core_1.uuid)('post_id').notNull().references(function () { return feed_1.posts.id; }, { onDelete: 'cascade' }),
    imageKey: (0, pg_core_1.text)('image_key').notNull(),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('post_images_post_idx').on(t.postId),
]; });
exports.postImagesRelations = (0, drizzle_orm_1.relations)(exports.postImages, function (_a) {
    var one = _a.one;
    return ({
        post: one(feed_1.posts, { fields: [exports.postImages.postId], references: [feed_1.posts.id] }),
    });
});
// ─── Password Reset Tokens ────────────────────────────────────────────────────
exports.passwordResetTokens = (0, pg_core_1.pgTable)('password_reset_tokens', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    tokenHash: (0, pg_core_1.text)('token_hash').notNull().unique(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }).notNull(),
    usedAt: (0, pg_core_1.timestamp)('used_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('pwd_reset_tokens_user_idx').on(t.userId),
    (0, pg_core_1.index)('pwd_reset_tokens_expires_idx').on(t.expiresAt),
]; });
exports.passwordResetTokensRelations = (0, drizzle_orm_1.relations)(exports.passwordResetTokens, function (_a) {
    var one = _a.one;
    return ({
        user: one(users_1.users, { fields: [exports.passwordResetTokens.userId], references: [users_1.users.id] }),
    });
});
// ─── User Badges (moved to social.ts) — see social.ts ─────────────────────────

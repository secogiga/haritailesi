"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTokensRelations = exports.setupTokens = exports.refreshTokensRelations = exports.refreshTokens = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var users_1 = require("./users");
// ─── Refresh Tokens ───────────────────────────────────────────────────────────
// Her cihaz/oturum için ayrı refresh token — logout all devices mümkün
exports.refreshTokens = (0, pg_core_1.pgTable)('refresh_tokens', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    // Token'ın hash'i saklanır, plaintext asla
    tokenHash: (0, pg_core_1.text)('token_hash').notNull().unique(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: (0, pg_core_1.timestamp)('revoked_at', { withTimezone: true }),
    ipAddress: (0, pg_core_1.text)('ip_address'),
    userAgent: (0, pg_core_1.text)('user_agent'),
}, function (t) { return [
    (0, pg_core_1.index)('refresh_tokens_user_id_idx').on(t.userId),
    (0, pg_core_1.index)('refresh_tokens_expires_at_idx').on(t.expiresAt),
]; });
exports.refreshTokensRelations = (0, drizzle_orm_1.relations)(exports.refreshTokens, function (_a) {
    var one = _a.one;
    return ({
        user: one(users_1.users, { fields: [exports.refreshTokens.userId], references: [users_1.users.id] }),
    });
});
// ─── Setup Tokens ─────────────────────────────────────────────────────────────
// İlk şifre belirleme akışı için tek kullanımlık tokenlar (24 saat geçerli)
exports.setupTokens = (0, pg_core_1.pgTable)('setup_tokens', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    tokenHash: (0, pg_core_1.text)('token_hash').notNull().unique(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }).notNull(),
    usedAt: (0, pg_core_1.timestamp)('used_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('setup_tokens_user_id_idx').on(t.userId),
    (0, pg_core_1.index)('setup_tokens_expires_at_idx').on(t.expiresAt),
]; });
exports.setupTokensRelations = (0, drizzle_orm_1.relations)(exports.setupTokens, function (_a) {
    var one = _a.one;
    return ({
        user: one(users_1.users, { fields: [exports.setupTokens.userId], references: [users_1.users.id] }),
    });
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actionLogsRelations = exports.actionLogs = exports.auditLogs = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var users_1 = require("./users");
// ─── Audit Logs ───────────────────────────────────────────────────────────────
// Tüm admin aksiyonları ve state geçişleri burada kayıt altına alınır
exports.auditLogs = (0, pg_core_1.pgTable)('audit_logs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    actorId: (0, pg_core_1.uuid)('actor_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    // actorEmail snapshot olarak saklanır — user silinse bile log kalır
    actorEmail: (0, pg_core_1.text)('actor_email'),
    action: (0, pg_core_1.text)('action').notNull(),
    entityType: (0, pg_core_1.text)('entity_type'),
    entityId: (0, pg_core_1.text)('entity_id'),
    beforeState: (0, pg_core_1.jsonb)('before_state'),
    afterState: (0, pg_core_1.jsonb)('after_state'),
    ipAddress: (0, pg_core_1.text)('ip_address'),
    userAgent: (0, pg_core_1.text)('user_agent'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('audit_logs_actor_id_idx').on(t.actorId),
    (0, pg_core_1.index)('audit_logs_action_idx').on(t.action),
    (0, pg_core_1.index)('audit_logs_entity_idx').on(t.entityType, t.entityId),
    (0, pg_core_1.index)('audit_logs_created_at_idx').on(t.createdAt),
]; });
// ─── Action Logs ──────────────────────────────────────────────────────────────
// Gamification data — Faz 1'de kullanıcıya gösterilmez, sadece veri toplanır
exports.actionLogs = (0, pg_core_1.pgTable)('action_logs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    actionType: (0, pg_core_1.text)('action_type').notNull(),
    entityType: (0, pg_core_1.text)('entity_type'),
    entityId: (0, pg_core_1.text)('entity_id'),
    // Gelecekteki gamification sistemi için rezerve edilmiş alan
    scoreReserved: (0, pg_core_1.integer)('score_reserved').notNull().default(0),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('action_logs_user_id_idx').on(t.userId),
    (0, pg_core_1.index)('action_logs_action_type_idx').on(t.actionType),
    (0, pg_core_1.index)('action_logs_created_at_idx').on(t.createdAt),
]; });
// ─── Relations ────────────────────────────────────────────────────────────────
exports.actionLogsRelations = (0, drizzle_orm_1.relations)(exports.actionLogs, function (_a) {
    var one = _a.one;
    return ({
        user: one(users_1.users, { fields: [exports.actionLogs.userId], references: [users_1.users.id] }),
    });
});

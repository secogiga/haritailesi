"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userEngagementScores = exports.userLevelActions = exports.userEvents = exports.USER_EVENT_TYPES = exports.EVENT_ACTIONS = exports.EVENT_CATEGORIES = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var users_1 = require("./users");
// ─── Event Taxonomy ───────────────────────────────────────────────────────────
exports.EVENT_CATEGORIES = [
    'onboarding',
    'engagement',
    'mentorship',
    'content',
    'events',
    'community',
    'retention',
];
exports.EVENT_ACTIONS = [
    'started',
    'completed',
    'clicked',
    'viewed',
    'abandoned',
    'returned',
    'shared',
    'matched',
];
// Legacy flat event types — kept for backward compatibility
exports.USER_EVENT_TYPES = [
    'onboarding_started',
    'onboarding_step_completed',
    'aha_moment_triggered',
    'mentor_request_sent',
    'first_post_created',
    'first_event_joined',
    '7_day_return',
    '30_day_return',
];
// ─── user_events ─────────────────────────────────────────────────────────────
// Structured behavioral event log.
// category + action are the new taxonomy fields; event_type kept for legacy compat.
exports.userEvents = (0, pg_core_1.pgTable)('user_events', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    eventType: (0, pg_core_1.text)('event_type').notNull().$type(),
    category: (0, pg_core_1.text)('category').$type(),
    action: (0, pg_core_1.text)('action').$type(),
    metadata: (0, pg_core_1.jsonb)('metadata').$type(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('user_events_user_id_idx').on(t.userId),
    (0, pg_core_1.index)('user_events_type_idx').on(t.eventType),
    (0, pg_core_1.index)('user_events_created_at_idx').on(t.createdAt),
    (0, pg_core_1.index)('user_events_user_type_idx').on(t.userId, t.eventType),
    (0, pg_core_1.index)('user_events_category_action_idx').on(t.category, t.action),
]; });
// ─── user_level_actions ───────────────────────────────────────────────────────
// Kademe sistemi: kullanıcının tamamladığı aksiyon ID'leri.
// Her (userId, actionId) çifti tektir; çakışmada sessizce görmezden gelinir.
exports.userLevelActions = (0, pg_core_1.pgTable)('user_level_actions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    actionId: (0, pg_core_1.text)('action_id').notNull(),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('user_level_actions_user_action_unique').on(t.userId, t.actionId),
    (0, pg_core_1.index)('user_level_actions_user_id_idx').on(t.userId),
    (0, pg_core_1.index)('user_level_actions_action_id_idx').on(t.actionId),
]; });
// ─── user_engagement_scores ───────────────────────────────────────────────────
// Per-user behavioral intelligence scores. Upserted by the batch-event endpoint.
exports.userEngagementScores = (0, pg_core_1.pgTable)('user_engagement_scores', {
    userId: (0, pg_core_1.uuid)('user_id').primaryKey().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    ahaScore: (0, pg_core_1.integer)('aha_score').notNull().default(0),
    engagementScore: (0, pg_core_1.integer)('engagement_score').notNull().default(0),
    contributionScore: (0, pg_core_1.integer)('contribution_score').notNull().default(0),
    retentionRiskScore: (0, pg_core_1.integer)('retention_risk_score').notNull().default(0),
    ahaReached: (0, pg_core_1.boolean)('aha_reached').notNull().default(false),
    lastComputedAt: (0, pg_core_1.timestamp)('last_computed_at', { withTimezone: true }).notNull().defaultNow(),
});

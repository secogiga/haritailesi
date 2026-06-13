"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminBroadcastsRelations = exports.adminBroadcasts = exports.mentorApplicationsRelations = exports.mentorApplications = exports.feedbackStatusHistoryRelations = exports.feedbackStatusHistory = exports.ticketEmbeddings = exports.feedbackReportsRelations = exports.feedbackReports = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var enums_1 = require("./enums");
var users_1 = require("./users");
var mentorship_1 = require("./mentorship");
// ─── Feedback / Görüş & Talep ─────────────────────────────────────────────────
exports.feedbackReports = (0, pg_core_1.pgTable)('feedback_reports', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    ticketNo: (0, pg_core_1.serial)('ticket_no').notNull(),
    userId: (0, pg_core_1.uuid)('user_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    email: (0, pg_core_1.text)('email'),
    name: (0, pg_core_1.text)('name'),
    phone: (0, pg_core_1.text)('phone'),
    isAnonymous: (0, pg_core_1.boolean)('is_anonymous').notNull().default(false),
    subject: (0, pg_core_1.text)('subject').notNull(),
    body: (0, pg_core_1.text)('body').notNull(),
    type: (0, enums_1.feedbackTypeEnum)('type').notNull().default('gorus'),
    source: (0, enums_1.feedbackSourceEnum)('source').notNull(),
    status: (0, enums_1.feedbackStatusEnum)('status').notNull().default('open'),
    adminNotes: (0, pg_core_1.text)('admin_notes'),
    adminReply: (0, pg_core_1.text)('admin_reply'),
    urgency: (0, pg_core_1.text)('urgency'),
    subCategory: (0, pg_core_1.text)('sub_category'),
    expectation: (0, pg_core_1.text)('expectation'),
    userType: (0, pg_core_1.text)('user_type'),
    assignedTo: (0, pg_core_1.text)('assigned_to'),
    attachmentUrls: (0, pg_core_1.text)('attachment_urls'),
    satisfactionScore: (0, pg_core_1.integer)('satisfaction_score'),
    aiSummary: (0, pg_core_1.text)('ai_summary'),
    routingActions: (0, pg_core_1.text)('routing_actions'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: (0, pg_core_1.timestamp)('resolved_at', { withTimezone: true }),
});
exports.feedbackReportsRelations = (0, drizzle_orm_1.relations)(exports.feedbackReports, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        user: one(users_1.users, { fields: [exports.feedbackReports.userId], references: [users_1.users.id] }),
        statusHistory: many(exports.feedbackStatusHistory),
    });
});
// ─── Ticket Embeddings (Voyage AI semantic similarity) ───────────────────────
exports.ticketEmbeddings = (0, pg_core_1.pgTable)('ticket_embeddings', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    ticketId: (0, pg_core_1.uuid)('ticket_id').notNull().references(function () { return exports.feedbackReports.id; }, { onDelete: 'cascade' }),
    category: (0, pg_core_1.text)('category').notNull(),
    embedding: (0, pg_core_1.text)('embedding').notNull(), // JSON array of floats (voyage-multilingual-2 → 1024 dim)
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [(0, pg_core_1.index)('ticket_embeddings_ticket_idx').on(t.ticketId)]; });
// ─── Feedback Audit Log ────────────────────────────────────────────────────────
exports.feedbackStatusHistory = (0, pg_core_1.pgTable)('feedback_status_history', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    feedbackId: (0, pg_core_1.uuid)('feedback_id').notNull().references(function () { return exports.feedbackReports.id; }, { onDelete: 'cascade' }),
    fromStatus: (0, pg_core_1.text)('from_status'),
    toStatus: (0, pg_core_1.text)('to_status').notNull(),
    changedBy: (0, pg_core_1.text)('changed_by'),
    adminNotes: (0, pg_core_1.text)('admin_notes'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [(0, pg_core_1.index)('feedback_status_history_feedback_idx').on(t.feedbackId)]; });
exports.feedbackStatusHistoryRelations = (0, drizzle_orm_1.relations)(exports.feedbackStatusHistory, function (_a) {
    var one = _a.one;
    return ({
        feedback: one(exports.feedbackReports, { fields: [exports.feedbackStatusHistory.feedbackId], references: [exports.feedbackReports.id] }),
    });
});
// ─── Mentor / Mentee Başvuruları ──────────────────────────────────────────────
exports.mentorApplications = (0, pg_core_1.pgTable)('mentor_applications', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    email: (0, pg_core_1.text)('email').notNull(),
    displayName: (0, pg_core_1.text)('display_name').notNull(),
    type: (0, enums_1.mentorApplicationTypeEnum)('type').notNull(),
    source: (0, enums_1.feedbackSourceEnum)('source').notNull().default('mutfak'),
    expertise: (0, pg_core_1.text)('expertise'),
    goals: (0, pg_core_1.text)('goals'),
    preferredFormat: (0, pg_core_1.text)('preferred_format').default('online'),
    status: (0, enums_1.mentorApplicationStatusEnum)('status').notNull().default('pending'),
    adminNotes: (0, pg_core_1.text)('admin_notes'),
    matchedRequestId: (0, pg_core_1.uuid)('matched_request_id').references(function () { return mentorship_1.mentorshipRequests.id; }, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: (0, pg_core_1.timestamp)('reviewed_at', { withTimezone: true }),
});
exports.mentorApplicationsRelations = (0, drizzle_orm_1.relations)(exports.mentorApplications, function (_a) {
    var one = _a.one;
    return ({
        user: one(users_1.users, { fields: [exports.mentorApplications.userId], references: [users_1.users.id] }),
        matchedRequest: one(mentorship_1.mentorshipRequests, { fields: [exports.mentorApplications.matchedRequestId], references: [mentorship_1.mentorshipRequests.id] }),
    });
});
// ─── Admin Broadcasts ─────────────────────────────────────────────────────────
exports.adminBroadcasts = (0, pg_core_1.pgTable)('admin_broadcasts', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    adminId: (0, pg_core_1.uuid)('admin_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    target: (0, pg_core_1.text)('target').notNull(), // 'user' | 'tier' | 'all'
    targetTier: (0, pg_core_1.text)('target_tier'),
    targetUserId: (0, pg_core_1.uuid)('target_user_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    subject: (0, pg_core_1.text)('subject').notNull(),
    body: (0, pg_core_1.text)('body').notNull(),
    sentCount: (0, pg_core_1.integer)('sent_count').notNull().default(0),
    sentEmail: (0, pg_core_1.boolean)('sent_email').notNull().default(false),
    sentNotification: (0, pg_core_1.boolean)('sent_notification').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
});
exports.adminBroadcastsRelations = (0, drizzle_orm_1.relations)(exports.adminBroadcasts, function (_a) {
    var one = _a.one;
    return ({
        admin: one(users_1.users, { fields: [exports.adminBroadcasts.adminId], references: [users_1.users.id] }),
    });
});

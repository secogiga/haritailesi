"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsletterAutomationLogsRelations = exports.newsletterAutomationsRelations = exports.newsletterAutomationLogs = exports.newsletterAutomations = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
// ─── Newsletter Automations ───────────────────────────────────────────────────
//
// triggerType values:
//   'welcome'          – fires on Brevo subscription webhook
//   'welcome_series'   – 3-step drip after subscription (day 0/3/7)
//   'member_approved'  – fires when an application is approved
//   'event_registered' – fires when user registers for an event
//   'inactivity_30d'   – fires when subscriber hasn't opened for 30 days
//
// status values: 'active' | 'paused' | 'archived'
exports.newsletterAutomations = (0, pg_core_1.pgTable)('newsletter_automations', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)('name').notNull(),
    description: (0, pg_core_1.text)('description'),
    triggerType: (0, pg_core_1.text)('trigger_type').notNull(),
    status: (0, pg_core_1.text)('status').notNull().default('active'),
    // JSON array of steps: [{ delayDays: 0, subject: '...', htmlBody: '...' }, ...]
    steps: (0, pg_core_1.jsonb)('steps').notNull().default('[]'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
// ─── Automation Logs ─────────────────────────────────────────────────────────
//
// One row per (automation, subscriber, step).
// status: 'queued' | 'sent' | 'failed' | 'skipped'
exports.newsletterAutomationLogs = (0, pg_core_1.pgTable)('newsletter_automation_logs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    automationId: (0, pg_core_1.uuid)('automation_id')
        .notNull()
        .references(function () { return exports.newsletterAutomations.id; }, { onDelete: 'cascade' }),
    subscriberEmail: (0, pg_core_1.text)('subscriber_email').notNull(),
    stepIndex: (0, pg_core_1.integer)('step_index').notNull().default(0),
    status: (0, pg_core_1.text)('status').notNull().default('queued'),
    scheduledAt: (0, pg_core_1.timestamp)('scheduled_at', { withTimezone: true }).notNull(),
    sentAt: (0, pg_core_1.timestamp)('sent_at', { withTimezone: true }),
    errorMessage: (0, pg_core_1.text)('error_message'),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
});
exports.newsletterAutomationsRelations = (0, drizzle_orm_1.relations)(exports.newsletterAutomations, function (_a) {
    var many = _a.many;
    return ({
        logs: many(exports.newsletterAutomationLogs),
    });
});
exports.newsletterAutomationLogsRelations = (0, drizzle_orm_1.relations)(exports.newsletterAutomationLogs, function (_a) {
    var one = _a.one;
    return ({
        automation: one(exports.newsletterAutomations, {
            fields: [exports.newsletterAutomationLogs.automationId],
            references: [exports.newsletterAutomations.id],
        }),
    });
});

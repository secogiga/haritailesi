import { pgTable, uuid, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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

export const newsletterAutomations = pgTable('newsletter_automations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  triggerType: text('trigger_type').notNull(),
  status: text('status').notNull().default('active'),
  // JSON array of steps: [{ delayDays: 0, subject: '...', htmlBody: '...' }, ...]
  steps: jsonb('steps').notNull().default('[]'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Automation Logs ─────────────────────────────────────────────────────────
//
// One row per (automation, subscriber, step).
// status: 'queued' | 'sent' | 'failed' | 'skipped'

export const newsletterAutomationLogs = pgTable('newsletter_automation_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  automationId: uuid('automation_id')
    .notNull()
    .references(() => newsletterAutomations.id, { onDelete: 'cascade' }),
  subscriberEmail: text('subscriber_email').notNull(),
  stepIndex: integer('step_index').notNull().default(0),
  status: text('status').notNull().default('queued'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const newsletterAutomationsRelations = relations(newsletterAutomations, ({ many }) => ({
  logs: many(newsletterAutomationLogs),
}));

export const newsletterAutomationLogsRelations = relations(newsletterAutomationLogs, ({ one }) => ({
  automation: one(newsletterAutomations, {
    fields: [newsletterAutomationLogs.automationId],
    references: [newsletterAutomations.id],
  }),
}));

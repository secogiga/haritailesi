import { boolean, pgTable, uuid, text, timestamp, integer, serial, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  feedbackTypeEnum,
  feedbackSourceEnum,
  feedbackStatusEnum,
  mentorApplicationTypeEnum,
  mentorApplicationStatusEnum,
} from './enums';
import { users } from './users';
import { mentorshipRequests } from './mentorship';

// ─── Feedback / Görüş & Talep ─────────────────────────────────────────────────

export const feedbackReports = pgTable('feedback_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketNo: serial('ticket_no').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  email: text('email'),
  name: text('name'),
  phone: text('phone'),
  isAnonymous: boolean('is_anonymous').notNull().default(false),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  type: feedbackTypeEnum('type').notNull().default('gorus'),
  source: feedbackSourceEnum('source').notNull(),
  status: feedbackStatusEnum('status').notNull().default('open'),
  adminNotes: text('admin_notes'),
  adminReply: text('admin_reply'),
  urgency: text('urgency'),
  subCategory: text('sub_category'),
  expectation: text('expectation'),
  userType: text('user_type'),
  assignedTo: text('assigned_to'),
  attachmentUrls: text('attachment_urls'),
  satisfactionScore: integer('satisfaction_score'),
  aiSummary: text('ai_summary'),
  routingActions: text('routing_actions'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

export const feedbackReportsRelations = relations(feedbackReports, ({ one, many }) => ({
  user: one(users, { fields: [feedbackReports.userId], references: [users.id] }),
  statusHistory: many(feedbackStatusHistory),
}));

// ─── Ticket Embeddings (Voyage AI semantic similarity) ───────────────────────

export const ticketEmbeddings = pgTable(
  'ticket_embeddings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id').notNull().references(() => feedbackReports.id, { onDelete: 'cascade' }),
    category: text('category').notNull(),
    embedding: text('embedding').notNull(), // JSON array of floats (voyage-multilingual-2 → 1024 dim)
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('ticket_embeddings_ticket_idx').on(t.ticketId)],
);

// ─── Feedback Audit Log ────────────────────────────────────────────────────────

export const feedbackStatusHistory = pgTable(
  'feedback_status_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    feedbackId: uuid('feedback_id').notNull().references(() => feedbackReports.id, { onDelete: 'cascade' }),
    fromStatus: text('from_status'),
    toStatus: text('to_status').notNull(),
    changedBy: text('changed_by'),
    adminNotes: text('admin_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('feedback_status_history_feedback_idx').on(t.feedbackId)],
);

export const feedbackStatusHistoryRelations = relations(feedbackStatusHistory, ({ one }) => ({
  feedback: one(feedbackReports, { fields: [feedbackStatusHistory.feedbackId], references: [feedbackReports.id] }),
}));

// ─── Mentor / Mentee Başvuruları ──────────────────────────────────────────────

export const mentorApplications = pgTable('mentor_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  type: mentorApplicationTypeEnum('type').notNull(),
  source: feedbackSourceEnum('source').notNull().default('mutfak'),
  expertise: text('expertise'),
  goals: text('goals'),
  preferredFormat: text('preferred_format').default('online'),
  status: mentorApplicationStatusEnum('status').notNull().default('pending'),
  adminNotes: text('admin_notes'),
  matchedRequestId: uuid('matched_request_id').references(() => mentorshipRequests.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
});

export const mentorApplicationsRelations = relations(mentorApplications, ({ one }) => ({
  user: one(users, { fields: [mentorApplications.userId], references: [users.id] }),
  matchedRequest: one(mentorshipRequests, { fields: [mentorApplications.matchedRequestId], references: [mentorshipRequests.id] }),
}));

// ─── Admin Broadcasts ─────────────────────────────────────────────────────────

export const adminBroadcasts = pgTable('admin_broadcasts', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').references(() => users.id, { onDelete: 'set null' }),
  target: text('target').notNull(), // 'user' | 'tier' | 'all'
  targetTier: text('target_tier'),
  targetUserId: uuid('target_user_id').references(() => users.id, { onDelete: 'set null' }),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  sentCount: integer('sent_count').notNull().default(0),
  sentEmail: boolean('sent_email').notNull().default(false),
  sentNotification: boolean('sent_notification').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const adminBroadcastsRelations = relations(adminBroadcasts, ({ one }) => ({
  admin: one(users, { fields: [adminBroadcasts.adminId], references: [users.id] }),
}));

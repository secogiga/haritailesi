import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';
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
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  email: text('email'),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  type: feedbackTypeEnum('type').notNull().default('gorus'),
  source: feedbackSourceEnum('source').notNull(),
  status: feedbackStatusEnum('status').notNull().default('open'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

export const feedbackReportsRelations = relations(feedbackReports, ({ one }) => ({
  user: one(users, { fields: [feedbackReports.userId], references: [users.id] }),
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

import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  contentRequestTypeEnum,
  contentRequestStatusEnum,
  jobTypeEnum,
  jobStatusEnum,
  feedbackSourceEnum,
} from './enums';
import { users } from './users';

// ─── Content Requests (Mağaza / Etkinlik / Eğitim / İlan talepleri) ───────────

export const contentRequests = pgTable(
  'content_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    source: feedbackSourceEnum('source').notNull().default('mutfak'),
    type: contentRequestTypeEnum('type').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    contactInfo: text('contact_info'),
    attachmentUrl: text('attachment_url'),
    status: contentRequestStatusEnum('status').notNull().default('pending'),
    adminNotes: text('admin_notes'),
    publishedContentId: uuid('published_content_id'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('content_requests_status_idx').on(t.status),
    index('content_requests_type_idx').on(t.type),
    index('content_requests_user_idx').on(t.userId),
  ],
);

export const contentRequestsRelations = relations(contentRequests, ({ one }) => ({
  user: one(users, { fields: [contentRequests.userId], references: [users.id] }),
  reviewer: one(users, { fields: [contentRequests.reviewedBy], references: [users.id] }),
}));

// ─── Job Listings (İlan Panosu) ───────────────────────────────────────────────

export const jobListings = pgTable(
  'job_listings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    company: text('company').notNull(),
    location: text('location'),
    type: jobTypeEnum('type').notNull().default('full_time'),
    description: text('description').notNull(),
    applyUrl: text('apply_url'),
    applyEmail: text('apply_email'),
    contactPhone: text('contact_phone'),
    price: text('price'),
    tags: text('tags').array().notNull().default([]),
    status: jobStatusEnum('status').notNull().default('draft'),
    source: text('source'),
    submittedBy: uuid('submitted_by').references(() => users.id, { onDelete: 'set null' }),
    contentRequestId: uuid('content_request_id').references(() => contentRequests.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('job_listings_status_idx').on(t.status),
    index('job_listings_type_idx').on(t.type),
  ],
);

export const jobListingsRelations = relations(jobListings, ({ one }) => ({
  submitter: one(users, { fields: [jobListings.submittedBy], references: [users.id] }),
  contentRequest: one(contentRequests, { fields: [jobListings.contentRequestId], references: [contentRequests.id] }),
}));

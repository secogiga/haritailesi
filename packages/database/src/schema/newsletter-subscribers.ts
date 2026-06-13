import { pgTable, text, timestamp, jsonb, boolean, integer, date, uuid } from 'drizzle-orm/pg-core';

// ─── Newsletter Subscriber Profiles ──────────────────────────────────────────
//
// Extended local profile keyed by email — supplements Brevo contact data.
// tags: string[] — free-form labels applied by admin (e.g. 'etkinlik', 'egitim')
// interestAreas: string[] — preference center selections
// source: 'web' | 'admin' | 'event' | 'import' | 'api'

export const newsletterSubscriberProfiles = pgTable('newsletter_subscriber_profiles', {
  email: text('email').primaryKey(),
  tags: jsonb('tags').notNull().default('[]'),
  interestAreas: jsonb('interest_areas').notNull().default('[]'),
  region: text('region'),
  source: text('source'),
  notes: text('notes'),
  isUnsubscribed: boolean('is_unsubscribed').notNull().default(false),
  isConfirmed: boolean('is_confirmed').notNull().default(true),
  confirmToken: uuid('confirm_token'),
  confirmTokenExpiry: timestamp('confirm_token_expiry', { withTimezone: true }),
  preferenceToken: text('preference_token'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Subscriber Tags ──────────────────────────────────────────────────────────
//
// Master list of available tags — admin-managed.

export const newsletterTags = pgTable('newsletter_tags', {
  slug: text('slug').primaryKey(),
  label: text('label').notNull(),
  color: text('color').notNull().default('#6b7280'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Subscriber Growth Snapshots ─────────────────────────────────────────────
//
// Günlük Brevo abone sayısı snapshot'ı.
// Cron her gece 23:55'te çekilir ve buraya kaydedilir.

export const newsletterGrowthSnapshots = pgTable('newsletter_growth_snapshots', {
  date: date('date').primaryKey(),
  count: integer('count').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsletterGrowthSnapshots = exports.newsletterTags = exports.newsletterSubscriberProfiles = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
// ─── Newsletter Subscriber Profiles ──────────────────────────────────────────
//
// Extended local profile keyed by email — supplements Brevo contact data.
// tags: string[] — free-form labels applied by admin (e.g. 'etkinlik', 'egitim')
// interestAreas: string[] — preference center selections
// source: 'web' | 'admin' | 'event' | 'import' | 'api'
exports.newsletterSubscriberProfiles = (0, pg_core_1.pgTable)('newsletter_subscriber_profiles', {
    email: (0, pg_core_1.text)('email').primaryKey(),
    tags: (0, pg_core_1.jsonb)('tags').notNull().default('[]'),
    interestAreas: (0, pg_core_1.jsonb)('interest_areas').notNull().default('[]'),
    region: (0, pg_core_1.text)('region'),
    source: (0, pg_core_1.text)('source'),
    notes: (0, pg_core_1.text)('notes'),
    isUnsubscribed: (0, pg_core_1.boolean)('is_unsubscribed').notNull().default(false),
    isConfirmed: (0, pg_core_1.boolean)('is_confirmed').notNull().default(true),
    confirmToken: (0, pg_core_1.uuid)('confirm_token'),
    confirmTokenExpiry: (0, pg_core_1.timestamp)('confirm_token_expiry', { withTimezone: true }),
    preferenceToken: (0, pg_core_1.text)('preference_token'),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
// ─── Subscriber Tags ──────────────────────────────────────────────────────────
//
// Master list of available tags — admin-managed.
exports.newsletterTags = (0, pg_core_1.pgTable)('newsletter_tags', {
    slug: (0, pg_core_1.text)('slug').primaryKey(),
    label: (0, pg_core_1.text)('label').notNull(),
    color: (0, pg_core_1.text)('color').notNull().default('#6b7280'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
});
// ─── Subscriber Growth Snapshots ─────────────────────────────────────────────
//
// Günlük Brevo abone sayısı snapshot'ı.
// Cron her gece 23:55'te çekilir ve buraya kaydedilir.
exports.newsletterGrowthSnapshots = (0, pg_core_1.pgTable)('newsletter_growth_snapshots', {
    date: (0, pg_core_1.date)('date').primaryKey(),
    count: (0, pg_core_1.integer)('count').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
});

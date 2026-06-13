"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clubEvents = exports.clubNews = exports.studentClubs = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var users_1 = require("./users");
// ─── Öğrenci Kulüpleri ────────────────────────────────────────────────────────
exports.studentClubs = (0, pg_core_1.pgTable)('student_clubs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)('name').notNull(),
    slug: (0, pg_core_1.text)('slug').notNull().unique(),
    university: (0, pg_core_1.text)('university').notNull(),
    city: (0, pg_core_1.text)('city').notNull(),
    contactName: (0, pg_core_1.text)('contact_name').notNull(),
    contactEmail: (0, pg_core_1.text)('contact_email').notNull(),
    contactPhone: (0, pg_core_1.text)('contact_phone'),
    website: (0, pg_core_1.text)('website'),
    memberCount: (0, pg_core_1.integer)('member_count').default(0),
    description: (0, pg_core_1.text)('description'),
    activities: (0, pg_core_1.text)('activities'),
    logoKey: (0, pg_core_1.text)('logo_key'),
    status: (0, pg_core_1.text)('status').notNull().default('pending'),
    adminNotes: (0, pg_core_1.text)('admin_notes'),
    representativeId: (0, pg_core_1.uuid)('representative_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    createdBy: (0, pg_core_1.uuid)('created_by').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('student_clubs_status_idx').on(t.status),
    (0, pg_core_1.index)('student_clubs_university_idx').on(t.university),
    (0, pg_core_1.index)('student_clubs_city_idx').on(t.city),
]; });
// ─── Kulüp Haberleri ──────────────────────────────────────────────────────────
exports.clubNews = (0, pg_core_1.pgTable)('club_news', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    clubId: (0, pg_core_1.uuid)('club_id').notNull().references(function () { return exports.studentClubs.id; }, { onDelete: 'cascade' }),
    title: (0, pg_core_1.text)('title').notNull(),
    summary: (0, pg_core_1.text)('summary'),
    body: (0, pg_core_1.text)('body'),
    isPublished: (0, pg_core_1.boolean)('is_published').notNull().default(true),
    publishedAt: (0, pg_core_1.timestamp)('published_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('club_news_club_id_idx').on(t.clubId),
    (0, pg_core_1.index)('club_news_published_at_idx').on(t.publishedAt),
]; });
// ─── Kulüp Etkinlikleri ───────────────────────────────────────────────────────
exports.clubEvents = (0, pg_core_1.pgTable)('club_events', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    clubId: (0, pg_core_1.uuid)('club_id').notNull().references(function () { return exports.studentClubs.id; }, { onDelete: 'cascade' }),
    title: (0, pg_core_1.text)('title').notNull(),
    description: (0, pg_core_1.text)('description'),
    eventDate: (0, pg_core_1.timestamp)('event_date', { withTimezone: true }).notNull(),
    location: (0, pg_core_1.text)('location'),
    registrationUrl: (0, pg_core_1.text)('registration_url'),
    isPublished: (0, pg_core_1.boolean)('is_published').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('club_events_club_id_idx').on(t.clubId),
    (0, pg_core_1.index)('club_events_event_date_idx').on(t.eventDate),
]; });

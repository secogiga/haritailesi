import { pgTable, uuid, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

// ─── Öğrenci Kulüpleri ────────────────────────────────────────────────────────

export const studentClubs = pgTable(
  'student_clubs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    university: text('university').notNull(),
    city: text('city').notNull(),
    contactName: text('contact_name').notNull(),
    contactEmail: text('contact_email').notNull(),
    contactPhone: text('contact_phone'),
    website: text('website'),
    memberCount: integer('member_count').default(0),
    description: text('description'),
    activities: text('activities'),
    logoKey: text('logo_key'),
    status: text('status').notNull().default('pending'),
    adminNotes: text('admin_notes'),
    representativeId: uuid('representative_id').references(() => users.id, { onDelete: 'set null' }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('student_clubs_status_idx').on(t.status),
    index('student_clubs_university_idx').on(t.university),
    index('student_clubs_city_idx').on(t.city),
  ],
);

// ─── Kulüp Haberleri ──────────────────────────────────────────────────────────

export const clubNews = pgTable(
  'club_news',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clubId: uuid('club_id').notNull().references(() => studentClubs.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    summary: text('summary'),
    body: text('body'),
    isPublished: boolean('is_published').notNull().default(true),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('club_news_club_id_idx').on(t.clubId),
    index('club_news_published_at_idx').on(t.publishedAt),
  ],
);

// ─── Kulüp Etkinlikleri ───────────────────────────────────────────────────────

export const clubEvents = pgTable(
  'club_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clubId: uuid('club_id').notNull().references(() => studentClubs.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    eventDate: timestamp('event_date', { withTimezone: true }).notNull(),
    location: text('location'),
    registrationUrl: text('registration_url'),
    isPublished: boolean('is_published').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('club_events_club_id_idx').on(t.clubId),
    index('club_events_event_date_idx').on(t.eventDate),
  ],
);

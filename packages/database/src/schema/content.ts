import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  index,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core';
import { projectStatusEnum } from './enums';
import { users } from './users';

// ─── Site Settings ─────────────────────────────────────────────────────────────
// Key-value store for CMS-managed site configuration (JSON values as text)

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull().default('{}'),
  label: text('label'),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Pages ─────────────────────────────────────────────────────────────────────
// Slug-addressed static content: hakkimizda, iletisim, mg-program, mg-sartlar…

export const pages = pgTable(
  'pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    body: text('body'),
    metaDescription: text('meta_description'),
    isPublished: boolean('is_published').notNull().default(false),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('pages_slug_idx').on(t.slug)],
);

// ─── Board Members ─────────────────────────────────────────────────────────────

export const boardMembers = pgTable('board_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  title: text('title').notNull(),
  bio: text('bio'),
  photoKey: text('photo_key'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Events ────────────────────────────────────────────────────────────────────

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    type: text('type').notNull().default('diger'),
    dateStart: timestamp('date_start', { withTimezone: true }).notNull(),
    dateEnd: timestamp('date_end', { withTimezone: true }),
    location: text('location'),
    description: text('description'),
    body: text('body'),
    registrationUrl: text('registration_url'),
    meetingUrl: text('meeting_url'),
    maxCapacity: integer('max_capacity'),
    isCancelled: boolean('is_cancelled').notNull().default(false),
    viewCount: integer('view_count').notNull().default(0),
    coverImageKey: text('cover_image_key'),
    isPublished: boolean('is_published').notNull().default(false),
    source: text('source'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('events_slug_idx').on(t.slug),
    index('events_date_start_idx').on(t.dateStart),
    index('events_type_idx').on(t.type),
  ],
);

// ─── Event Attendances ─────────────────────────────────────────────────────────
// Tracks which authenticated users clicked "join" on an online event.
// Populated when Mutfak has an events page; ready for gamification now.

export const eventAttendances = pgTable(
  'event_attendances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    firstJoinedAt: timestamp('first_joined_at', { withTimezone: true }).notNull().defaultNow(),
    joinCount: integer('join_count').notNull().default(1),
  },
  (t) => [uniqueIndex('event_attendances_event_user_idx').on(t.eventId, t.userId)],
);

// ─── Projects ──────────────────────────────────────────────────────────────────

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    summary: text('summary'),
    body: text('body'),
    status: projectStatusEnum('status').notNull().default('active'),
    coverImageKey: text('cover_image_key'),
    viewCount: integer('view_count').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(false),
    // Proje tipi: 'sahne' (detaylı içerik) | 'linkedin' (dış link kartı)
    type: text('type').notNull().default('sahne'),
    // Proje sahibi bilgileri
    authorName: text('author_name'),
    authorInitials: text('author_initials'),
    authorAvatarColor: text('author_avatar_color'),
    authorTag: text('author_tag'),
    authorTagColor: text('author_tag_color'),
    accentGradient: text('accent_gradient'),
    // LinkedIn tipi için
    linkedinUrl: text('linkedin_url'),
    // Sahne tipi için ek alanlar
    hashtags: text('hashtags').array(),
    externalLinks: jsonb('external_links').$type<Array<{ label: string; href: string }>>(),
    imageKeys: text('image_keys').array(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('projects_slug_idx').on(t.slug),
    index('projects_status_idx').on(t.status),
    index('projects_type_idx').on(t.type),
  ],
);

// ─── Talents ───────────────────────────────────────────────────────────────────

export const talents = pgTable(
  'talents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    displayName: text('display_name').notNull(),
    category: text('category').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    mediaUrl: text('media_url'),
    // pending | approved | rejected
    status: text('status').notNull().default('pending'),
    adminNotes: text('admin_notes'),
    isPublished: boolean('is_published').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('talents_status_idx').on(t.status),
    index('talents_category_idx').on(t.category),
    index('talents_user_id_idx').on(t.userId),
  ],
);


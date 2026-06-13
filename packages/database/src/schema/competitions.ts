import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// ─── Competitions (Yarışmalar) ────────────────────────────────────────────────

export const competitions = pgTable(
  'competitions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    posterKey: text('poster_key'),              // MinIO key for poster image
    deadline: timestamp('deadline', { withTimezone: true }),
    prizes: text('prizes'),                     // free-text prize description
    category: text('category'),                 // e.g. 'foto', 'proje', 'makale'
    status: text('status').notNull().default('draft'), // draft|active|ended
    winnersText: text('winners_text'),
    applicationCount: text('application_count').default('0'), // cached, updated by trigger or service
    viewCount: integer('view_count').notNull().default(0),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('competitions_status_idx').on(t.status),
    index('competitions_slug_idx').on(t.slug),
    index('competitions_deadline_idx').on(t.deadline),
  ],
);

export const competitionApplications = pgTable(
  'competition_applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    competitionId: uuid('competition_id').notNull().references(() => competitions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    notes: text('notes'),
    fileKey: text('file_key'),   // MinIO key for uploaded submission file
    fileName: text('file_name'), // original filename shown in admin
    source: text('source').notNull().default('sahne'), // sahne|mutfak
    status: text('status').notNull().default('received'), // received|shortlisted|winner|rejected
    juryScore: integer('jury_score'),
    juryNotes: text('jury_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('comp_apps_competition_idx').on(t.competitionId),
    index('comp_apps_user_idx').on(t.userId),
    index('comp_apps_status_idx').on(t.status),
  ],
);

export const competitionsRelations = relations(competitions, ({ one, many }) => ({
  createdBy: one(users, { fields: [competitions.createdBy], references: [users.id] }),
  applications: many(competitionApplications),
}));

export const competitionApplicationsRelations = relations(competitionApplications, ({ one }) => ({
  competition: one(competitions, { fields: [competitionApplications.competitionId], references: [competitions.id] }),
  user: one(users, { fields: [competitionApplications.userId], references: [users.id] }),
}));

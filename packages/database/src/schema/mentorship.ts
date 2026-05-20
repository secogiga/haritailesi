import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// ─── Mentor Profiles ──────────────────────────────────────────────────────────

export const mentorProfiles = pgTable(
  'mentor_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expertiseAreas: text('expertise_areas').array().notNull().default([]),
    bio: text('bio'),
    // 'online' | 'in_person' | 'both'
    sessionFormat: text('session_format').notNull().default('online'),
    city: text('city'),
    // Seans süresi tercihi (dk) — 40-60 aralığı
    sessionDurationMin: integer('session_duration_min').notNull().default(40),
    sessionDurationMax: integer('session_duration_max').notNull().default(60),
    // Kapasite türü: 'monthly' | 'periodic' | 'both'
    capacityType: text('capacity_type').notNull().default('monthly'),
    monthlyCapacity: integer('monthly_capacity').notNull().default(2),
    // Eş zamanlı dönemlik program kapasitesi
    periodicCapacity: integer('periodic_capacity').notNull().default(1),
    isAcceptingRequests: boolean('is_accepting_requests').notNull().default(true),
    completedSessionCount: integer('completed_session_count').notNull().default(0),
    // Admin onay akışı: 'pending' | 'approved' | 'rejected'
    adminStatus: text('admin_status').notNull().default('pending'),
    adminNote: text('admin_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('mentor_profiles_user_id_unique').on(t.userId),
    index('mentor_profiles_accepting_idx').on(t.isAcceptingRequests),
    index('mentor_profiles_admin_status_idx').on(t.adminStatus),
    index('mentor_profiles_capacity_type_idx').on(t.capacityType),
  ],
);

// ─── Mentee Applications ──────────────────────────────────────────────────────
// Mentörlük almak isteyen kişilerin admin havuzuna düşen başvuruları.

export const menteeApplications = pgTable(
  'mentee_applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    topic: text('topic').notNull(),
    goal: text('goal').notNull(),
    // 'online' | 'in_person' | 'both'
    preferredFormat: text('preferred_format').notNull().default('online'),
    // 'single_session' | 'periodic'
    engagementType: text('engagement_type').notNull().default('single_session'),
    // 'sahne' | 'mutfak' | 'kutu'
    source: text('source').notNull().default('mutfak'),
    // 'pending' | 'approved' | 'matched' | 'rejected'
    status: text('status').notNull().default('pending'),
    adminNote: text('admin_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('mentee_applications_status_idx').on(t.status),
    index('mentee_applications_user_idx').on(t.userId),
    index('mentee_applications_type_idx').on(t.engagementType),
  ],
);

// ─── Mentorship Engagements ───────────────────────────────────────────────────
// Her eşleşme bir "engagement"dır. İçinde 1 veya 4 session barındırır.
// status: pending → accepted | rejected | cancelled
//         accepted → completed | cancelled
//
// engagementType:
//   'single_session' — 1 oturum, belirli bir konu/soru
//   'periodic'       — 4 ay, ayda 1 oturum (toplam 4 session)

export const mentorshipRequests = pgTable(
  'mentorship_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    menteeId: uuid('mentee_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    mentorId: uuid('mentor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    topic: text('topic').notNull(),
    goal: text('goal').notNull(),
    // 'online' | 'in_person'
    preferredFormat: text('preferred_format').notNull().default('online'),
    // 'single_session' | 'periodic'
    engagementType: text('engagement_type').notNull().default('single_session'),
    // Dönemlik için süre (ay) — genellikle 4
    periodMonths: integer('period_months'),
    // 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
    status: text('status').notNull().default('pending'),
    mentorNote: text('mentor_note'),
    // 'mentee' | 'admin'
    initiatedBy: text('initiated_by').notNull().default('mentee'),
    menteeApplicationId: uuid('mentee_application_id').references(() => menteeApplications.id, { onDelete: 'set null' }),

    // Dönem sonu değerlendirmesi (periodic engagements için)
    menteeFinalRating: integer('mentee_final_rating'),
    menteeFinalComment: text('mentee_final_comment'),
    mentorFinalComment: text('mentor_final_comment'),

    // Eski single-session alanları (geriye uyumluluk + direct requests için)
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    proposedScheduledAt: timestamp('proposed_scheduled_at', { withTimezone: true }),
    rescheduleNote: text('reschedule_note'),
    rating: integer('rating'),
    feedbackComment: text('feedback_comment'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('mentorship_requests_mentee_idx').on(t.menteeId),
    index('mentorship_requests_mentor_idx').on(t.mentorId),
    index('mentorship_requests_status_idx').on(t.status),
    index('mentorship_requests_type_idx').on(t.engagementType),
  ],
);

// ─── Mentorship Sessions ──────────────────────────────────────────────────────
// Her engagement'a bağlı bireysel oturumlar.
// single_session → 1 session, periodic → 4 session (otomatik oluşturulur)
//
// status: 'pending'   — tarih bekleniyor (mentor ayarlayacak)
//         'scheduled' — tarih mentör tarafından belirlendi
//         'completed' — oturum tamamlandı
//         'cancelled' — iptal edildi

export const mentorshipSessions = pgTable(
  'mentorship_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    engagementId: uuid('engagement_id')
      .notNull()
      .references(() => mentorshipRequests.id, { onDelete: 'cascade' }),
    sessionNumber: integer('session_number').notNull(), // 1-tabanlı
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    status: text('status').notNull().default('pending'),
    actualDurationMinutes: integer('actual_duration_minutes'),
    // Oturum sonrası notlar
    menteeNote: text('mentee_note'),
    menteeRating: integer('mentee_rating'),
    mentorNote: text('mentor_note'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('mentorship_sessions_engagement_idx').on(t.engagementId),
    index('mentorship_sessions_status_idx').on(t.status),
    index('mentorship_sessions_scheduled_idx').on(t.scheduledAt),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const mentorProfilesRelations = relations(mentorProfiles, ({ one }) => ({
  user: one(users, { fields: [mentorProfiles.userId], references: [users.id] }),
}));

export const mentorshipRequestsRelations = relations(mentorshipRequests, ({ one, many }) => ({
  mentee: one(users, { fields: [mentorshipRequests.menteeId], references: [users.id], relationName: 'menteeRequests' }),
  mentor: one(users, { fields: [mentorshipRequests.mentorId], references: [users.id], relationName: 'mentorRequests' }),
  menteeApplication: one(menteeApplications, { fields: [mentorshipRequests.menteeApplicationId], references: [menteeApplications.id] }),
  sessions: many(mentorshipSessions),
}));

export const mentorshipSessionsRelations = relations(mentorshipSessions, ({ one }) => ({
  engagement: one(mentorshipRequests, { fields: [mentorshipSessions.engagementId], references: [mentorshipRequests.id] }),
}));

export const menteeApplicationsRelations = relations(menteeApplications, ({ one }) => ({
  user: one(users, { fields: [menteeApplications.userId], references: [users.id] }),
}));

import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// ─── Meeting Sessions ─────────────────────────────────────────────────────────
// Mentorship / etkinlik / eğitim buluşmalarının video oturum kaydı.
// reference_type: 'mentorship' | 'event' | 'training'
// room_name: 'hrtl-{type}-{referenceId}' — tahmin edilemez, güvenlik bu.

export const meetingSessions = pgTable(
  'meeting_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    referenceType: text('reference_type').notNull(),
    referenceId: uuid('reference_id').notNull(),
    roomName: text('room_name').notNull(),
    hostUserId: uuid('host_user_id').references(() => users.id, { onDelete: 'set null' }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('meeting_sessions_room_name_unique').on(t.roomName),
    index('meeting_sessions_reference_idx').on(t.referenceType, t.referenceId),
  ],
);

// ─── Meeting Participants ─────────────────────────────────────────────────────
// Jitsi IFrame API'sinden gelen join/leave event'ları burada tutulur.
// Bir kullanıcı ayrılıp yeniden girerse row güncellenir (joined_at reset).

export const meetingParticipants = pgTable(
  'meeting_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => meetingSessions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    leftAt: timestamp('left_at', { withTimezone: true }),
    durationSeconds: integer('duration_seconds'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('meeting_participants_session_user_unique').on(t.sessionId, t.userId),
    index('meeting_participants_session_idx').on(t.sessionId),
    index('meeting_participants_user_idx').on(t.userId),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const meetingSessionsRelations = relations(meetingSessions, ({ one, many }) => ({
  host: one(users, { fields: [meetingSessions.hostUserId], references: [users.id] }),
  participants: many(meetingParticipants),
}));

export const meetingParticipantsRelations = relations(meetingParticipants, ({ one }) => ({
  session: one(meetingSessions, { fields: [meetingParticipants.sessionId], references: [meetingSessions.id] }),
  user: one(users, { fields: [meetingParticipants.userId], references: [users.id] }),
}));

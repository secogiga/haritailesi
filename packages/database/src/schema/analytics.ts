import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users';

// ─── Event Taxonomy ───────────────────────────────────────────────────────────

export const EVENT_CATEGORIES = [
  'onboarding',
  'engagement',
  'mentorship',
  'content',
  'events',
  'community',
  'retention',
] as const;

export const EVENT_ACTIONS = [
  'started',
  'completed',
  'clicked',
  'viewed',
  'abandoned',
  'returned',
  'shared',
  'matched',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export type EventAction   = (typeof EVENT_ACTIONS)[number];

// Legacy flat event types — kept for backward compatibility
export const USER_EVENT_TYPES = [
  'onboarding_started',
  'onboarding_step_completed',
  'aha_moment_triggered',
  'mentor_request_sent',
  'first_post_created',
  'first_event_joined',
  '7_day_return',
  '30_day_return',
] as const;

export type UserEventType = (typeof USER_EVENT_TYPES)[number];

// ─── user_events ─────────────────────────────────────────────────────────────
// Structured behavioral event log.
// category + action are the new taxonomy fields; event_type kept for legacy compat.

export const userEvents = pgTable(
  'user_events',
  {
    id:        uuid('id').primaryKey().defaultRandom(),
    userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull().$type<UserEventType | string>(),
    category:  text('category').$type<EventCategory>(),
    action:    text('action').$type<EventAction>(),
    metadata:  jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('user_events_user_id_idx').on(t.userId),
    index('user_events_type_idx').on(t.eventType),
    index('user_events_created_at_idx').on(t.createdAt),
    index('user_events_user_type_idx').on(t.userId, t.eventType),
    index('user_events_category_action_idx').on(t.category, t.action),
  ],
);

// ─── user_engagement_scores ───────────────────────────────────────────────────
// Per-user behavioral intelligence scores. Upserted by the batch-event endpoint.

export const userEngagementScores = pgTable('user_engagement_scores', {
  userId:             uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  ahaScore:           integer('aha_score').notNull().default(0),
  engagementScore:    integer('engagement_score').notNull().default(0),
  contributionScore:  integer('contribution_score').notNull().default(0),
  retentionRiskScore: integer('retention_risk_score').notNull().default(0),
  ahaReached:         boolean('aha_reached').notNull().default(false),
  lastComputedAt:     timestamp('last_computed_at', { withTimezone: true }).notNull().defaultNow(),
});

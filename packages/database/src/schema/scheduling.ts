import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { applications } from './applications';
import { mentorshipRequests } from './mentorship';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const slotTypeEnum = pgEnum('slot_type', ['membership', 'mentorship']);

export const interviewRequestStateEnum = pgEnum('interview_request_state', [
  'pending',
  'confirmed',
  'cancelled',
  'rescheduled',
]);

// ─── Availability Slots ───────────────────────────────────────────────────────
// Admin'in müsait olduğu zaman dilimleri.
// slotType: 'membership' üyelik görüşmeleri, 'mentorship' mentorluk seansları için.

export const availabilitySlots = pgTable(
  'availability_slots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    adminId: uuid('admin_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }).notNull(),
    slotType: slotTypeEnum('slot_type').notNull().default('membership'),
    // Kaç kişiyle görüşülebilir (mentorship için genellikle 1)
    capacity: integer('capacity').notNull().default(1),
    bookedCount: integer('booked_count').notNull().default(0),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('availability_slots_admin_idx').on(t.adminId),
    index('availability_slots_type_start_idx').on(t.slotType, t.startAt),
  ],
);

// ─── Interview Requests ────────────────────────────────────────────────────────
// Üyelik görüşmesi veya mentorluk seansı talebi.
// referenceType + referenceId ile hangi varlığa bağlı olduğu tutulur.

export const interviewRequests = pgTable(
  'interview_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slotId: uuid('slot_id')
      .references(() => availabilitySlots.id, { onDelete: 'restrict' }),
    applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'cascade' }),
    // Mentörlük bağlantısı (referenceType = 'mentorship' olduğunda kullanılır)
    mentorshipRequestId: uuid('mentorship_request_id').references(() => mentorshipRequests.id, { onDelete: 'cascade' }),
    // 'membership' veya 'mentorship' — hangi akış için oluşturuldu
    referenceType: text('reference_type').notNull().default('membership'),
    state: interviewRequestStateEnum('state').notNull().default('pending'),
    // Güvenli tek kullanımlık token — adayın email'inde gönderilen onay/iptal linki için
    confirmToken: uuid('confirm_token').notNull().defaultRandom(),
    // Token geçerlilik süresi (7 gün)
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }).notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    rescheduleNote: text('reschedule_note'),
    // Admin'in eklediği görüşme bağlantısı (Meet/Zoom/Teams)
    meetUrl: text('meet_url'),
    // Admin'in görüşmeyi oluşturan kişisi (bildirim için)
    createdByAdminId: uuid('created_by_admin_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('interview_requests_application_idx').on(t.applicationId),
    index('interview_requests_slot_idx').on(t.slotId),
    index('interview_requests_token_idx').on(t.confirmToken),
    index('interview_requests_state_idx').on(t.state),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const availabilitySlotsRelations = relations(availabilitySlots, ({ one, many }) => ({
  admin: one(users, { fields: [availabilitySlots.adminId], references: [users.id] }),
  interviewRequests: many(interviewRequests),
}));

export const interviewRequestsRelations = relations(interviewRequests, ({ one }) => ({
  slot: one(availabilitySlots, { fields: [interviewRequests.slotId], references: [availabilitySlots.id] }),
  application: one(applications, { fields: [interviewRequests.applicationId], references: [applications.id] }),
  mentorshipRequest: one(mentorshipRequests, { fields: [interviewRequests.mentorshipRequestId], references: [mentorshipRequests.id] }),
  createdByAdmin: one(users, { fields: [interviewRequests.createdByAdminId], references: [users.id] }),
}));

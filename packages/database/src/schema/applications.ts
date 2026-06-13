import { pgTable, uuid, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { applicationTypeEnum, applicationPaymentStatusEnum } from './enums';
import { users } from './users';

// ─── Applications ─────────────────────────────────────────────────────────────
// form_data = JSONB — tüm form alanlarını saklar, şema migrasyonsuz gelişebilir

export const applications = pgTable(
  'applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: applicationTypeEnum('type').notNull(),
    applicantEmail: text('applicant_email').notNull(),
    // Onaylanınca bağlanır, başvuru sırasında user olmayabilir
    applicantUserId: uuid('applicant_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    state: text('state').notNull(),
    formData: jsonb('form_data').notNull().default({}),
    adminNotes: text('admin_notes'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    // Ödeme son tarihi — approved → waiting_payment geçişinde otomatik set edilir
    paymentDueAt: timestamp('payment_due_at', { withTimezone: true }),
    // Ödeme durumu — lifecycle state'ten bağımsız ödeme yaşam döngüsü
    paymentStatus: applicationPaymentStatusEnum('payment_status'),
    // Ödeme tutarı (kuruş) — waiting_payment → waiting_verification geçişinde set edilir
    paymentAmountKurus: integer('payment_amount_kurus'),
    // Ödeme açıklaması — serbest metin (kasa transferi referansı vb.)
    paymentDescription: text('payment_description'),
    // Hatırlatma sayacı ve son hatırlatma zamanı — cooldown + istatistik için
    reminderCount: integer('reminder_count').notNull().default(0),
    lastReminderAt: timestamp('last_reminder_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('applications_type_state_idx').on(t.type, t.state),
    index('applications_applicant_email_idx').on(t.applicantEmail),
    index('applications_applicant_user_id_idx').on(t.applicantUserId),
    index('applications_created_at_idx').on(t.createdAt),
  ],
);

// ─── Application State Logs ────────────────────────────────────────────────────
// Her state geçişi burada kayıt altına alınır — state machine audit trail

export const applicationStateLogs = pgTable(
  'application_state_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    fromState: text('from_state'),
    toState: text('to_state').notNull(),
    triggeredBy: uuid('triggered_by').references(() => users.id, { onDelete: 'set null' }),
    reason: text('reason'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('application_state_logs_application_id_idx').on(t.applicationId)],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  applicantUser: one(users, {
    fields: [applications.applicantUserId],
    references: [users.id],
  }),
  stateLogs: many(applicationStateLogs),
}));

export const applicationStateLogsRelations = relations(applicationStateLogs, ({ one }) => ({
  application: one(applications, {
    fields: [applicationStateLogs.applicationId],
    references: [applications.id],
  }),
}));

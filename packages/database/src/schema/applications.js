"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationStateLogsRelations = exports.applicationsRelations = exports.applicationStateLogs = exports.applications = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var enums_1 = require("./enums");
var users_1 = require("./users");
// ─── Applications ─────────────────────────────────────────────────────────────
// form_data = JSONB — tüm form alanlarını saklar, şema migrasyonsuz gelişebilir
exports.applications = (0, pg_core_1.pgTable)('applications', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    type: (0, enums_1.applicationTypeEnum)('type').notNull(),
    applicantEmail: (0, pg_core_1.text)('applicant_email').notNull(),
    // Onaylanınca bağlanır, başvuru sırasında user olmayabilir
    applicantUserId: (0, pg_core_1.uuid)('applicant_user_id').references(function () { return users_1.users.id; }, {
        onDelete: 'set null',
    }),
    state: (0, pg_core_1.text)('state').notNull(),
    formData: (0, pg_core_1.jsonb)('form_data').notNull().default({}),
    adminNotes: (0, pg_core_1.text)('admin_notes'),
    reviewedBy: (0, pg_core_1.uuid)('reviewed_by').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    // Ödeme son tarihi — approved → waiting_payment geçişinde otomatik set edilir
    paymentDueAt: (0, pg_core_1.timestamp)('payment_due_at', { withTimezone: true }),
    // Ödeme durumu — lifecycle state'ten bağımsız ödeme yaşam döngüsü
    paymentStatus: (0, enums_1.applicationPaymentStatusEnum)('payment_status'),
    // Ödeme tutarı (kuruş) — waiting_payment → waiting_verification geçişinde set edilir
    paymentAmountKurus: (0, pg_core_1.integer)('payment_amount_kurus'),
    // Ödeme açıklaması — serbest metin (kasa transferi referansı vb.)
    paymentDescription: (0, pg_core_1.text)('payment_description'),
    // Hatırlatma sayacı ve son hatırlatma zamanı — cooldown + istatistik için
    reminderCount: (0, pg_core_1.integer)('reminder_count').notNull().default(0),
    lastReminderAt: (0, pg_core_1.timestamp)('last_reminder_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at', { withTimezone: true }),
}, function (t) { return [
    (0, pg_core_1.index)('applications_type_state_idx').on(t.type, t.state),
    (0, pg_core_1.index)('applications_applicant_email_idx').on(t.applicantEmail),
    (0, pg_core_1.index)('applications_applicant_user_id_idx').on(t.applicantUserId),
    (0, pg_core_1.index)('applications_created_at_idx').on(t.createdAt),
]; });
// ─── Application State Logs ────────────────────────────────────────────────────
// Her state geçişi burada kayıt altına alınır — state machine audit trail
exports.applicationStateLogs = (0, pg_core_1.pgTable)('application_state_logs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    applicationId: (0, pg_core_1.uuid)('application_id')
        .notNull()
        .references(function () { return exports.applications.id; }, { onDelete: 'cascade' }),
    fromState: (0, pg_core_1.text)('from_state'),
    toState: (0, pg_core_1.text)('to_state').notNull(),
    triggeredBy: (0, pg_core_1.uuid)('triggered_by').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    reason: (0, pg_core_1.text)('reason'),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [(0, pg_core_1.index)('application_state_logs_application_id_idx').on(t.applicationId)]; });
// ─── Relations ────────────────────────────────────────────────────────────────
exports.applicationsRelations = (0, drizzle_orm_1.relations)(exports.applications, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        applicantUser: one(users_1.users, {
            fields: [exports.applications.applicantUserId],
            references: [users_1.users.id],
        }),
        stateLogs: many(exports.applicationStateLogs),
    });
});
exports.applicationStateLogsRelations = (0, drizzle_orm_1.relations)(exports.applicationStateLogs, function (_a) {
    var one = _a.one;
    return ({
        application: one(exports.applications, {
            fields: [exports.applicationStateLogs.applicationId],
            references: [exports.applications.id],
        }),
    });
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.donationsRelations = exports.donations = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var enums_1 = require("./enums");
var users_1 = require("./users");
var applications_1 = require("./applications");
// ─── Donations ────────────────────────────────────────────────────────────────
exports.donations = (0, pg_core_1.pgTable)('donations', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    // Başvuruya bağlı üyelik ödemeleri için FK — duplicate donation'ı önler
    applicationId: (0, pg_core_1.uuid)('application_id').references(function () { return applications_1.applications.id; }, { onDelete: 'set null' }),
    email: (0, pg_core_1.text)('email').notNull(),
    fullName: (0, pg_core_1.text)('full_name').notNull(),
    // Kuruş cinsinden (TL için: 1 TL = 100 kuruş)
    amount: (0, pg_core_1.integer)('amount').notNull(),
    currency: (0, pg_core_1.text)('currency').notNull().default('TRY'),
    type: (0, enums_1.donationTypeEnum)('type').notNull().default('one_time'),
    method: (0, enums_1.donationMethodEnum)('method').notNull().default('bank_transfer'),
    status: (0, enums_1.donationStatusEnum)('status').notNull().default('pending'),
    // iyzico ödeme bilgileri
    paymentAccount: (0, enums_1.paymentAccountEnum)('payment_account').notNull().default('vakif'),
    iyzicoToken: (0, pg_core_1.text)('iyzico_token'),
    iyzicoPaymentId: (0, pg_core_1.text)('iyzico_payment_id'),
    iyzicoConversationId: (0, pg_core_1.text)('iyzico_conversation_id'),
    referenceCode: (0, pg_core_1.text)('reference_code'),
    notes: (0, pg_core_1.text)('notes'),
    // Annual donation fields
    donationCategory: (0, pg_core_1.text)('donation_category').default('genel'), // 'kurumsal' | 'bireysel' | 'genel'
    companyName: (0, pg_core_1.text)('company_name'),
    packageTier: (0, pg_core_1.text)('package_tier'), // 'bronz' | 'gumus' | 'altin' (kurumsal için)
    renewalDue: (0, pg_core_1.timestamp)('renewal_due', { withTimezone: true }),
    // Ödeme belgesi / dekont (MinIO key) — özellikle banka havalesi için
    proofKey: (0, pg_core_1.text)('proof_key'),
    proofUploadedAt: (0, pg_core_1.timestamp)('proof_uploaded_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { withTimezone: true }),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('donations_reference_unique').on(t.referenceCode),
    (0, pg_core_1.index)('donations_user_idx').on(t.userId),
    (0, pg_core_1.index)('donations_status_idx').on(t.status),
    (0, pg_core_1.index)('donations_created_idx').on(t.createdAt),
]; });
exports.donationsRelations = (0, drizzle_orm_1.relations)(exports.donations, function (_a) {
    var one = _a.one;
    return ({
        user: one(users_1.users, { fields: [exports.donations.userId], references: [users_1.users.id] }),
        application: one(applications_1.applications, { fields: [exports.donations.applicationId], references: [applications_1.applications.id] }),
    });
});

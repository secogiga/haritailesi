"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.membershipSubscriptionsRelations = exports.membershipFeeConfigsRelations = exports.membershipSubscriptions = exports.memberNumberSeqs = exports.membershipFeeConfigs = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var enums_1 = require("./enums");
var users_1 = require("./users");
var donations_1 = require("./donations");
// ─── Üyelik Ücret Konfigürasyonu ──────────────────────────────────────────────
// Her yıl başında admin panelden güncellenir.
// amountKurus = 0 → ücretsiz tier (haritailesi_genc, new_graduate_member)
// label: "Mesleğin Değer Ortağı Bağışı", "Mesleğe Değer Katan Marka Bağışı" vb.
exports.membershipFeeConfigs = (0, pg_core_1.pgTable)('membership_fee_configs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    year: (0, pg_core_1.integer)('year').notNull(),
    tier: (0, enums_1.membershipTierEnum)('tier').notNull(),
    amountKurus: (0, pg_core_1.integer)('amount_kurus').notNull().default(0),
    label: (0, pg_core_1.text)('label').notNull(),
    description: (0, pg_core_1.text)('description'),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('mfc_year_tier_unique').on(t.year, t.tier),
    (0, pg_core_1.index)('mfc_year_idx').on(t.year),
    (0, pg_core_1.index)('mfc_active_idx').on(t.isActive),
]; });
// ─── Üye Numarası Sayaçları ────────────────────────────────────────────────────
// Format: HA-YY-KAT-SIRANO → HA-26-10-001
// Her (yıl, kategori) çifti için ayrı ardışık sayaç.
// Atomic increment: UPDATE ... SET last_seq = last_seq + 1 RETURNING last_seq
exports.memberNumberSeqs = (0, pg_core_1.pgTable)('member_number_seqs', {
    year: (0, pg_core_1.smallint)('year').notNull(),
    category: (0, pg_core_1.text)('category').notNull(), // '01','10','11','12','15','30'
    lastSeq: (0, pg_core_1.integer)('last_seq').notNull().default(0),
}, function (t) { return [
    (0, pg_core_1.primaryKey)({ columns: [t.year, t.category] }),
]; });
// ─── Üyelik Aboneliği ─────────────────────────────────────────────────────────
// Üye numarası, süre, hatırlatma durumlarını tutar.
// userId null ise misafir ödeme (guestEmail/guestFullName zorunlu).
exports.membershipSubscriptions = (0, pg_core_1.pgTable)('membership_subscriptions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    // Sahibi — kayıtlı üye veya misafir
    userId: (0, pg_core_1.uuid)('user_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    donationId: (0, pg_core_1.uuid)('donation_id').references(function () { return donations_1.donations.id; }, { onDelete: 'set null' }),
    guestEmail: (0, pg_core_1.text)('guest_email'),
    guestFullName: (0, pg_core_1.text)('guest_full_name'),
    // Üye numarası bileşenleri
    memberNumber: (0, pg_core_1.text)('member_number').notNull(), // "HA-26-10-001"
    memberNumberYear: (0, pg_core_1.smallint)('member_number_year').notNull(), // 26
    memberNumberCategory: (0, pg_core_1.text)('member_number_category').notNull(), // "10"
    memberNumberSeq: (0, pg_core_1.integer)('member_number_seq').notNull(), // 1
    // Üyelik bilgileri
    membershipTier: (0, enums_1.membershipTierEnum)('membership_tier').notNull(),
    startsAt: (0, pg_core_1.timestamp)('starts_at', { withTimezone: true }).notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }).notNull(),
    status: (0, enums_1.membershipSubStatusEnum)('status').notNull().default('pending_payment'),
    // Hatırlatma gönderim takibi
    reminder30SentAt: (0, pg_core_1.timestamp)('reminder_30_sent_at', { withTimezone: true }),
    reminder7SentAt: (0, pg_core_1.timestamp)('reminder_7_sent_at', { withTimezone: true }),
    reminder1SentAt: (0, pg_core_1.timestamp)('reminder_1_sent_at', { withTimezone: true }),
    expiredNotifiedAt: (0, pg_core_1.timestamp)('expired_notified_at', { withTimezone: true }),
    notes: (0, pg_core_1.text)('notes'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('ms_member_number_unique').on(t.memberNumber),
    (0, pg_core_1.index)('ms_user_idx').on(t.userId),
    (0, pg_core_1.index)('ms_status_idx').on(t.status),
    (0, pg_core_1.index)('ms_expires_at_idx').on(t.expiresAt),
    (0, pg_core_1.index)('ms_donation_idx').on(t.donationId),
]; });
// ─── Relations ────────────────────────────────────────────────────────────────
exports.membershipFeeConfigsRelations = (0, drizzle_orm_1.relations)(exports.membershipFeeConfigs, function () { return ({}); });
exports.membershipSubscriptionsRelations = (0, drizzle_orm_1.relations)(exports.membershipSubscriptions, function (_a) {
    var one = _a.one;
    return ({
        user: one(users_1.users, { fields: [exports.membershipSubscriptions.userId], references: [users_1.users.id] }),
        donation: one(donations_1.donations, { fields: [exports.membershipSubscriptions.donationId], references: [donations_1.donations.id] }),
    });
});

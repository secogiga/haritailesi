"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interviewRequestsRelations = exports.availabilitySlotsRelations = exports.interviewRequests = exports.availabilitySlots = exports.interviewRequestStateEnum = exports.slotTypeEnum = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var users_1 = require("./users");
var applications_1 = require("./applications");
var mentorship_1 = require("./mentorship");
// ─── Enums ────────────────────────────────────────────────────────────────────
exports.slotTypeEnum = (0, pg_core_1.pgEnum)('slot_type', ['membership', 'mentorship']);
exports.interviewRequestStateEnum = (0, pg_core_1.pgEnum)('interview_request_state', [
    'pending',
    'confirmed',
    'cancelled',
    'rescheduled',
]);
// ─── Availability Slots ───────────────────────────────────────────────────────
// Admin'in müsait olduğu zaman dilimleri.
// slotType: 'membership' üyelik görüşmeleri, 'mentorship' mentorluk seansları için.
exports.availabilitySlots = (0, pg_core_1.pgTable)('availability_slots', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    adminId: (0, pg_core_1.uuid)('admin_id')
        .notNull()
        .references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    startAt: (0, pg_core_1.timestamp)('start_at', { withTimezone: true }).notNull(),
    endAt: (0, pg_core_1.timestamp)('end_at', { withTimezone: true }).notNull(),
    slotType: (0, exports.slotTypeEnum)('slot_type').notNull().default('membership'),
    // Kaç kişiyle görüşülebilir (mentorship için genellikle 1)
    capacity: (0, pg_core_1.integer)('capacity').notNull().default(1),
    bookedCount: (0, pg_core_1.integer)('booked_count').notNull().default(0),
    notes: (0, pg_core_1.text)('notes'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('availability_slots_admin_idx').on(t.adminId),
    (0, pg_core_1.index)('availability_slots_type_start_idx').on(t.slotType, t.startAt),
]; });
// ─── Interview Requests ────────────────────────────────────────────────────────
// Üyelik görüşmesi veya mentorluk seansı talebi.
// referenceType + referenceId ile hangi varlığa bağlı olduğu tutulur.
exports.interviewRequests = (0, pg_core_1.pgTable)('interview_requests', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    slotId: (0, pg_core_1.uuid)('slot_id')
        .references(function () { return exports.availabilitySlots.id; }, { onDelete: 'restrict' }),
    applicationId: (0, pg_core_1.uuid)('application_id').references(function () { return applications_1.applications.id; }, { onDelete: 'cascade' }),
    // Mentörlük bağlantısı (referenceType = 'mentorship' olduğunda kullanılır)
    mentorshipRequestId: (0, pg_core_1.uuid)('mentorship_request_id').references(function () { return mentorship_1.mentorshipRequests.id; }, { onDelete: 'cascade' }),
    // 'membership' veya 'mentorship' — hangi akış için oluşturuldu
    referenceType: (0, pg_core_1.text)('reference_type').notNull().default('membership'),
    state: (0, exports.interviewRequestStateEnum)('state').notNull().default('pending'),
    // Güvenli tek kullanımlık token — adayın email'inde gönderilen onay/iptal linki için
    confirmToken: (0, pg_core_1.uuid)('confirm_token').notNull().defaultRandom(),
    // Token geçerlilik süresi (7 gün)
    tokenExpiresAt: (0, pg_core_1.timestamp)('token_expires_at', { withTimezone: true }).notNull(),
    confirmedAt: (0, pg_core_1.timestamp)('confirmed_at', { withTimezone: true }),
    cancelledAt: (0, pg_core_1.timestamp)('cancelled_at', { withTimezone: true }),
    rescheduleNote: (0, pg_core_1.text)('reschedule_note'),
    // Admin'in eklediği görüşme bağlantısı (Meet/Zoom/Teams)
    meetUrl: (0, pg_core_1.text)('meet_url'),
    // Admin'in görüşmeyi oluşturan kişisi (bildirim için)
    createdByAdminId: (0, pg_core_1.uuid)('created_by_admin_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('interview_requests_application_idx').on(t.applicationId),
    (0, pg_core_1.index)('interview_requests_slot_idx').on(t.slotId),
    (0, pg_core_1.index)('interview_requests_token_idx').on(t.confirmToken),
    (0, pg_core_1.index)('interview_requests_state_idx').on(t.state),
]; });
// ─── Relations ────────────────────────────────────────────────────────────────
exports.availabilitySlotsRelations = (0, drizzle_orm_1.relations)(exports.availabilitySlots, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        admin: one(users_1.users, { fields: [exports.availabilitySlots.adminId], references: [users_1.users.id] }),
        interviewRequests: many(exports.interviewRequests),
    });
});
exports.interviewRequestsRelations = (0, drizzle_orm_1.relations)(exports.interviewRequests, function (_a) {
    var one = _a.one;
    return ({
        slot: one(exports.availabilitySlots, { fields: [exports.interviewRequests.slotId], references: [exports.availabilitySlots.id] }),
        application: one(applications_1.applications, { fields: [exports.interviewRequests.applicationId], references: [applications_1.applications.id] }),
        mentorshipRequest: one(mentorship_1.mentorshipRequests, { fields: [exports.interviewRequests.mentorshipRequestId], references: [mentorship_1.mentorshipRequests.id] }),
        createdByAdmin: one(users_1.users, { fields: [exports.interviewRequests.createdByAdminId], references: [users_1.users.id] }),
    });
});

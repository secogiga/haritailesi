"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menteeApplicationsRelations = exports.mentorshipSessionsRelations = exports.mentorshipRequestsRelations = exports.mentorProfilesRelations = exports.mentorshipSessions = exports.mentorshipRequests = exports.menteeApplications = exports.mentorProfiles = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var users_1 = require("./users");
// ─── Mentor Profiles ──────────────────────────────────────────────────────────
exports.mentorProfiles = (0, pg_core_1.pgTable)('mentor_profiles', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    expertiseAreas: (0, pg_core_1.text)('expertise_areas').array().notNull().default([]),
    bio: (0, pg_core_1.text)('bio'),
    // 'online' | 'in_person' | 'both'
    sessionFormat: (0, pg_core_1.text)('session_format').notNull().default('online'),
    city: (0, pg_core_1.text)('city'),
    // Seans süresi tercihi (dk) — 40-60 aralığı
    sessionDurationMin: (0, pg_core_1.integer)('session_duration_min').notNull().default(40),
    sessionDurationMax: (0, pg_core_1.integer)('session_duration_max').notNull().default(60),
    // Kapasite türü: 'monthly' | 'periodic' | 'both'
    capacityType: (0, pg_core_1.text)('capacity_type').notNull().default('monthly'),
    monthlyCapacity: (0, pg_core_1.integer)('monthly_capacity').notNull().default(2),
    // Eş zamanlı dönemlik program kapasitesi
    periodicCapacity: (0, pg_core_1.integer)('periodic_capacity').notNull().default(1),
    isAcceptingRequests: (0, pg_core_1.boolean)('is_accepting_requests').notNull().default(true),
    completedSessionCount: (0, pg_core_1.integer)('completed_session_count').notNull().default(0),
    // Admin onay akışı: 'pending' | 'approved' | 'rejected'
    adminStatus: (0, pg_core_1.text)('admin_status').notNull().default('pending'),
    adminNote: (0, pg_core_1.text)('admin_note'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('mentor_profiles_user_id_unique').on(t.userId),
    (0, pg_core_1.index)('mentor_profiles_accepting_idx').on(t.isAcceptingRequests),
    (0, pg_core_1.index)('mentor_profiles_admin_status_idx').on(t.adminStatus),
    (0, pg_core_1.index)('mentor_profiles_capacity_type_idx').on(t.capacityType),
]; });
// ─── Mentee Applications ──────────────────────────────────────────────────────
// Mentörlük almak isteyen kişilerin admin havuzuna düşen başvuruları.
exports.menteeApplications = (0, pg_core_1.pgTable)('mentee_applications', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    name: (0, pg_core_1.text)('name').notNull(),
    email: (0, pg_core_1.text)('email').notNull(),
    topic: (0, pg_core_1.text)('topic').notNull(),
    goal: (0, pg_core_1.text)('goal').notNull(),
    // 'online' | 'in_person' | 'both'
    preferredFormat: (0, pg_core_1.text)('preferred_format').notNull().default('online'),
    // 'single_session' | 'periodic'
    engagementType: (0, pg_core_1.text)('engagement_type').notNull().default('single_session'),
    // 'sahne' | 'mutfak' | 'kutu'
    source: (0, pg_core_1.text)('source').notNull().default('mutfak'),
    // 'pending' | 'approved' | 'matched' | 'rejected'
    status: (0, pg_core_1.text)('status').notNull().default('pending'),
    adminNote: (0, pg_core_1.text)('admin_note'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('mentee_applications_status_idx').on(t.status),
    (0, pg_core_1.index)('mentee_applications_user_idx').on(t.userId),
    (0, pg_core_1.index)('mentee_applications_type_idx').on(t.engagementType),
]; });
// ─── Mentorship Engagements ───────────────────────────────────────────────────
// Her eşleşme bir "engagement"dır. İçinde 1 veya 4 session barındırır.
// status: pending → accepted | rejected | cancelled
//         accepted → completed | cancelled
//
// engagementType:
//   'single_session' — 1 oturum, belirli bir konu/soru
//   'periodic'       — 4 ay, ayda 1 oturum (toplam 4 session)
exports.mentorshipRequests = (0, pg_core_1.pgTable)('mentorship_requests', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    menteeId: (0, pg_core_1.uuid)('mentee_id')
        .notNull()
        .references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    mentorId: (0, pg_core_1.uuid)('mentor_id')
        .notNull()
        .references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    topic: (0, pg_core_1.text)('topic').notNull(),
    goal: (0, pg_core_1.text)('goal').notNull(),
    // 'online' | 'in_person'
    preferredFormat: (0, pg_core_1.text)('preferred_format').notNull().default('online'),
    // 'single_session' | 'periodic'
    engagementType: (0, pg_core_1.text)('engagement_type').notNull().default('single_session'),
    // Dönemlik için süre (ay) — genellikle 4
    periodMonths: (0, pg_core_1.integer)('period_months'),
    // 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
    status: (0, pg_core_1.text)('status').notNull().default('pending'),
    mentorNote: (0, pg_core_1.text)('mentor_note'),
    // 'mentee' | 'admin'
    initiatedBy: (0, pg_core_1.text)('initiated_by').notNull().default('mentee'),
    menteeApplicationId: (0, pg_core_1.uuid)('mentee_application_id').references(function () { return exports.menteeApplications.id; }, { onDelete: 'set null' }),
    // Dönem sonu değerlendirmesi (periodic engagements için)
    menteeFinalRating: (0, pg_core_1.integer)('mentee_final_rating'),
    menteeFinalComment: (0, pg_core_1.text)('mentee_final_comment'),
    mentorFinalComment: (0, pg_core_1.text)('mentor_final_comment'),
    // Eski single-session alanları (geriye uyumluluk + direct requests için)
    scheduledAt: (0, pg_core_1.timestamp)('scheduled_at', { withTimezone: true }),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { withTimezone: true }),
    proposedScheduledAt: (0, pg_core_1.timestamp)('proposed_scheduled_at', { withTimezone: true }),
    rescheduleNote: (0, pg_core_1.text)('reschedule_note'),
    rating: (0, pg_core_1.integer)('rating'),
    feedbackComment: (0, pg_core_1.text)('feedback_comment'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('mentorship_requests_mentee_idx').on(t.menteeId),
    (0, pg_core_1.index)('mentorship_requests_mentor_idx').on(t.mentorId),
    (0, pg_core_1.index)('mentorship_requests_status_idx').on(t.status),
    (0, pg_core_1.index)('mentorship_requests_type_idx').on(t.engagementType),
]; });
// ─── Mentorship Sessions ──────────────────────────────────────────────────────
// Her engagement'a bağlı bireysel oturumlar.
// single_session → 1 session, periodic → 4 session (otomatik oluşturulur)
//
// status: 'pending'   — tarih bekleniyor (mentor ayarlayacak)
//         'scheduled' — tarih mentör tarafından belirlendi
//         'completed' — oturum tamamlandı
//         'cancelled' — iptal edildi
exports.mentorshipSessions = (0, pg_core_1.pgTable)('mentorship_sessions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    engagementId: (0, pg_core_1.uuid)('engagement_id')
        .notNull()
        .references(function () { return exports.mentorshipRequests.id; }, { onDelete: 'cascade' }),
    sessionNumber: (0, pg_core_1.integer)('session_number').notNull(), // 1-tabanlı
    scheduledAt: (0, pg_core_1.timestamp)('scheduled_at', { withTimezone: true }),
    status: (0, pg_core_1.text)('status').notNull().default('pending'),
    actualDurationMinutes: (0, pg_core_1.integer)('actual_duration_minutes'),
    // Oturum sonrası notlar
    menteeNote: (0, pg_core_1.text)('mentee_note'),
    menteeRating: (0, pg_core_1.integer)('mentee_rating'),
    mentorNote: (0, pg_core_1.text)('mentor_note'),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('mentorship_sessions_engagement_idx').on(t.engagementId),
    (0, pg_core_1.index)('mentorship_sessions_status_idx').on(t.status),
    (0, pg_core_1.index)('mentorship_sessions_scheduled_idx').on(t.scheduledAt),
]; });
// ─── Relations ────────────────────────────────────────────────────────────────
exports.mentorProfilesRelations = (0, drizzle_orm_1.relations)(exports.mentorProfiles, function (_a) {
    var one = _a.one;
    return ({
        user: one(users_1.users, { fields: [exports.mentorProfiles.userId], references: [users_1.users.id] }),
    });
});
exports.mentorshipRequestsRelations = (0, drizzle_orm_1.relations)(exports.mentorshipRequests, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        mentee: one(users_1.users, { fields: [exports.mentorshipRequests.menteeId], references: [users_1.users.id], relationName: 'menteeRequests' }),
        mentor: one(users_1.users, { fields: [exports.mentorshipRequests.mentorId], references: [users_1.users.id], relationName: 'mentorRequests' }),
        menteeApplication: one(exports.menteeApplications, { fields: [exports.mentorshipRequests.menteeApplicationId], references: [exports.menteeApplications.id] }),
        sessions: many(exports.mentorshipSessions),
    });
});
exports.mentorshipSessionsRelations = (0, drizzle_orm_1.relations)(exports.mentorshipSessions, function (_a) {
    var one = _a.one;
    return ({
        engagement: one(exports.mentorshipRequests, { fields: [exports.mentorshipSessions.engagementId], references: [exports.mentorshipRequests.id] }),
    });
});
exports.menteeApplicationsRelations = (0, drizzle_orm_1.relations)(exports.menteeApplications, function (_a) {
    var one = _a.one;
    return ({
        user: one(users_1.users, { fields: [exports.menteeApplications.userId], references: [users_1.users.id] }),
    });
});

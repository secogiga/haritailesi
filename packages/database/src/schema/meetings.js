"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meetingParticipantsRelations = exports.meetingSessionsRelations = exports.meetingParticipants = exports.meetingSessions = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var users_1 = require("./users");
// ─── Meeting Sessions ─────────────────────────────────────────────────────────
// Mentorship / etkinlik / eğitim buluşmalarının video oturum kaydı.
// reference_type: 'mentorship' | 'event' | 'training'
// room_name: 'hrtl-{type}-{referenceId}' — tahmin edilemez, güvenlik bu.
exports.meetingSessions = (0, pg_core_1.pgTable)('meeting_sessions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    referenceType: (0, pg_core_1.text)('reference_type').notNull(),
    referenceId: (0, pg_core_1.uuid)('reference_id').notNull(),
    roomName: (0, pg_core_1.text)('room_name').notNull(),
    hostUserId: (0, pg_core_1.uuid)('host_user_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    startedAt: (0, pg_core_1.timestamp)('started_at', { withTimezone: true }),
    endedAt: (0, pg_core_1.timestamp)('ended_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('meeting_sessions_room_name_unique').on(t.roomName),
    (0, pg_core_1.index)('meeting_sessions_reference_idx').on(t.referenceType, t.referenceId),
]; });
// ─── Meeting Participants ─────────────────────────────────────────────────────
// Jitsi IFrame API'sinden gelen join/leave event'ları burada tutulur.
// Bir kullanıcı ayrılıp yeniden girerse row güncellenir (joined_at reset).
exports.meetingParticipants = (0, pg_core_1.pgTable)('meeting_participants', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    sessionId: (0, pg_core_1.uuid)('session_id')
        .notNull()
        .references(function () { return exports.meetingSessions.id; }, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    joinedAt: (0, pg_core_1.timestamp)('joined_at', { withTimezone: true }).notNull().defaultNow(),
    leftAt: (0, pg_core_1.timestamp)('left_at', { withTimezone: true }),
    durationSeconds: (0, pg_core_1.integer)('duration_seconds'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('meeting_participants_session_user_unique').on(t.sessionId, t.userId),
    (0, pg_core_1.index)('meeting_participants_session_idx').on(t.sessionId),
    (0, pg_core_1.index)('meeting_participants_user_idx').on(t.userId),
]; });
// ─── Relations ────────────────────────────────────────────────────────────────
exports.meetingSessionsRelations = (0, drizzle_orm_1.relations)(exports.meetingSessions, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        host: one(users_1.users, { fields: [exports.meetingSessions.hostUserId], references: [users_1.users.id] }),
        participants: many(exports.meetingParticipants),
    });
});
exports.meetingParticipantsRelations = (0, drizzle_orm_1.relations)(exports.meetingParticipants, function (_a) {
    var one = _a.one;
    return ({
        session: one(exports.meetingSessions, { fields: [exports.meetingParticipants.sessionId], references: [exports.meetingSessions.id] }),
        user: one(users_1.users, { fields: [exports.meetingParticipants.userId], references: [users_1.users.id] }),
    });
});

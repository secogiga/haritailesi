"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.competitionApplicationsRelations = exports.competitionsRelations = exports.competitionApplications = exports.competitions = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var users_1 = require("./users");
// ─── Competitions (Yarışmalar) ────────────────────────────────────────────────
exports.competitions = (0, pg_core_1.pgTable)('competitions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    title: (0, pg_core_1.text)('title').notNull(),
    slug: (0, pg_core_1.text)('slug').notNull().unique(),
    description: (0, pg_core_1.text)('description'),
    posterKey: (0, pg_core_1.text)('poster_key'), // MinIO key for poster image
    deadline: (0, pg_core_1.timestamp)('deadline', { withTimezone: true }),
    prizes: (0, pg_core_1.text)('prizes'), // free-text prize description
    category: (0, pg_core_1.text)('category'), // e.g. 'foto', 'proje', 'makale'
    status: (0, pg_core_1.text)('status').notNull().default('draft'), // draft|active|ended
    winnersText: (0, pg_core_1.text)('winners_text'),
    applicationCount: (0, pg_core_1.text)('application_count').default('0'), // cached, updated by trigger or service
    viewCount: (0, pg_core_1.integer)('view_count').notNull().default(0),
    createdBy: (0, pg_core_1.uuid)('created_by').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('competitions_status_idx').on(t.status),
    (0, pg_core_1.index)('competitions_slug_idx').on(t.slug),
    (0, pg_core_1.index)('competitions_deadline_idx').on(t.deadline),
]; });
exports.competitionApplications = (0, pg_core_1.pgTable)('competition_applications', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    competitionId: (0, pg_core_1.uuid)('competition_id').notNull().references(function () { return exports.competitions.id; }, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    email: (0, pg_core_1.text)('email').notNull(),
    displayName: (0, pg_core_1.text)('display_name').notNull(),
    notes: (0, pg_core_1.text)('notes'),
    source: (0, pg_core_1.text)('source').notNull().default('sahne'), // sahne|mutfak
    status: (0, pg_core_1.text)('status').notNull().default('received'), // received|shortlisted|winner|rejected
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('comp_apps_competition_idx').on(t.competitionId),
    (0, pg_core_1.index)('comp_apps_user_idx').on(t.userId),
    (0, pg_core_1.index)('comp_apps_status_idx').on(t.status),
]; });
exports.competitionsRelations = (0, drizzle_orm_1.relations)(exports.competitions, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        createdBy: one(users_1.users, { fields: [exports.competitions.createdBy], references: [users_1.users.id] }),
        applications: many(exports.competitionApplications),
    });
});
exports.competitionApplicationsRelations = (0, drizzle_orm_1.relations)(exports.competitionApplications, function (_a) {
    var one = _a.one;
    return ({
        competition: one(exports.competitions, { fields: [exports.competitionApplications.competitionId], references: [exports.competitions.id] }),
        user: one(users_1.users, { fields: [exports.competitionApplications.userId], references: [users_1.users.id] }),
    });
});

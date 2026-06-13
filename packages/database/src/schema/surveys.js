"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.surveyResponsesRelations = exports.surveyQuestionsRelations = exports.surveysRelations = exports.surveyResponses = exports.surveyQuestions = exports.surveys = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var users_1 = require("./users");
// ─── Surveys (Anketler) ───────────────────────────────────────────────────────
// questionType: 'single' | 'multiple' | 'text'
// status:       'draft'  | 'active'   | 'ended'
exports.surveys = (0, pg_core_1.pgTable)('surveys', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    title: (0, pg_core_1.text)('title').notNull(),
    description: (0, pg_core_1.text)('description'),
    status: (0, pg_core_1.text)('status').notNull().default('draft'), // draft|active|ended
    endsAt: (0, pg_core_1.timestamp)('ends_at', { withTimezone: true }),
    responseCount: (0, pg_core_1.integer)('response_count').notNull().default(0),
    viewCount: (0, pg_core_1.integer)('view_count').notNull().default(0),
    createdBy: (0, pg_core_1.uuid)('created_by').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('surveys_status_idx').on(t.status),
    (0, pg_core_1.index)('surveys_ends_at_idx').on(t.endsAt),
]; });
exports.surveyQuestions = (0, pg_core_1.pgTable)('survey_questions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    surveyId: (0, pg_core_1.uuid)('survey_id').notNull().references(function () { return exports.surveys.id; }, { onDelete: 'cascade' }),
    questionText: (0, pg_core_1.text)('question_text').notNull(),
    type: (0, pg_core_1.text)('type').notNull().default('single'), // single|multiple|text
    options: (0, pg_core_1.jsonb)('options').$type(), // for single/multiple
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('survey_q_survey_idx').on(t.surveyId),
]; });
exports.surveyResponses = (0, pg_core_1.pgTable)('survey_responses', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    surveyId: (0, pg_core_1.uuid)('survey_id').notNull().references(function () { return exports.surveys.id; }, { onDelete: 'cascade' }),
    respondentEmail: (0, pg_core_1.text)('respondent_email'),
    answers: (0, pg_core_1.jsonb)('answers').notNull().$type(), // questionId → answer
    source: (0, pg_core_1.text)('source').notNull().default('sahne'), // sahne|mutfak
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('survey_resp_survey_idx').on(t.surveyId),
    (0, pg_core_1.index)('survey_resp_created_idx').on(t.createdAt),
]; });
exports.surveysRelations = (0, drizzle_orm_1.relations)(exports.surveys, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        createdBy: one(users_1.users, { fields: [exports.surveys.createdBy], references: [users_1.users.id] }),
        questions: many(exports.surveyQuestions),
        responses: many(exports.surveyResponses),
    });
});
exports.surveyQuestionsRelations = (0, drizzle_orm_1.relations)(exports.surveyQuestions, function (_a) {
    var one = _a.one;
    return ({
        survey: one(exports.surveys, { fields: [exports.surveyQuestions.surveyId], references: [exports.surveys.id] }),
    });
});
exports.surveyResponsesRelations = (0, drizzle_orm_1.relations)(exports.surveyResponses, function (_a) {
    var one = _a.one;
    return ({
        survey: one(exports.surveys, { fields: [exports.surveyResponses.surveyId], references: [exports.surveys.id] }),
    });
});

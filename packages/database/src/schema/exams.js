"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.examAttemptsRelations = exports.examQuestionsRelations = exports.examCategoriesRelations = exports.examResources = exports.examAttempts = exports.examQuestions = exports.examCategories = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var users_1 = require("./users");
// ─── Sınav Hazırlık (Exam Categories + Questions + Attempts) ─────────────────
// Sınav tipleri: kpss | uzmanlik | deger | cbs | diger
// correctOption: 'a' | 'b' | 'c' | 'd' | 'e'
exports.examCategories = (0, pg_core_1.pgTable)('exam_categories', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)('name').notNull(),
    slug: (0, pg_core_1.text)('slug').notNull().unique(),
    description: (0, pg_core_1.text)('description'),
    examType: (0, pg_core_1.text)('exam_type').notNull().default('diger'), // kpss|uzmanlik|deger|cbs|diger
    iconEmoji: (0, pg_core_1.text)('icon_emoji').default('📝'),
    questionCount: (0, pg_core_1.integer)('question_count').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('exam_cats_type_idx').on(t.examType),
    (0, pg_core_1.index)('exam_cats_active_idx').on(t.isActive),
]; });
exports.examQuestions = (0, pg_core_1.pgTable)('exam_questions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    categoryId: (0, pg_core_1.uuid)('category_id').notNull().references(function () { return exports.examCategories.id; }, { onDelete: 'cascade' }),
    questionText: (0, pg_core_1.text)('question_text').notNull(),
    optionA: (0, pg_core_1.text)('option_a').notNull(),
    optionB: (0, pg_core_1.text)('option_b').notNull(),
    optionC: (0, pg_core_1.text)('option_c').notNull(),
    optionD: (0, pg_core_1.text)('option_d').notNull(),
    optionE: (0, pg_core_1.text)('option_e'), // bazı sınavlarda 5 şık
    correctOption: (0, pg_core_1.text)('correct_option').notNull(), // 'a'|'b'|'c'|'d'|'e'
    explanation: (0, pg_core_1.text)('explanation'), // çözüm açıklaması
    difficulty: (0, pg_core_1.text)('difficulty').notNull().default('medium'), // easy|medium|hard
    source: (0, pg_core_1.text)('source'), // kaynak kitap/yıl
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('exam_q_category_idx').on(t.categoryId),
    (0, pg_core_1.index)('exam_q_difficulty_idx').on(t.difficulty),
    (0, pg_core_1.index)('exam_q_active_idx').on(t.isActive),
]; });
exports.examAttempts = (0, pg_core_1.pgTable)('exam_attempts', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    categoryId: (0, pg_core_1.uuid)('category_id').notNull().references(function () { return exports.examCategories.id; }),
    userId: (0, pg_core_1.uuid)('user_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    score: (0, pg_core_1.integer)('score').notNull(),
    totalQuestions: (0, pg_core_1.integer)('total_questions').notNull(),
    timeTakenSeconds: (0, pg_core_1.integer)('time_taken_seconds'),
    answers: (0, pg_core_1.jsonb)('answers').notNull().$type(), // questionId → 'a'|'b'...
    completedAt: (0, pg_core_1.timestamp)('completed_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('exam_attempts_category_idx').on(t.categoryId),
    (0, pg_core_1.index)('exam_attempts_user_idx').on(t.userId),
    (0, pg_core_1.index)('exam_attempts_completed_idx').on(t.completedAt),
]; });
// ─── Sınav Kaynakları (Exam Resources) ───────────────────────────────────────
// examKey: kpss | deger | cbs | iha
// resourceType: tip | document | date | video
exports.examResources = (0, pg_core_1.pgTable)('exam_resources', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    examKey: (0, pg_core_1.text)('exam_key').notNull(), // kpss | deger | cbs | iha
    resourceType: (0, pg_core_1.text)('resource_type').notNull(), // tip | document | date | video
    title: (0, pg_core_1.text)('title').notNull(),
    content: (0, pg_core_1.text)('content'), // tip metni veya açıklama
    resourceUrl: (0, pg_core_1.text)('resource_url'), // döküman/video URL
    eventDate: (0, pg_core_1.timestamp)('event_date', { withTimezone: true }), // önemli tarih
    isPublished: (0, pg_core_1.boolean)('is_published').notNull().default(true),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    viewCount: (0, pg_core_1.integer)('view_count').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('exam_res_key_idx').on(t.examKey),
    (0, pg_core_1.index)('exam_res_type_idx').on(t.resourceType),
    (0, pg_core_1.index)('exam_res_published_idx').on(t.isPublished),
]; });
exports.examCategoriesRelations = (0, drizzle_orm_1.relations)(exports.examCategories, function (_a) {
    var many = _a.many;
    return ({
        questions: many(exports.examQuestions),
        attempts: many(exports.examAttempts),
    });
});
exports.examQuestionsRelations = (0, drizzle_orm_1.relations)(exports.examQuestions, function (_a) {
    var one = _a.one;
    return ({
        category: one(exports.examCategories, { fields: [exports.examQuestions.categoryId], references: [exports.examCategories.id] }),
    });
});
exports.examAttemptsRelations = (0, drizzle_orm_1.relations)(exports.examAttempts, function (_a) {
    var one = _a.one;
    return ({
        category: one(exports.examCategories, { fields: [exports.examAttempts.categoryId], references: [exports.examCategories.id] }),
        user: one(users_1.users, { fields: [exports.examAttempts.userId], references: [users_1.users.id] }),
    });
});

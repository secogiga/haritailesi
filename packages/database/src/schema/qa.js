"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.communityAnswersRelations = exports.communityQuestionsRelations = exports.communityAnswers = exports.communityQuestions = exports.qaStatusEnum = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var users_1 = require("./users");
var feed_1 = require("./feed");
var enums_1 = require("./enums");
// ─── Status enum ──────────────────────────────────────────────────────────────
exports.qaStatusEnum = (0, pg_core_1.pgEnum)('qa_status', [
    'pending', // Gönderildi, admin incelemedi
    'approved', // Admin onayladı; isMutfakPublished / isSahnePublished ile kanal seçilir
    'rejected', // Admin reddetti
    'hidden', // Yayındaydı, admin gizledi
]);
// ─── Community Questions ───────────────────────────────────────────────────────
// Sahne veya Mutfak'tan gelen sorular.
// İki bağımsız yayın kanalı: Mutfak feed + Sahne SSS.
exports.communityQuestions = (0, pg_core_1.pgTable)('community_questions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    email: (0, pg_core_1.text)('email').notNull(),
    displayName: (0, pg_core_1.text)('display_name'),
    questionText: (0, pg_core_1.text)('question_text').notNull(),
    category: (0, enums_1.postCategoryEnum)('category').notNull().default('haritailesi_duyurulari'),
    status: (0, exports.qaStatusEnum)('status').notNull().default('pending'),
    // Yayın kanalları — bağımsız toggle
    isMutfakPublished: (0, pg_core_1.boolean)('is_mutfak_published').notNull().default(false),
    isSahnePublished: (0, pg_core_1.boolean)('is_sahne_published').notNull().default(false),
    isFeatured: (0, pg_core_1.boolean)('is_featured').notNull().default(false),
    // Mutfak feed entegrasyonu — soru yayınlandığında oluşturulan post
    feedPostId: (0, pg_core_1.uuid)('feed_post_id').references(function () { return feed_1.posts.id; }, { onDelete: 'set null' }),
    showFullName: (0, pg_core_1.boolean)('show_full_name').notNull().default(true),
    viewCount: (0, pg_core_1.integer)('view_count').notNull().default(0),
    source: (0, pg_core_1.text)('source').notNull().default('sahne'),
    approvedBy: (0, pg_core_1.uuid)('approved_by').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('cq_status_idx').on(t.status),
    (0, pg_core_1.index)('cq_category_idx').on(t.category),
    (0, pg_core_1.index)('cq_created_at_idx').on(t.createdAt),
    (0, pg_core_1.index)('cq_featured_idx').on(t.isFeatured),
    (0, pg_core_1.index)('cq_mutfak_pub_idx').on(t.isMutfakPublished),
    (0, pg_core_1.index)('cq_sahne_pub_idx').on(t.isSahnePublished),
]; });
// ─── Community Answers ─────────────────────────────────────────────────────────
// Bir soruya birden fazla cevap gelebilir (Sahne + Mutfak'tan).
// Admin her cevabı ayrı ayrı inceler; isPublished=true olanlar görünür.
exports.communityAnswers = (0, pg_core_1.pgTable)('community_answers', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    questionId: (0, pg_core_1.uuid)('question_id')
        .notNull()
        .references(function () { return exports.communityQuestions.id; }, { onDelete: 'cascade' }),
    // Cevabı gönderen (anonim Sahne → email; Mutfak üyesi → userId)
    submitterUserId: (0, pg_core_1.uuid)('submitter_user_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    submitterEmail: (0, pg_core_1.text)('submitter_email'),
    submitterName: (0, pg_core_1.text)('submitter_name'),
    submitterTier: (0, pg_core_1.text)('submitter_tier'), // 'registered_user' | 'haritailesi_genc' | 'new_graduate_member' | 'individual_member' | 'corporate_member'
    body: (0, pg_core_1.text)('body').notNull(),
    source: (0, pg_core_1.text)('source').notNull().default('admin'), // 'sahne' | 'mutfak' | 'admin'
    showFullName: (0, pg_core_1.boolean)('show_full_name').notNull().default(true),
    isPublished: (0, pg_core_1.boolean)('is_published').notNull().default(false),
    approvedBy: (0, pg_core_1.uuid)('approved_by').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('ca_question_idx').on(t.questionId),
    (0, pg_core_1.index)('ca_published_idx').on(t.isPublished),
    (0, pg_core_1.index)('ca_source_idx').on(t.source),
]; });
// ─── Relations ────────────────────────────────────────────────────────────────
exports.communityQuestionsRelations = (0, drizzle_orm_1.relations)(exports.communityQuestions, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        user: one(users_1.users, { fields: [exports.communityQuestions.userId], references: [users_1.users.id] }),
        approvedByUser: one(users_1.users, { fields: [exports.communityQuestions.approvedBy], references: [users_1.users.id] }),
        feedPost: one(feed_1.posts, { fields: [exports.communityQuestions.feedPostId], references: [feed_1.posts.id] }),
        answers: many(exports.communityAnswers),
    });
});
exports.communityAnswersRelations = (0, drizzle_orm_1.relations)(exports.communityAnswers, function (_a) {
    var one = _a.one;
    return ({
        question: one(exports.communityQuestions, { fields: [exports.communityAnswers.questionId], references: [exports.communityQuestions.id] }),
        submitterUser: one(users_1.users, { fields: [exports.communityAnswers.submitterUserId], references: [users_1.users.id] }),
        approvedByUser: one(users_1.users, { fields: [exports.communityAnswers.approvedBy], references: [users_1.users.id] }),
    });
});

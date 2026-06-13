import { pgTable, uuid, text, integer, boolean, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// ─── Surveys — Anket | Test ───────────────────────────────────────────────────
export const surveys = pgTable(
  'surveys',
  {
    id:             uuid('id').primaryKey().defaultRandom(),
    slug:           text('slug').unique(),
    type:           text('type').notNull().default('anket'),
    title:          text('title').notNull(),
    description:    text('description'),
    coverImageUrl:  text('cover_image_url'),
    status:         text('status').notNull().default('draft'),
    endsAt:         timestamp('ends_at', { withTimezone: true }),
    allowAnonymous: boolean('allow_anonymous').notNull().default(true),
    showResults:    boolean('show_results').notNull().default(true),
    timeLimit:      integer('time_limit'),
    passingScore:   integer('passing_score'),
    responseCount:  integer('response_count').notNull().default(0),
    viewCount:      integer('view_count').notNull().default(0),
    companySlug:    text('company_slug'),
    resultStats:    jsonb('result_stats').$type<{
      avgPercent?: number; passRate?: number;
      topAnswer?: string; topAnswerPct?: number; topAnswerCount?: number;
      totalResponses?: number; computedAt?: string;
    } | null>(),
    createdBy:      uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('surveys_type_status_idx').on(t.type, t.status),
    index('surveys_slug_idx').on(t.slug),
    index('surveys_ends_at_idx').on(t.endsAt),
  ],
);

// ─── Questions ────────────────────────────────────────────────────────────────
export const surveyQuestions = pgTable(
  'survey_questions',
  {
    id:                  uuid('id').primaryKey().defaultRandom(),
    surveyId:            uuid('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
    questionText:        text('question_text').notNull(),
    type:                text('type').notNull().default('single'),
    options:             jsonb('options').$type<string[]>(),
    correctOptions:      jsonb('correct_options').$type<string[]>(),
    points:              integer('points').notNull().default(1),
    explanation:         text('explanation'),
    required:            boolean('required').notNull().default(true),
    sortOrder:           integer('sort_order').notNull().default(0),
    // Görsel desteği
    imageUrl:            text('image_url'),
    // Koşullu görünürlük
    conditionQuestionId: uuid('condition_question_id'),              // hangi sorunun cevabına bağlı
    conditionValues:     jsonb('condition_values').$type<string[]>(), // bu değerler seçilince göster
    // Soru bankası alanları
    scenarioText:        text('scenario_text'),                       // sorudan önce gösterilen senaryo/bağlam
    difficulty:          text('difficulty').notNull().default('medium'), // easy | medium | hard
    topicTags:           text('topic_tags').array().notNull().default([]),
    createdAt:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('survey_q_survey_idx').on(t.surveyId),
    index('survey_q_order_idx').on(t.surveyId, t.sortOrder),
  ],
);

// ─── Responses ────────────────────────────────────────────────────────────────
export const surveyResponses = pgTable(
  'survey_responses',
  {
    id:              uuid('id').primaryKey().defaultRandom(),
    surveyId:        uuid('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
    userId:          uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    respondentEmail: text('respondent_email'),
    answers:         jsonb('answers').notNull().$type<Record<string, string | string[]>>(),
    score:           integer('score'),
    maxScore:        integer('max_score'),
    timeTaken:       integer('time_taken'),
    certCode:        text('cert_code').unique(),
    source:          text('source').notNull().default('sahne'),
    createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('survey_resp_survey_idx').on(t.surveyId),
    index('survey_resp_user_idx').on(t.userId),
    index('survey_resp_created_idx').on(t.createdAt),
  ],
);

// ─── Live Sessions ────────────────────────────────────────────────────────────
// Canlı Oturumlar: host bir anketi gerçek zamanlı sunar, katılımcılar birlikte cevaplar
export const surveyLiveSessions = pgTable(
  'survey_live_sessions',
  {
    id:                   uuid('id').primaryKey().defaultRandom(),
    surveyId:             uuid('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
    hostId:               uuid('host_id').references(() => users.id, { onDelete: 'set null' }),
    code:                 text('code').notNull().unique(),              // 6 karakter — katılım kodu
    status:               text('status').notNull().default('waiting'), // waiting|active|showing_results|ended
    currentQuestionIndex: integer('current_question_index').notNull().default(-1),
    participantCount:     integer('participant_count').notNull().default(0),
    startedAt:            timestamp('started_at', { withTimezone: true }),
    endedAt:              timestamp('ended_at', { withTimezone: true }),
    createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('live_sess_code_idx').on(t.code),
    index('live_sess_status_idx').on(t.status),
    index('live_sess_survey_idx').on(t.surveyId),
  ],
);

// ─── Live Responses ───────────────────────────────────────────────────────────
export const surveyLiveResponses = pgTable(
  'survey_live_responses',
  {
    id:              uuid('id').primaryKey().defaultRandom(),
    sessionId:       uuid('session_id').notNull().references(() => surveyLiveSessions.id, { onDelete: 'cascade' }),
    questionId:      uuid('question_id').notNull().references(() => surveyQuestions.id, { onDelete: 'cascade' }),
    participantId:   text('participant_id').notNull(), // userId veya anonim fingerprint
    participantName: text('participant_name'),
    answer:          jsonb('answer').notNull().$type<string[]>(),
    createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('live_resp_session_idx').on(t.sessionId),
    index('live_resp_question_idx').on(t.questionId),
    index('live_resp_participant_idx').on(t.sessionId, t.participantId),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const surveysRelations = relations(surveys, ({ one, many }) => ({
  createdBy:    one(users, { fields: [surveys.createdBy], references: [users.id] }),
  questions:    many(surveyQuestions),
  responses:    many(surveyResponses),
  liveSessions: many(surveyLiveSessions),
}));

export const surveyQuestionsRelations = relations(surveyQuestions, ({ one }) => ({
  survey: one(surveys, { fields: [surveyQuestions.surveyId], references: [surveys.id] }),
}));

export const surveyResponsesRelations = relations(surveyResponses, ({ one }) => ({
  survey: one(surveys, { fields: [surveyResponses.surveyId], references: [surveys.id] }),
  user:   one(users,   { fields: [surveyResponses.userId],   references: [users.id] }),
}));

export const surveyLiveSessionsRelations = relations(surveyLiveSessions, ({ one, many }) => ({
  survey:    one(surveys, { fields: [surveyLiveSessions.surveyId], references: [surveys.id] }),
  host:      one(users,   { fields: [surveyLiveSessions.hostId],   references: [users.id] }),
  responses: many(surveyLiveResponses),
}));

export const surveyLiveResponsesRelations = relations(surveyLiveResponses, ({ one }) => ({
  session:  one(surveyLiveSessions, { fields: [surveyLiveResponses.sessionId], references: [surveyLiveSessions.id] }),
  question: one(surveyQuestions,    { fields: [surveyLiveResponses.questionId], references: [surveyQuestions.id] }),
}));

// ─── Talent Pool ──────────────────────────────────────────────────────────────
// Şirket testi geçen kullanıcılar şirketin aday havuzuna katılabilir
export const talentPoolEntries = pgTable(
  'talent_pool_entries',
  {
    id:          uuid('id').primaryKey().defaultRandom(),
    userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    surveyId:    uuid('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
    companySlug: text('company_slug').notNull(),
    appliedAt:   timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('talent_pool_user_idx').on(t.userId),
    index('talent_pool_company_idx').on(t.companySlug),
    index('talent_pool_survey_idx').on(t.surveyId),
  ]
);

export const talentPoolEntriesRelations = relations(talentPoolEntries, ({ one }) => ({
  user:   one(users,    { fields: [talentPoolEntries.userId],   references: [users.id] }),
  survey: one(surveys,  { fields: [talentPoolEntries.surveyId], references: [surveys.id] }),
}));

import { pgTable, uuid, text, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// ─── Surveys (Anketler) ───────────────────────────────────────────────────────
// questionType: 'single' | 'multiple' | 'text'
// status:       'draft'  | 'active'   | 'ended'

export const surveys = pgTable(
  'surveys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').notNull().default('draft'), // draft|active|ended
    endsAt: timestamp('ends_at', { withTimezone: true }),
    responseCount: integer('response_count').notNull().default(0),
    viewCount: integer('view_count').notNull().default(0),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('surveys_status_idx').on(t.status),
    index('surveys_ends_at_idx').on(t.endsAt),
  ],
);

export const surveyQuestions = pgTable(
  'survey_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    surveyId: uuid('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
    questionText: text('question_text').notNull(),
    type: text('type').notNull().default('single'), // single|multiple|text
    options: jsonb('options').$type<string[]>(),    // for single/multiple
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('survey_q_survey_idx').on(t.surveyId),
  ],
);

export const surveyResponses = pgTable(
  'survey_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    surveyId: uuid('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
    respondentEmail: text('respondent_email'),
    answers: jsonb('answers').notNull().$type<Record<string, string | string[]>>(), // questionId → answer
    source: text('source').notNull().default('sahne'), // sahne|mutfak
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('survey_resp_survey_idx').on(t.surveyId),
    index('survey_resp_created_idx').on(t.createdAt),
  ],
);

export const surveysRelations = relations(surveys, ({ one, many }) => ({
  createdBy: one(users, { fields: [surveys.createdBy], references: [users.id] }),
  questions: many(surveyQuestions),
  responses: many(surveyResponses),
}));

export const surveyQuestionsRelations = relations(surveyQuestions, ({ one }) => ({
  survey: one(surveys, { fields: [surveyQuestions.surveyId], references: [surveys.id] }),
}));

export const surveyResponsesRelations = relations(surveyResponses, ({ one }) => ({
  survey: one(surveys, { fields: [surveyResponses.surveyId], references: [surveys.id] }),
}));

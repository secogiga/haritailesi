import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, desc, asc, sql } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { surveys, surveyQuestions, surveyResponses } from '@haritailesi/database';

@Injectable()
export class SurveysService {
  constructor(@InjectDb() private readonly db: Database) {}

  // ── Public ─────────────────────────────────────────────────────────────────

  async listActive() {
    return this.db.select().from(surveys)
      .where(eq(surveys.status, 'active'))
      .orderBy(desc(surveys.createdAt));
  }

  async getSurveyWithQuestions(id: string) {
    const [survey] = await this.db.select().from(surveys).where(eq(surveys.id, id));
    if (!survey) throw new NotFoundException('Anket bulunamadı.');
    if (survey.status !== 'active') throw new BadRequestException('Bu anket aktif değil.');

    const questions = await this.db.select().from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, id))
      .orderBy(asc(surveyQuestions.sortOrder));

    void this.db
      .update(surveys)
      .set({ viewCount: sql`${surveys.viewCount} + 1` })
      .where(eq(surveys.id, id))
      .catch(() => {});

    return { ...survey, questions };
  }

  async respond(surveyId: string, data: {
    answers: Record<string, string | string[]>;
    respondentEmail?: string;
    source?: string;
  }) {
    const [survey] = await this.db.select().from(surveys).where(eq(surveys.id, surveyId));
    if (!survey) throw new NotFoundException('Anket bulunamadı.');
    if (survey.status !== 'active') throw new BadRequestException('Bu anket katılıma kapalı.');
    if (survey.endsAt && new Date(survey.endsAt) < new Date()) {
      throw new BadRequestException('Anket süresi dolmuş.');
    }

    const [response] = await this.db.insert(surveyResponses).values({
      surveyId,
      answers: data.answers,
      respondentEmail: data.respondentEmail,
      source: data.source ?? 'sahne',
    }).returning();

    await this.db.update(surveys)
      .set({ responseCount: sql`response_count + 1` })
      .where(eq(surveys.id, surveyId));

    return { id: response!.id };
  }

  async getResults(surveyId: string) {
    const [survey] = await this.db.select().from(surveys).where(eq(surveys.id, surveyId));
    if (!survey) throw new NotFoundException('Anket bulunamadı.');

    const questions = await this.db.select().from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, surveyId))
      .orderBy(asc(surveyQuestions.sortOrder));

    const responses = await this.db.select({ answers: surveyResponses.answers })
      .from(surveyResponses)
      .where(eq(surveyResponses.surveyId, surveyId));

    // Aggregate results per question
    const results = questions.map((q) => {
      if (q.type === 'text') {
        const textAnswers = responses
          .map((r) => r.answers[q.id])
          .filter(Boolean)
          .map(String)
          .slice(0, 50); // limit for public display
        return { questionId: q.id, questionText: q.questionText, type: 'text', answers: textAnswers };
      }

      // Count options
      const counts: Record<string, number> = {};
      for (const opt of (q.options ?? [])) counts[opt] = 0;

      for (const r of responses) {
        const ans = r.answers[q.id];
        if (Array.isArray(ans)) {
          for (const a of ans) if (a in counts) counts[a] = (counts[a] ?? 0) + 1;
        } else if (typeof ans === 'string' && ans in counts) {
          counts[ans] = (counts[ans] ?? 0) + 1;
        }
      }

      const total = responses.length;
      const breakdown = Object.entries(counts).map(([option, count]) => ({
        option,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }));

      return { questionId: q.id, questionText: q.questionText, type: q.type, total, breakdown };
    });

    return { survey: { id: survey.id, title: survey.title, responseCount: survey.responseCount }, results };
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  async listAll() {
    return this.db.select().from(surveys).orderBy(desc(surveys.createdAt));
  }

  async create(data: {
    title: string; description?: string; endsAt?: string; createdBy?: string;
  }) {
    const [s] = await this.db.insert(surveys).values({
      ...data,
      endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
    }).returning();
    return s!;
  }

  async update(id: string, data: { title?: string; description?: string; status?: string; endsAt?: string }) {
    const [updated] = await this.db.update(surveys)
      .set({ ...data, endsAt: data.endsAt ? new Date(data.endsAt) : undefined, updatedAt: new Date() })
      .where(eq(surveys.id, id)).returning();
    if (!updated) throw new NotFoundException('Anket bulunamadı.');
    return updated;
  }

  async addQuestion(data: {
    surveyId: string; questionText: string; type: string;
    options?: string[]; sortOrder?: number;
  }) {
    const [q] = await this.db.insert(surveyQuestions).values(data).returning();
    return q!;
  }

  async updateQuestion(id: string, data: Partial<typeof surveyQuestions.$inferInsert>) {
    const [updated] = await this.db.update(surveyQuestions).set(data)
      .where(eq(surveyQuestions.id, id)).returning();
    if (!updated) throw new NotFoundException('Soru bulunamadı.');
    return updated;
  }

  async deleteQuestion(id: string) {
    await this.db.delete(surveyQuestions).where(eq(surveyQuestions.id, id));
    return { deleted: true };
  }

  async getAdminResponses(surveyId: string) {
    const [survey] = await this.db.select().from(surveys).where(eq(surveys.id, surveyId));
    if (!survey) throw new NotFoundException('Anket bulunamadı.');

    const questions = await this.db.select().from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, surveyId))
      .orderBy(asc(surveyQuestions.sortOrder));

    const responses = await this.db.select().from(surveyResponses)
      .where(eq(surveyResponses.surveyId, surveyId))
      .orderBy(desc(surveyResponses.createdAt));

    return { questions, responses, total: responses.length };
  }

  async getAdminDetail(id: string) {
    const [survey] = await this.db.select().from(surveys).where(eq(surveys.id, id));
    if (!survey) throw new NotFoundException('Anket bulunamadı.');

    const questions = await this.db.select().from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, id))
      .orderBy(asc(surveyQuestions.sortOrder));

    return { ...survey, questions };
  }
}

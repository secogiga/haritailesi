import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { examCategories, examQuestions, examAttempts } from '@haritailesi/database';

const QUESTIONS_PER_EXAM = 20; // default soru sayısı

@Injectable()
export class ExamsService {
  constructor(@InjectDb() private readonly db: Database) {}

  // ── Public ─────────────────────────────────────────────────────────────────

  async listCategories() {
    return this.db.select().from(examCategories)
      .where(eq(examCategories.isActive, true))
      .orderBy(asc(examCategories.sortOrder), asc(examCategories.name));
  }

  async getCategoryBySlug(slug: string) {
    const [cat] = await this.db.select().from(examCategories)
      .where(and(eq(examCategories.slug, slug), eq(examCategories.isActive, true)));
    if (!cat) throw new NotFoundException('Sınav kategorisi bulunamadı.');
    return cat;
  }

  // Returns randomised question set (without correct answers — sent separately after attempt)
  async getExamQuestions(slug: string, count?: number) {
    const category = await this.getCategoryBySlug(slug);
    const limit = Math.min(count ?? QUESTIONS_PER_EXAM, 50);

    const questions = await this.db.select({
      id: examQuestions.id,
      questionText: examQuestions.questionText,
      optionA: examQuestions.optionA,
      optionB: examQuestions.optionB,
      optionC: examQuestions.optionC,
      optionD: examQuestions.optionD,
      optionE: examQuestions.optionE,
      difficulty: examQuestions.difficulty,
      source: examQuestions.source,
    })
      .from(examQuestions)
      .where(and(eq(examQuestions.categoryId, category.id), eq(examQuestions.isActive, true)))
      .orderBy(sql`RANDOM()`)
      .limit(limit);

    return { category, questions };
  }

  // Submit attempt — receive answers, return scored result with explanations
  async submitAttempt(data: {
    categorySlug: string;
    answers: Record<string, string>; // questionId → 'a'|'b'|'c'|'d'|'e'
    timeTakenSeconds?: number;
    userId?: string;
  }) {
    const category = await this.getCategoryBySlug(data.categorySlug);
    const questionIds = Object.keys(data.answers);
    if (!questionIds.length) throw new BadRequestException('Cevap gönderilmedi.');

    // Fetch correct answers + explanations
    const correctRows = await this.db.select({
      id: examQuestions.id,
      correctOption: examQuestions.correctOption,
      explanation: examQuestions.explanation,
      questionText: examQuestions.questionText,
      optionA: examQuestions.optionA,
      optionB: examQuestions.optionB,
      optionC: examQuestions.optionC,
      optionD: examQuestions.optionD,
      optionE: examQuestions.optionE,
    })
      .from(examQuestions)
      .where(eq(examQuestions.categoryId, category.id));

    const correctMap = new Map(correctRows.map((q) => [q.id, q]));

    let score = 0;
    const results: {
      questionId: string;
      userAnswer: string;
      correct: boolean;
      correctOption: string;
      explanation: string | null;
      questionText: string;
    }[] = [];

    for (const [qId, userAnswer] of Object.entries(data.answers)) {
      const q = correctMap.get(qId);
      if (!q) continue;
      const correct = q.correctOption === userAnswer;
      if (correct) score++;
      results.push({
        questionId: qId,
        userAnswer,
        correct,
        correctOption: q.correctOption,
        explanation: q.explanation,
        questionText: q.questionText,
      });
    }

    const [attempt] = await this.db.insert(examAttempts).values({
      categoryId: category.id,
      userId: data.userId,
      score,
      totalQuestions: questionIds.length,
      timeTakenSeconds: data.timeTakenSeconds,
      answers: data.answers,
    }).returning();

    return { attemptId: attempt!.id, score, totalQuestions: questionIds.length, results };
  }

  async getCategoryStats(slug: string) {
    const category = await this.getCategoryBySlug(slug);
    const attempts = await this.db.select({
      score: examAttempts.score,
      totalQuestions: examAttempts.totalQuestions,
    })
      .from(examAttempts)
      .where(eq(examAttempts.categoryId, category.id))
      .limit(1000);

    if (!attempts.length) return { category, totalAttempts: 0, avgScore: 0, avgPercent: 0 };

    const avgScore = attempts.reduce((s, a) => s + a.score, 0) / attempts.length;
    const avgPercent = attempts.reduce((s, a) => s + (a.score / a.totalQuestions) * 100, 0) / attempts.length;

    return { category, totalAttempts: attempts.length, avgScore: Math.round(avgScore * 10) / 10, avgPercent: Math.round(avgPercent) };
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  async createCategory(data: {
    name: string; slug: string; description?: string; examType: string;
    iconEmoji?: string; sortOrder?: number;
  }) {
    const [created] = await this.db.insert(examCategories).values(data).returning();
    return created!;
  }

  async updateCategory(id: string, data: Partial<typeof examCategories.$inferInsert>) {
    const [updated] = await this.db.update(examCategories).set(data)
      .where(eq(examCategories.id, id)).returning();
    if (!updated) throw new NotFoundException('Kategori bulunamadı.');
    return updated;
  }

  async createQuestion(data: {
    categoryId: string; questionText: string; optionA: string; optionB: string;
    optionC: string; optionD: string; optionE?: string; correctOption: string;
    explanation?: string; difficulty?: string; source?: string;
  }) {
    const [q] = await this.db.insert(examQuestions).values(data).returning();
    // Update cached question count
    await this.db.update(examCategories)
      .set({ questionCount: sql`question_count + 1` })
      .where(eq(examCategories.id, data.categoryId));
    return q!;
  }

  async updateQuestion(id: string, data: Partial<typeof examQuestions.$inferInsert>) {
    const [updated] = await this.db.update(examQuestions).set(data)
      .where(eq(examQuestions.id, id)).returning();
    if (!updated) throw new NotFoundException('Soru bulunamadı.');
    return updated;
  }

  async listQuestions(categoryId: string) {
    return this.db.select().from(examQuestions)
      .where(eq(examQuestions.categoryId, categoryId))
      .orderBy(desc(examQuestions.createdAt));
  }

  async getAdminStats() {
    const cats = await this.db.select().from(examCategories).orderBy(asc(examCategories.sortOrder));
    const attemptCounts = await this.db.select({
      categoryId: examAttempts.categoryId,
      count: sql<number>`COUNT(*)`,
      avgScore: sql<number>`ROUND(AVG(score::float / total_questions * 100))`,
    })
      .from(examAttempts)
      .groupBy(examAttempts.categoryId);

    const countMap = new Map(attemptCounts.map((r) => [r.categoryId, r]));
    return cats.map((c) => ({
      ...c,
      attemptCount: countMap.get(c.id)?.count ?? 0,
      avgPercent: countMap.get(c.id)?.avgScore ?? 0,
    }));
  }
}

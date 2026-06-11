import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { eq, desc, asc, sql, and, or, inArray, gte, lt } from 'drizzle-orm';
import { Subject } from 'rxjs';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { surveys, surveyQuestions, surveyResponses, competitions, competitionApplications, surveyLiveSessions, surveyLiveResponses, users, userProfiles, trainings, talentPoolEntries } from '@haritailesi/database';
import { EmailService } from '../email/email.service';

@Injectable()
export class SurveysService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly emailService: EmailService,
  ) {}

  // SSE subjects: sessionCode → Subject
  readonly liveSubjects = new Map<string, Subject<{ type: string; data: unknown }>>();

  private getOrCreateSubject(code: string) {
    if (!this.liveSubjects.has(code)) {
      this.liveSubjects.set(code, new Subject());
    }
    return this.liveSubjects.get(code)!;
  }

  private broadcast(code: string, type: string, data: unknown) {
    this.getOrCreateSubject(code).next({ type, data });
  }

  // ── Hub — tek endpoint, sahne/mutfak ana sayfası için ─────────────────────

  async getHub() {
    const [anketler, testler, yarismalar] = await Promise.all([
      this.db.select({ id: surveys.id, slug: surveys.slug, title: surveys.title, description: surveys.description,
        coverImageUrl: surveys.coverImageUrl, responseCount: surveys.responseCount, status: surveys.status,
        viewCount: surveys.viewCount, endsAt: surveys.endsAt, showResults: surveys.showResults })
        .from(surveys)
        .where(and(eq(surveys.type, 'anket'), eq(surveys.status, 'active')))
        .orderBy(desc(surveys.createdAt)).limit(6),

      this.db.select({ id: surveys.id, slug: surveys.slug, title: surveys.title, description: surveys.description,
        coverImageUrl: surveys.coverImageUrl, responseCount: surveys.responseCount, status: surveys.status,
        viewCount: surveys.viewCount, timeLimit: surveys.timeLimit, passingScore: surveys.passingScore, endsAt: surveys.endsAt })
        .from(surveys)
        .where(and(eq(surveys.type, 'test'), eq(surveys.status, 'active')))
        .orderBy(desc(surveys.createdAt)).limit(6),

      this.db.select({ id: competitions.id, slug: competitions.slug, title: competitions.title,
        description: competitions.description, posterKey: competitions.posterKey, deadline: competitions.deadline,
        prizes: competitions.prizes, category: competitions.category, status: competitions.status,
        applicationCount: competitions.applicationCount, viewCount: competitions.viewCount })
        .from(competitions)
        .where(or(eq(competitions.status, 'active'), eq(competitions.status, 'ended')))
        .orderBy(desc(competitions.createdAt)).limit(6),
    ]);

    return { anketler, testler, yarismalar };
  }

  // ── Public: List ──────────────────────────────────────────────────────────

  async listByType(type: 'anket' | 'test') {
    return this.db.select({
      id: surveys.id, slug: surveys.slug, title: surveys.title, description: surveys.description,
      coverImageUrl: surveys.coverImageUrl, status: surveys.status, responseCount: surveys.responseCount,
      viewCount: surveys.viewCount, endsAt: surveys.endsAt, showResults: surveys.showResults,
      timeLimit: surveys.timeLimit, passingScore: surveys.passingScore, createdAt: surveys.createdAt,
    }).from(surveys)
      .where(and(eq(surveys.type, type), inArray(surveys.status, ['active', 'ended'])))
      .orderBy(desc(surveys.createdAt));
  }

  async listActive() {
    return this.db.select().from(surveys)
      .where(and(eq(surveys.status, 'active'), inArray(surveys.type, ['anket', 'test'])))
      .orderBy(desc(surveys.createdAt));
  }

  // ── Public: Detail ────────────────────────────────────────────────────────

  async getSurveyWithQuestions(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const [survey] = await this.db.select().from(surveys)
      .where(isUuid ? eq(surveys.id, idOrSlug) : eq(surveys.slug, idOrSlug));
    if (!survey) throw new NotFoundException('İçerik bulunamadı.');
    if (survey.status === 'draft') throw new BadRequestException('Bu içerik henüz yayınlanmadı.');

    const questions = await this.db.select({
      id: surveyQuestions.id, questionText: surveyQuestions.questionText, type: surveyQuestions.type,
      options: surveyQuestions.options, points: surveyQuestions.points,
      required: surveyQuestions.required, sortOrder: surveyQuestions.sortOrder,
      // correctOptions sadece test sonuçlarında döner, burada gizli
    }).from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, survey.id))
      .orderBy(asc(surveyQuestions.sortOrder));

    void this.db.update(surveys)
      .set({ viewCount: sql`${surveys.viewCount} + 1` })
      .where(eq(surveys.id, survey.id)).catch(() => {});

    return { ...survey, questions };
  }

  // ── Public: Submit ────────────────────────────────────────────────────────

  async respond(surveyId: string, data: {
    answers: Record<string, string | string[]>;
    respondentEmail?: string;
    userId?: string;
    source?: string;
    timeTaken?: number;
  }) {
    const [survey] = await this.db.select().from(surveys).where(eq(surveys.id, surveyId));
    if (!survey) throw new NotFoundException('Anket bulunamadı.');
    if (survey.status !== 'active') throw new BadRequestException('Bu içerik katılıma kapalı.');
    if (survey.endsAt && new Date(survey.endsAt) < new Date()) {
      throw new BadRequestException('Süre dolmuş.');
    }
    if (!survey.allowAnonymous && !data.userId && !data.respondentEmail) {
      throw new BadRequestException('Bu içerik için giriş yapmanız gerekiyor.');
    }

    // Test skorlaması
    let score: number | undefined;
    let maxScore: number | undefined;
    if (survey.type === 'test') {
      const questions = await this.db.select().from(surveyQuestions)
        .where(eq(surveyQuestions.surveyId, surveyId));
      maxScore = questions.reduce((s, q) => s + q.points, 0);
      score = 0;
      for (const q of questions) {
        if (!q.correctOptions?.length) continue;
        const given = data.answers[q.id];
        const givenArr = Array.isArray(given) ? given : given ? [given] : [];
        const correct = q.correctOptions;
        const isCorrect = givenArr.length === correct.length &&
          givenArr.every(g => correct.includes(g));
        if (isCorrect) score += q.points;
      }
    }

    const willPass = survey.type === 'test' && score !== undefined && maxScore
      ? (survey.passingScore != null ? Math.round((score / maxScore) * 100) >= survey.passingScore : false)
      : false;
    const certCode = willPass
      ? Math.random().toString(36).slice(2, 10).toUpperCase() + Date.now().toString(36).toUpperCase()
      : undefined;

    const [response] = await this.db.insert(surveyResponses).values({
      surveyId,
      answers: data.answers,
      respondentEmail: data.respondentEmail,
      userId: data.userId,
      source: data.source ?? 'sahne',
      timeTaken: data.timeTaken,
      score,
      maxScore,
      certCode,
    }).returning();

    await this.db.update(surveys)
      .set({ responseCount: sql`response_count + 1` })
      .where(eq(surveys.id, surveyId));

    const result: Record<string, unknown> = { id: response!.id };
    if (survey.type === 'test') {
      result.score = score;
      result.maxScore = maxScore;
      result.percent = maxScore ? Math.round((score! / maxScore) * 100) : 0;
      result.passed = survey.passingScore != null
        ? (result.percent as number) >= survey.passingScore
        : null;
      if (certCode) result.certCode = certCode;
      if (certCode && survey.companySlug) result.companySlug = survey.companySlug;

      // Soru bazlı doğru/yanlış detayı
      if (survey.showResults) {
        const questions = await this.db.select().from(surveyQuestions)
          .where(eq(surveyQuestions.surveyId, surveyId));
        result.questionResults = questions.map((q) => {
          const given = data.answers[q.id];
          const givenArr = Array.isArray(given) ? given : given ? [given] : [];
          const correct = q.correctOptions ?? [];
          const isCorrect = correct.length > 0 && givenArr.length === correct.length &&
            givenArr.every(g => correct.includes(g));
          return {
            questionId: q.id,
            questionText: q.questionText,
            isCorrect,
            correctOptions: correct,
            explanation: q.explanation,
            points: q.points,
            earned: isCorrect ? q.points : 0,
          };
        });
      }
    }

    // Platform bağlantısı — test geçince eğitim önerisi + proje hakkı
    if (survey.type === 'test' && result.passed === true && data.userId) {
      try {
        const [previousResponses, questionRows] = await Promise.all([
          this.db.select({ score: surveyResponses.score, maxScore: surveyResponses.maxScore, passingScore: surveys.passingScore })
            .from(surveyResponses)
            .innerJoin(surveys, eq(surveyResponses.surveyId, surveys.id))
            .where(and(eq(surveyResponses.userId, data.userId), eq(surveys.type, 'test'))),
          this.db.select({ topicTags: surveyQuestions.topicTags })
            .from(surveyQuestions)
            .where(eq(surveyQuestions.surveyId, surveyId)),
        ]);

        const totalPassed = previousResponses.filter(r =>
          r.maxScore && r.passingScore &&
          Math.round(((r.score ?? 0) / r.maxScore) * 100) >= r.passingScore
        ).length;

        const allTags = [...new Set(questionRows.flatMap(q => q.topicTags ?? []))];
        let suggestedTrainings: { id: string; title: string; slug: string; level: string | null }[] = [];

        if (allTags.length > 0) {
          const published = await this.db
            .select({ id: trainings.id, title: trainings.title, slug: trainings.slug, level: trainings.level, tags: trainings.tags })
            .from(trainings).where(eq(trainings.isPublished, true)).limit(30);
          suggestedTrainings = published
            .filter(t => (t.tags ?? []).some(tag => allTags.includes(tag)))
            .slice(0, 3)
            .map(({ id, title, slug, level }) => ({ id, title, slug, level }));
        }

        result.platformLinks = {
          testsPassed: totalPassed,
          canApplyToProjects: totalPassed >= 3,
          suggestedTrainings,
        };
      } catch { /* platform bağlantısı sonucu engellemez */ }
    }

    // E-posta bildirimleri
    const emailTarget = data.respondentEmail
      ?? (data.userId ? (await this.db.select({ email: users.email }).from(users).where(eq(users.id, data.userId)).then(r => r[0]?.email)) : undefined);

    if (emailTarget) {
      if (survey.type === 'test' && result.passed === true) {
        void this.emailService.sendTestCertificate(
          emailTarget,
          emailTarget.split('@')[0] ?? 'Katılımcı',
          survey.title,
          result.score as number,
          result.maxScore as number,
          result.percent as number,
        ).catch(() => {});
      } else if (survey.type === 'anket') {
        void this.emailService.sendSurveyParticipated(
          emailTarget,
          emailTarget.split('@')[0] ?? 'Katılımcı',
          survey.title,
        ).catch(() => {});
      }
    }

    return result;
  }

  // ── Public: Test Leaderboard ──────────────────────────────────────────────

  async getTestLeaderboard(surveyId: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(surveyId);
    const [survey] = await this.db.select({ id: surveys.id, type: surveys.type, passingScore: surveys.passingScore })
      .from(surveys)
      .where(isUuid ? eq(surveys.id, surveyId) : eq(surveys.slug, surveyId));
    if (!survey) throw new NotFoundException('Test bulunamadı.');
    if (survey.type !== 'test') throw new BadRequestException('Sadece testler için liderboard mevcuttur.');

    const rows = await this.db
      .select({
        score: surveyResponses.score,
        maxScore: surveyResponses.maxScore,
        timeTaken: surveyResponses.timeTaken,
        createdAt: surveyResponses.createdAt,
        respondentEmail: surveyResponses.respondentEmail,
        displayName: users.displayName,
      })
      .from(surveyResponses)
      .leftJoin(users, eq(surveyResponses.userId, users.id))
      .where(and(eq(surveyResponses.surveyId, survey.id), sql`${surveyResponses.score} IS NOT NULL`))
      .orderBy(
        desc(sql`CASE WHEN ${surveyResponses.maxScore} > 0 THEN ${surveyResponses.score}::float / ${surveyResponses.maxScore} ELSE 0 END`),
        asc(surveyResponses.timeTaken),
      )
      .limit(20);

    return rows.map((r, i) => {
      const percent = r.maxScore ? Math.round((r.score! / r.maxScore) * 100) : 0;
      let name = 'Anonim';
      if (r.displayName) name = r.displayName;
      else if (r.respondentEmail) {
        const local = r.respondentEmail.split('@')[0] ?? '';
        name = local.slice(0, 2) + '***';
      }
      return {
        rank: i + 1,
        name,
        percent,
        timeTaken: r.timeTaken,
        passed: survey.passingScore != null ? percent >= survey.passingScore : null,
        createdAt: r.createdAt,
      };
    });
  }

  // ── Public: Results ───────────────────────────────────────────────────────

  async getResults(surveyId: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(surveyId);
    const [survey] = await this.db.select().from(surveys)
      .where(isUuid ? eq(surveys.id, surveyId) : eq(surveys.slug, surveyId));
    if (!survey) throw new NotFoundException('Bulunamadı.');
    if (!survey.showResults) throw new BadRequestException('Sonuçlar kamuya açık değil.');

    const questions = await this.db.select().from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, survey.id))
      .orderBy(asc(surveyQuestions.sortOrder));

    const responses = await this.db.select({ answers: surveyResponses.answers })
      .from(surveyResponses)
      .where(eq(surveyResponses.surveyId, survey.id));

    const results = questions.map((q) => {
      if (q.type === 'text') {
        return { questionId: q.id, questionText: q.questionText, type: 'text',
          answers: responses.map((r) => r.answers[q.id]).filter(Boolean).map(String).slice(0, 50) };
      }
      const counts: Record<string, number> = {};
      for (const opt of (q.options ?? [])) counts[opt] = 0;
      for (const r of responses) {
        const ans = r.answers[q.id];
        if (Array.isArray(ans)) { for (const a of ans) if (a in counts) counts[a]! ++; }
        else if (typeof ans === 'string' && ans in counts) counts[ans]!++;
      }
      const total = responses.length;
      return {
        questionId: q.id, questionText: q.questionText, type: q.type, total,
        breakdown: Object.entries(counts).map(([option, count]) => ({
          option, count, percent: total > 0 ? Math.round((count / total) * 100) : 0,
          isCorrect: q.correctOptions?.includes(option) ?? false,
        })),
      };
    });

    return { survey: { id: survey.id, slug: survey.slug, title: survey.title, type: survey.type,
      responseCount: survey.responseCount, status: survey.status }, results };
  }

  // ── User history ─────────────────────────────────────────────────────────

  async getUserHistory(userId: string) {
    const rows = await this.db
      .select({
        responseId: surveyResponses.id,
        surveyId: surveys.id,
        slug: surveys.slug,
        title: surveys.title,
        type: surveys.type,
        passingScore: surveys.passingScore,
        showResults: surveys.showResults,
        score: surveyResponses.score,
        maxScore: surveyResponses.maxScore,
        timeTaken: surveyResponses.timeTaken,
        completedAt: surveyResponses.createdAt,
      })
      .from(surveyResponses)
      .innerJoin(surveys, eq(surveyResponses.surveyId, surveys.id))
      .where(eq(surveyResponses.userId, userId))
      .orderBy(desc(surveyResponses.createdAt))
      .limit(50);

    return rows.map(r => {
      const percent = r.maxScore && r.score != null ? Math.round((r.score / r.maxScore) * 100) : null;
      const passed = percent != null && r.passingScore != null ? percent >= r.passingScore : null;
      return { ...r, percent, passed };
    });
  }

  // ── Konu Analizi ──────────────────────────────────────────────────────────

  async getTopicAnalysis(userId: string) {
    // Kullanıcının tüm test yanıtlarını al
    const responses = await this.db
      .select({
        surveyId: surveyResponses.surveyId,
        answers: surveyResponses.answers,
        passingScore: surveys.passingScore,
        certCode: surveyResponses.certCode,
      })
      .from(surveyResponses)
      .innerJoin(surveys, eq(surveyResponses.surveyId, surveys.id))
      .where(and(eq(surveyResponses.userId, userId), eq(surveys.type, 'test')));

    if (!responses.length) return { topics: [], totalTests: 0, totalQuestions: 0, totalPassed: 0 };

    const surveyIds = [...new Set(responses.map(r => r.surveyId))];
    const allQuestions = await this.db
      .select({
        id: surveyQuestions.id,
        surveyId: surveyQuestions.surveyId,
        correctOptions: surveyQuestions.correctOptions,
        topicTags: surveyQuestions.topicTags,
      })
      .from(surveyQuestions)
      .where(and(inArray(surveyQuestions.surveyId, surveyIds)));

    // questionId → question map
    const qMap = new Map(allQuestions.map(q => [q.id, q]));

    // topic → { correct, total }
    const topicMap = new Map<string, { correct: number; total: number; wrongIds: string[] }>();
    let totalQuestions = 0;

    for (const resp of responses) {
      for (const [qId, given] of Object.entries(resp.answers)) {
        const q = qMap.get(qId);
        if (!q?.correctOptions?.length || !q.topicTags?.length) continue;
        const givenArr = Array.isArray(given) ? given : given ? [given] : [];
        const correct = q.correctOptions;
        const isCorrect = givenArr.length === correct.length && givenArr.every(g => correct.includes(g));
        totalQuestions++;

        for (const tag of q.topicTags) {
          const prev = topicMap.get(tag) ?? { correct: 0, total: 0, wrongIds: [] };
          topicMap.set(tag, {
            correct: prev.correct + (isCorrect ? 1 : 0),
            total: prev.total + 1,
            wrongIds: isCorrect ? prev.wrongIds : [...prev.wrongIds.slice(-2), q.id],
          });
        }
      }
    }

    const topics = [...topicMap.entries()]
      .filter(([, d]) => d.total >= 2)
      .map(([topic, d]) => ({
        topic,
        correct: d.correct,
        total: d.total,
        percent: Math.round((d.correct / d.total) * 100),
        level: d.correct / d.total >= 0.7 ? 'strong' as const : d.correct / d.total >= 0.5 ? 'medium' as const : 'weak' as const,
      }))
      .sort((a, b) => a.percent - b.percent); // zayıflar önce

    const totalPassed = responses.filter(r => r.certCode != null).length;
    return { topics, totalTests: responses.length, totalQuestions, totalPassed };
  }

  // ── Sertifika doğrulama (public) ─────────────────────────────────────────

  async getCertByCode(code: string) {
    const [row] = await this.db
      .select({
        certCode: surveyResponses.certCode,
        surveyTitle: surveys.title,
        score: surveyResponses.score,
        maxScore: surveyResponses.maxScore,
        completedAt: surveyResponses.createdAt,
        displayName: users.email,
      })
      .from(surveyResponses)
      .innerJoin(surveys, eq(surveyResponses.surveyId, surveys.id))
      .leftJoin(users, eq(surveyResponses.userId, users.id))
      .where(eq(surveyResponses.certCode, code));

    if (!row) throw new NotFoundException('Sertifika bulunamadı.');
    const percent = row.maxScore && row.score != null ? Math.round((row.score / row.maxScore) * 100) : null;
    return {
      certCode: row.certCode,
      surveyTitle: row.surveyTitle,
      score: row.score,
      maxScore: row.maxScore,
      percent,
      completedAt: row.completedAt,
      name: row.displayName ?? 'Anonim',
    };
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  async listAll(type?: string) {
    const cond = type ? and(eq(surveys.type, type)) : undefined;
    return this.db.select().from(surveys)
      .where(cond).orderBy(desc(surveys.createdAt));
  }

  async create(data: {
    title: string; type?: string; description?: string; slug?: string;
    endsAt?: string; coverImageUrl?: string; allowAnonymous?: boolean;
    showResults?: boolean; timeLimit?: number; passingScore?: number; createdBy?: string;
  }) {
    if (data.slug) {
      const [existing] = await this.db.select({ id: surveys.id }).from(surveys)
        .where(eq(surveys.slug, data.slug));
      if (existing) throw new ConflictException('Bu slug zaten kullanımda.');
    }
    const [s] = await this.db.insert(surveys).values({
      ...data,
      slug: data.slug ?? null,
      endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
    }).returning();
    return s!;
  }

  async update(id: string, data: {
    title?: string; type?: string; description?: string; slug?: string; status?: string;
    endsAt?: string; coverImageUrl?: string; allowAnonymous?: boolean;
    showResults?: boolean; timeLimit?: number; passingScore?: number;
  }) {
    const [updated] = await this.db.update(surveys)
      .set({ ...data, endsAt: data.endsAt ? new Date(data.endsAt) : undefined, updatedAt: new Date() })
      .where(eq(surveys.id, id)).returning();
    if (!updated) throw new NotFoundException('Anket bulunamadı.');
    return updated;
  }

  async addQuestion(data: {
    surveyId: string; questionText: string; type: string;
    options?: string[]; correctOptions?: string[]; points?: number;
    explanation?: string; required?: boolean; sortOrder?: number;
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

  async getAdminDetail(id: string) {
    const [survey] = await this.db.select().from(surveys).where(eq(surveys.id, id));
    if (!survey) throw new NotFoundException('Anket bulunamadı.');
    const questions = await this.db.select().from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, id)).orderBy(asc(surveyQuestions.sortOrder));
    return { ...survey, questions };
  }

  async getAdminResponses(surveyId: string) {
    const [survey] = await this.db.select().from(surveys).where(eq(surveys.id, surveyId));
    if (!survey) throw new NotFoundException('Anket bulunamadı.');
    const questions = await this.db.select().from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, surveyId)).orderBy(asc(surveyQuestions.sortOrder));
    const responses = await this.db.select().from(surveyResponses)
      .where(eq(surveyResponses.surveyId, surveyId)).orderBy(desc(surveyResponses.createdAt));
    return { questions, responses, total: responses.length };
  }

  async getAdminStats(surveyId: string) {
    const [survey] = await this.db.select().from(surveys).where(eq(surveys.id, surveyId));
    if (!survey) throw new NotFoundException('Anket bulunamadı.');
    const responses = await this.db.select({ score: surveyResponses.score, maxScore: surveyResponses.maxScore,
      createdAt: surveyResponses.createdAt, timeTaken: surveyResponses.timeTaken })
      .from(surveyResponses).where(eq(surveyResponses.surveyId, surveyId));

    if (survey.type !== 'test') return { total: responses.length };

    const scored = responses.filter(r => r.score != null && r.maxScore != null);
    const avg = scored.length ? Math.round(scored.reduce((s, r) => s + (r.score! / r.maxScore!) * 100, 0) / scored.length) : null;
    const passed = survey.passingScore != null
      ? scored.filter(r => Math.round((r.score! / r.maxScore!) * 100) >= survey.passingScore!).length : null;
    return { total: responses.length, avgScore: avg, passCount: passed, passRate: passed != null && responses.length ? Math.round((passed / responses.length) * 100) : null };
  }

  // ── Canlı Oturumlar ───────────────────────────────────────────────────────

  private generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async createLiveSession(surveyId: string, hostId?: string) {
    const [survey] = await this.db.select({ id: surveys.id, status: surveys.status })
      .from(surveys).where(eq(surveys.id, surveyId));
    if (!survey) throw new NotFoundException('Anket bulunamadı.');

    let code: string;
    let attempts = 0;
    do {
      code = this.generateCode();
      const [existing] = await this.db.select({ id: surveyLiveSessions.id })
        .from(surveyLiveSessions).where(and(eq(surveyLiveSessions.code, code), eq(surveyLiveSessions.status, 'waiting')));
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    const [session] = await this.db.insert(surveyLiveSessions).values({
      surveyId, hostId, code: code!, status: 'waiting', currentQuestionIndex: -1,
    }).returning();
    return session!;
  }

  async getLiveSession(code: string) {
    const [session] = await this.db.select().from(surveyLiveSessions)
      .where(eq(surveyLiveSessions.code, code));
    if (!session) throw new NotFoundException('Oturum bulunamadı.');
    const questions = await this.db.select({
      id: surveyQuestions.id, questionText: surveyQuestions.questionText,
      type: surveyQuestions.type, options: surveyQuestions.options,
      imageUrl: surveyQuestions.imageUrl, sortOrder: surveyQuestions.sortOrder,
    }).from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, session.surveyId))
      .orderBy(asc(surveyQuestions.sortOrder));
    return { ...session, questions };
  }

  async advanceLiveQuestion(code: string) {
    const [session] = await this.db.select().from(surveyLiveSessions)
      .where(eq(surveyLiveSessions.code, code));
    if (!session) throw new NotFoundException('Oturum bulunamadı.');
    if (session.status === 'ended') throw new BadRequestException('Oturum sona erdi.');

    const [survey] = await this.db.select({ timeLimit: surveys.timeLimit })
      .from(surveys).where(eq(surveys.id, session.surveyId));

    const questions = await this.db.select({ id: surveyQuestions.id })
      .from(surveyQuestions).where(eq(surveyQuestions.surveyId, session.surveyId))
      .orderBy(asc(surveyQuestions.sortOrder));

    const nextIndex = session.currentQuestionIndex + 1;
    const isLast = nextIndex >= questions.length;

    const newStatus = isLast ? 'showing_results' : 'active';
    const [updated] = await this.db.update(surveyLiveSessions)
      .set({ currentQuestionIndex: isLast ? session.currentQuestionIndex : nextIndex, status: newStatus,
        startedAt: session.startedAt ?? new Date() })
      .where(eq(surveyLiveSessions.code, code)).returning();

    this.broadcast(code, 'advance', {
      index: updated!.currentQuestionIndex,
      status: newStatus,
      total: questions.length,
      timeLimit: survey?.timeLimit ?? null,
    });
    return updated!;
  }

  async endLiveSession(code: string) {
    const [updated] = await this.db.update(surveyLiveSessions)
      .set({ status: 'ended', endedAt: new Date() })
      .where(eq(surveyLiveSessions.code, code)).returning();
    if (!updated) throw new NotFoundException('Oturum bulunamadı.');
    this.broadcast(code, 'ended', {});
    this.liveSubjects.get(code)?.complete();
    this.liveSubjects.delete(code);
    return updated;
  }

  async joinLiveSession(code: string, participantId: string, participantName?: string) {
    const [session] = await this.db.select({ id: surveyLiveSessions.id, status: surveyLiveSessions.status,
      participantCount: surveyLiveSessions.participantCount })
      .from(surveyLiveSessions).where(eq(surveyLiveSessions.code, code));
    if (!session) throw new NotFoundException('Oturum bulunamadı.');
    if (session.status === 'ended') throw new BadRequestException('Oturum sona erdi.');

    await this.db.update(surveyLiveSessions)
      .set({ participantCount: sql`participant_count + 1` })
      .where(eq(surveyLiveSessions.code, code));

    this.broadcast(code, 'joined', { participantId, participantName, count: session.participantCount + 1 });
    return { joined: true };
  }

  async submitLiveResponse(code: string, questionId: string, participantId: string, answer: string[], participantName?: string) {
    const [session] = await this.db.select({ id: surveyLiveSessions.id, currentQuestionIndex: surveyLiveSessions.currentQuestionIndex })
      .from(surveyLiveSessions).where(eq(surveyLiveSessions.code, code));
    if (!session) throw new NotFoundException('Oturum bulunamadı.');

    const [r] = await this.db.insert(surveyLiveResponses).values({
      sessionId: session.id, questionId, participantId, participantName, answer,
    }).returning();

    const [cnt] = await this.db.select({ count: sql<number>`count(*)` })
      .from(surveyLiveResponses)
      .where(and(eq(surveyLiveResponses.sessionId, session.id), eq(surveyLiveResponses.questionId, questionId)));
    this.broadcast(code, 'response', { questionId, responseCount: Number(cnt?.count ?? 0) });

    const leaderboard = await this.computeLeaderboard(session.id);
    this.broadcast(code, 'leaderboard', leaderboard);

    return r!;
  }

  async computeLeaderboard(sessionId: string) {
    const responses = await this.db
      .select({
        participantId: surveyLiveResponses.participantId,
        participantName: surveyLiveResponses.participantName,
        questionId: surveyLiveResponses.questionId,
        answer: surveyLiveResponses.answer,
      })
      .from(surveyLiveResponses)
      .where(eq(surveyLiveResponses.sessionId, sessionId));

    if (responses.length === 0) return [];

    const questionIds = [...new Set(responses.map(r => r.questionId))];
    const questions = await this.db
      .select({ id: surveyQuestions.id, correctOptions: surveyQuestions.correctOptions, points: surveyQuestions.points })
      .from(surveyQuestions)
      .where(inArray(surveyQuestions.id, questionIds));

    const qMap = new Map(questions.map(q => [q.id, q]));

    const scores = new Map<string, { participantName: string | null; score: number }>();
    for (const r of responses) {
      const q = qMap.get(r.questionId);
      if (!q) continue;
      const entry = scores.get(r.participantId) ?? { participantName: r.participantName, score: 0 };
      const ans = r.answer as string[];
      const correct = q.correctOptions ?? [];
      const isCorrect = correct.length > 0 &&
        correct.every(c => ans.includes(c)) &&
        ans.every(a => correct.includes(a));
      if (isCorrect) entry.score += q.points;
      scores.set(r.participantId, entry);
    }

    return [...scores.entries()]
      .map(([participantId, { participantName, score }]) => ({ participantId, participantName, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  async getLiveResults(code: string) {
    const [session] = await this.db.select().from(surveyLiveSessions)
      .where(eq(surveyLiveSessions.code, code));
    if (!session) throw new NotFoundException('Oturum bulunamadı.');

    const questions = await this.db.select().from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, session.surveyId))
      .orderBy(asc(surveyQuestions.sortOrder));

    const liveResponses = await this.db.select().from(surveyLiveResponses)
      .where(eq(surveyLiveResponses.sessionId, session.id));

    const results = questions.map((q) => {
      const qResponses = liveResponses.filter(r => r.questionId === q.id);
      const counts: Record<string, number> = {};
      for (const opt of (q.options ?? [])) counts[opt] = 0;
      for (const r of qResponses) {
        for (const a of (r.answer as string[])) { if (a in counts) counts[a]!++; }
      }
      return {
        questionId: q.id, questionText: q.questionText, type: q.type, total: qResponses.length,
        breakdown: Object.entries(counts).map(([option, count]) => ({
          option, count, percent: qResponses.length > 0 ? Math.round((count / qResponses.length) * 100) : 0,
          isCorrect: q.correctOptions?.includes(option) ?? false,
        })),
      };
    });

    return { session, results, totalParticipants: session.participantCount };
  }

  // ── Meslek Segmentasyonu ──────────────────────────────────────────────────

  async getSegmentedResults(surveyId: string) {
    const [survey] = await this.db.select({ passingScore: surveys.passingScore })
      .from(surveys).where(eq(surveys.id, surveyId));

    const rows = await this.db.select({
      score: surveyResponses.score,
      maxScore: surveyResponses.maxScore,
      profession: userProfiles.profession,
      city: userProfiles.city,
      experienceYears: userProfiles.professionalExperienceYears,
      workStatus: userProfiles.workStatus,
    })
      .from(surveyResponses)
      .leftJoin(users, eq(surveyResponses.userId, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(surveyResponses.surveyId, surveyId));

    const profMap = new Map<string, { count: number; totalScore: number; passed: number }>();
    const cityMap = new Map<string, number>();
    const expMap = new Map<string, { count: number; totalScore: number }>();
    const wsMap = new Map<string, number>();
    const threshold = survey?.passingScore ?? 60;

    for (const r of rows) {
      const pct = r.maxScore ? Math.round(((r.score ?? 0) / r.maxScore) * 100) : null;
      const prof = r.profession ?? 'Belirtmemiş';
      const prev = profMap.get(prof) ?? { count: 0, totalScore: 0, passed: 0 };
      profMap.set(prof, { count: prev.count + 1, totalScore: prev.totalScore + (pct ?? 0), passed: prev.passed + (pct !== null && pct >= threshold ? 1 : 0) });

      const city = r.city ?? 'Belirtmemiş';
      cityMap.set(city, (cityMap.get(city) ?? 0) + 1);

      const exp = r.experienceYears;
      const bucket = exp == null ? 'Belirtmemiş' : exp <= 2 ? '0–2 yıl' : exp <= 5 ? '3–5 yıl' : exp <= 10 ? '6–10 yıl' : '10+ yıl';
      const prevExp = expMap.get(bucket) ?? { count: 0, totalScore: 0 };
      expMap.set(bucket, { count: prevExp.count + 1, totalScore: prevExp.totalScore + (pct ?? 0) });

      const ws = r.workStatus ?? 'Belirtmemiş';
      wsMap.set(ws, (wsMap.get(ws) ?? 0) + 1);
    }

    return {
      total: rows.length,
      byProfession: [...profMap.entries()]
        .map(([profession, d]) => ({ profession, count: d.count, avgScore: d.count ? Math.round(d.totalScore / d.count) : 0, passRate: d.count ? Math.round((d.passed / d.count) * 100) : 0 }))
        .sort((a, b) => b.count - a.count).slice(0, 12),
      byCity: [...cityMap.entries()]
        .filter(([c]) => c !== 'Belirtmemiş')
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count),
      byExperience: [...expMap.entries()]
        .map(([range, d]) => ({ range, count: d.count, avgScore: d.count ? Math.round(d.totalScore / d.count) : 0 })),
      byWorkStatus: [...wsMap.entries()]
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  // ── Yıllık Sektör Raporu ──────────────────────────────────────────────────

  async getSectorReport(year?: number) {
    const y = year ?? new Date().getFullYear();
    const start = new Date(y, 0, 1);
    const end   = new Date(y + 1, 0, 1);

    const rows = await this.db.select({
      surveyTitle: surveys.title,
      surveyType:  surveys.type,
      score:       surveyResponses.score,
      maxScore:    surveyResponses.maxScore,
      profession:  userProfiles.profession,
      city:        userProfiles.city,
      createdAt:   surveyResponses.createdAt,
    })
      .from(surveyResponses)
      .innerJoin(surveys, eq(surveyResponses.surveyId, surveys.id))
      .leftJoin(users, eq(surveyResponses.userId, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(and(gte(surveyResponses.createdAt, start), lt(surveyResponses.createdAt, end)));

    const totalResponses = rows.length;
    const testRows = rows.filter(r => r.surveyType === 'test' && r.maxScore);
    const avgScore = testRows.length
      ? Math.round(testRows.reduce((s, r) => s + Math.round(((r.score ?? 0) / r.maxScore!) * 100), 0) / testRows.length)
      : null;

    // Monthly trend
    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const monthlyMap = new Map<number, number>(monthNames.map((_, i) => [i, 0]));
    for (const r of rows) monthlyMap.set(r.createdAt.getMonth(), (monthlyMap.get(r.createdAt.getMonth()) ?? 0) + 1);
    const monthlyTrend = [...monthlyMap.entries()].map(([m, count]) => ({ month: monthNames[m]!, count }));

    // Profession breakdown
    const profMap = new Map<string, { count: number; totalScore: number }>();
    for (const r of rows) {
      const prof = r.profession ?? 'Belirtmemiş';
      const pct  = r.maxScore ? Math.round(((r.score ?? 0) / r.maxScore) * 100) : 0;
      const prev = profMap.get(prof) ?? { count: 0, totalScore: 0 };
      profMap.set(prof, { count: prev.count + 1, totalScore: prev.totalScore + pct });
    }
    const profBreakdown = [...profMap.entries()]
      .filter(([p]) => p !== 'Belirtmemiş')
      .map(([profession, d]) => ({ profession, count: d.count, avgScore: d.count ? Math.round(d.totalScore / d.count) : 0 }))
      .sort((a, b) => b.count - a.count).slice(0, 10);

    // City breakdown
    const cityMap = new Map<string, number>();
    for (const r of rows) {
      const city = r.city ?? 'Belirtmemiş';
      if (city !== 'Belirtmemiş') cityMap.set(city, (cityMap.get(city) ?? 0) + 1);
    }
    const cityBreakdown = [...cityMap.entries()]
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count).slice(0, 20);

    // Top surveys by response count
    const surveyMap = new Map<string, number>();
    for (const r of rows) surveyMap.set(r.surveyTitle, (surveyMap.get(r.surveyTitle) ?? 0) + 1);
    const topSurveys = [...surveyMap.entries()]
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count).slice(0, 5);

    return { year: y, totalResponses, avgScore, monthlyTrend, profBreakdown, cityBreakdown, topSurveys };
  }

  // ── Talent Pool ───────────────────────────────────────────────────────────

  async joinTalentPool(userId: string, surveyId: string, companySlug: string) {
    const [survey] = await this.db.select({ id: surveys.id, companySlug: surveys.companySlug })
      .from(surveys).where(eq(surveys.id, surveyId));
    if (!survey) throw new NotFoundException('Test bulunamadı.');
    if (survey.companySlug !== companySlug) throw new BadRequestException('Bu test bu şirkete ait değil.');

    // Test geçildi mi kontrol et
    const [passed] = await this.db.select({ certCode: surveyResponses.certCode })
      .from(surveyResponses)
      .where(and(eq(surveyResponses.userId, userId), eq(surveyResponses.surveyId, surveyId), sql`${surveyResponses.certCode} IS NOT NULL`));
    if (!passed) throw new BadRequestException('Havuza katılmak için testi geçmeniz gerekiyor.');

    // Duplicate kontrolü
    const [existing] = await this.db.select({ id: talentPoolEntries.id })
      .from(talentPoolEntries)
      .where(and(eq(talentPoolEntries.userId, userId), eq(talentPoolEntries.surveyId, surveyId)));
    if (existing) return { joined: true, existing: true };

    const [entry] = await this.db.insert(talentPoolEntries).values({ userId, surveyId, companySlug }).returning();
    return { joined: true, existing: false, id: entry!.id };
  }

  async getMyTalentPool(userId: string) {
    const rows = await this.db.select({
      id: talentPoolEntries.id,
      companySlug: talentPoolEntries.companySlug,
      appliedAt: talentPoolEntries.appliedAt,
      surveyTitle: surveys.title,
      surveySlug: surveys.slug,
    })
      .from(talentPoolEntries)
      .innerJoin(surveys, eq(talentPoolEntries.surveyId, surveys.id))
      .where(eq(talentPoolEntries.userId, userId))
      .orderBy(desc(talentPoolEntries.appliedAt));
    return rows;
  }

  async companyRequest(dto: { companyName: string; contactEmail: string; testTitle: string; notes?: string }) {
    const adminEmail = process.env['ADMIN_EMAIL'] ?? 'info@haritailesi.org';
    const body = `Şirket: ${dto.companyName}\nE-posta: ${dto.contactEmail}\nTest Konusu: ${dto.testTitle}${dto.notes ? `\nNotlar: ${dto.notes}` : ''}`;
    try {
      await this.emailService['send'](adminEmail, 'admin_broadcast', {
        recipientName: 'Admin',
        subject: `Yeni Şirket Test Talebi — ${dto.companyName}`,
        body,
      });
    } catch {
      console.warn('[companyRequest] email gönderilemedi, istek alındı:', dto.companyName);
    }
    return { ok: true };
  }
}

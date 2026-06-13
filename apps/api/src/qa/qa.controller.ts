import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query,
  ParseUUIDPipe, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import {
  IsString, IsEmail, IsOptional, IsIn, IsBoolean, MaxLength, IsNotEmpty,
} from 'class-validator';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import {
  communityQuestions, communityAnswers, communityAnswerVotes, userProfiles, users, posts,
} from '@haritailesi/database';
import { eq, desc, and, sql as drizzleSql, type SQL } from 'drizzle-orm';

const TIER_DISPLAY: Record<string, string> = {
  registered_user: 'Kayıtlı',
  haritailesi_genc: 'Haritailesi Genç',
  new_graduate_member: 'Mesleğin Geleceği',
  individual_member: 'Mesleğin Değer Ortağı',
  corporate_member: 'Kurumsal Üye',
};

const QA_STATUSES = ['pending', 'approved', 'rejected', 'hidden'] as const;
type QaStatus = (typeof QA_STATUSES)[number];

const CATEGORIES = [
  'klasik_haritacilik', 'cbs', 'fotogrametri_uzaktan_algilama', 'insaat',
  'gayrimenkul_degerleme', 'yazilim_teknoloji', 'kariyer', 'egitim',
  'mentorluk', 'gonullulik', 'proje_gelistirme', 'haritailesi_duyurulari',
] as const;

// ─── DTOs ─────────────────────────────────────────────────────────────────────

class SubmitQuestionDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  questionText!: string;

  @IsIn(CATEGORIES)
  category!: string;

  @IsOptional()
  @IsBoolean()
  showFullName?: boolean;
}

class AdminUpdateQuestionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  questionText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsIn(CATEGORIES)
  category?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

class AdminStatusDto {
  @IsIn(QA_STATUSES)
  status!: QaStatus;
}

class AdminPublishDto {
  @IsOptional()
  @IsBoolean()
  isMutfakPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isSahnePublished?: boolean;
}

class SubmitAnswerDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  submitterName?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(3000)
  body!: string;

  @IsOptional()
  @IsBoolean()
  showFullName?: boolean;
}

class AdminUpsertAnswerDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(3000)
  body!: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

class AdminPublishAnswerDto {
  @IsBoolean()
  isPublished!: boolean;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller('qa')
export class QaController {
  constructor(@InjectDb() private readonly db: Database) {}

  // ── Helpers ───────────────────────────────────────────────────────────────

  private maskName(name: string | null | undefined, showFull: boolean): string | null {
    if (!name) return null;
    if (showFull) return name;
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0]!;
    return `${parts[0]} ${parts[parts.length - 1]![0]}.`;
  }

  private async buildQuestion(id: string) {
    return this.db.query.communityQuestions.findFirst({
      where: eq(communityQuestions.id, id),
      with: { answers: true },
    });
  }

  private async ensureQuestion(id: string) {
    const q = await this.db.query.communityQuestions.findFirst({
      where: eq(communityQuestions.id, id),
    });
    if (!q) throw new NotFoundException('Soru bulunamadı.');
    return q;
  }

  // Mutfak feed post yaratır; zaten varsa günceller
  private async syncFeedPost(
    q: { id: string; questionText: string; category: string; feedPostId: string | null; approvedBy: string | null },
    adminUserId: string,
  ): Promise<string> {
    if (q.feedPostId) {
      await this.db
        .update(posts)
        .set({ body: q.questionText, status: 'published', updatedAt: new Date() })
        .where(eq(posts.id, q.feedPostId));
      return q.feedPostId;
    }

    const [created] = await this.db
      .insert(posts)
      .values({
        authorId: adminUserId,
        type: 'question',
        category: q.category as (typeof communityQuestions.$inferInsert)['category'],
        title: null,
        body: q.questionText,
        status: 'published',
        isPublic: true,
      })
      .returning({ id: posts.id });

    await this.db
      .update(communityQuestions)
      .set({ feedPostId: created!.id, updatedAt: new Date() })
      .where(eq(communityQuestions.id, q.id));

    return created!.id;
  }

  private async hideFeedPost(feedPostId: string) {
    await this.db
      .update(posts)
      .set({ status: 'hidden', updatedAt: new Date() })
      .where(eq(posts.id, feedPostId));
  }

  // ── Public: List for Sahne SSS ─────────────────────────────────────────────

  @Get()
  @Public()
  async listSahne(
    @Query('category') category?: string,
    @Query('featured') featured?: string,
  ) {
    const conditions: SQL[] = [
      eq(communityQuestions.isSahnePublished, true),
    ];
    if (category && (CATEGORIES as readonly string[]).includes(category)) {
      conditions.push(eq(communityQuestions.category, category as (typeof CATEGORIES)[number]));
    }
    if (featured === 'true') {
      conditions.push(eq(communityQuestions.isFeatured, true));
    }

    const rows = await this.db
      .select({
        id: communityQuestions.id,
        displayName: communityQuestions.displayName,
        showFullName: communityQuestions.showFullName,
        questionText: communityQuestions.questionText,
        category: communityQuestions.category,
        isFeatured: communityQuestions.isFeatured,
        viewCount: communityQuestions.viewCount,
        createdAt: communityQuestions.createdAt,
      })
      .from(communityQuestions)
      .where(and(...conditions))
      .orderBy(desc(communityQuestions.isFeatured), desc(communityQuestions.createdAt));

    // Her soru için yayındaki cevapları ekle + isim maskeleme
    const result = await Promise.all(rows.map(async (row) => {
      const answers = await this.db
        .select({
          id: communityAnswers.id,
          body: communityAnswers.body,
          source: communityAnswers.source,
          submitterName: communityAnswers.submitterName,
          submitterTier: communityAnswers.submitterTier,
          showFullName: communityAnswers.showFullName,
          isAccepted: communityAnswers.isAccepted,
          upvoteCount: communityAnswers.upvoteCount,
          updatedAt: communityAnswers.updatedAt,
        })
        .from(communityAnswers)
        .where(and(eq(communityAnswers.questionId, row.id), eq(communityAnswers.isPublished, true)));

      const { showFullName, displayName, ...rest } = row;
      return {
        ...rest,
        displayName: this.maskName(displayName, showFullName),
        answers: answers.map(({ showFullName: sf, submitterName, submitterTier, source, ...a }) => ({
          ...a,
          source,
          submitterName: source === 'admin' ? null : this.maskName(submitterName, sf),
          tierLabel: source === 'admin' ? null : (TIER_DISPLAY[submitterTier ?? ''] ?? 'Sahne Üyesi'),
        })),
      };
    }));

    return result;
  }

  // ── Public: List for Mutfak ────────────────────────────────────────────────

  @Get('mutfak')
  @Public()
  async listMutfak(@Query('category') category?: string) {
    const conditions: SQL[] = [eq(communityQuestions.isMutfakPublished, true)];
    if (category && (CATEGORIES as readonly string[]).includes(category)) {
      conditions.push(eq(communityQuestions.category, category as (typeof CATEGORIES)[number]));
    }

    const rows = await this.db
      .select({
        id: communityQuestions.id,
        displayName: communityQuestions.displayName,
        showFullName: communityQuestions.showFullName,
        questionText: communityQuestions.questionText,
        category: communityQuestions.category,
        isFeatured: communityQuestions.isFeatured,
        viewCount: communityQuestions.viewCount,
        feedPostId: communityQuestions.feedPostId,
        createdAt: communityQuestions.createdAt,
      })
      .from(communityQuestions)
      .where(and(...conditions))
      .orderBy(desc(communityQuestions.isFeatured), desc(communityQuestions.createdAt));

    const result = await Promise.all(rows.map(async (row) => {
      const answers = await this.db
        .select({
          id: communityAnswers.id,
          body: communityAnswers.body,
          source: communityAnswers.source,
          submitterName: communityAnswers.submitterName,
          submitterTier: communityAnswers.submitterTier,
          showFullName: communityAnswers.showFullName,
          isAccepted: communityAnswers.isAccepted,
          upvoteCount: communityAnswers.upvoteCount,
          updatedAt: communityAnswers.updatedAt,
        })
        .from(communityAnswers)
        .where(and(eq(communityAnswers.questionId, row.id), eq(communityAnswers.isPublished, true)));

      const { showFullName, displayName, ...rest } = row;
      return {
        ...rest,
        displayName: this.maskName(displayName, showFullName),
        answers: answers.map(({ showFullName: sf, submitterName, submitterTier, source, ...a }) => ({
          ...a,
          source,
          submitterName: source === 'admin' ? null : this.maskName(submitterName, sf),
          tierLabel: source === 'admin' ? null : (TIER_DISPLAY[submitterTier ?? ''] ?? 'Sahne Üyesi'),
        })),
      };
    }));

    return result;
  }

  // ── Public: Submit question from Sahne (email required) ───────────────────

  @Post()
  @Public()
  async submitQuestion(@Body() dto: SubmitQuestionDto) {
    if (!dto.email) throw new BadRequestException('E-posta adresi zorunludur.');

    const [created] = await this.db
      .insert(communityQuestions)
      .values({
        email: dto.email,
        displayName: dto.displayName ?? null,
        questionText: dto.questionText,
        category: dto.category as (typeof CATEGORIES)[number],
        showFullName: dto.showFullName ?? true,
        source: 'sahne',
      })
      .returning({ id: communityQuestions.id });

    return { id: created!.id, submitted: true };
  }

  // ── Authenticated: Submit question from Mutfak ────────────────────────────

  @Post('me')
  async submitQuestionAuth(@Body() dto: SubmitQuestionDto, @CurrentUser() user: RequestUser) {
    const profile = await this.db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    const [created] = await this.db
      .insert(communityQuestions)
      .values({
        userId: user.id,
        email: user.email,
        displayName: profile?.displayName ?? dto.displayName ?? null,
        questionText: dto.questionText,
        category: dto.category as (typeof CATEGORIES)[number],
        showFullName: dto.showFullName ?? true,
        source: 'mutfak',
      })
      .returning({ id: communityQuestions.id });

    return { id: created!.id, submitted: true };
  }

  // ── Public: Submit answer to a published question (Sahne) ─────────────────

  @Post(':id/answers')
  @Public()
  async submitAnswerPublic(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    const q = await this.db.query.communityQuestions.findFirst({
      where: and(eq(communityQuestions.id, id), eq(communityQuestions.isSahnePublished, true)),
    });
    if (!q) throw new NotFoundException('Soru bulunamadı veya yayında değil.');
    if (!dto.email) throw new BadRequestException('E-posta adresi zorunludur.');

    const [created] = await this.db
      .insert(communityAnswers)
      .values({
        questionId: id,
        submitterEmail: dto.email,
        submitterName: dto.submitterName ?? null,
        submitterTier: 'registered_user',
        body: dto.body,
        showFullName: dto.showFullName ?? true,
        source: 'sahne',
      })
      .returning({ id: communityAnswers.id });

    return { id: created!.id, submitted: true };
  }

  // ── Authenticated: Submit answer (Mutfak) ─────────────────────────────────

  @Post(':id/answers/me')
  async submitAnswerAuth(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitAnswerDto,
    @CurrentUser() user: RequestUser,
  ) {
    const q = await this.db.query.communityQuestions.findFirst({
      where: and(eq(communityQuestions.id, id), eq(communityQuestions.isMutfakPublished, true)),
    });
    if (!q) throw new NotFoundException('Soru bulunamadı veya yayında değil.');

    const [profile, submitter] = await Promise.all([
      this.db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, user.id) }),
      this.db.query.users.findFirst({ where: eq(users.id, user.id), columns: { membershipTier: true } }),
    ]);

    const [created] = await this.db
      .insert(communityAnswers)
      .values({
        questionId: id,
        submitterUserId: user.id,
        submitterEmail: user.email,
        submitterName: profile?.displayName ?? null,
        submitterTier: submitter?.membershipTier ?? 'registered_user',
        body: dto.body,
        showFullName: dto.showFullName ?? true,
        source: 'mutfak',
      })
      .returning({ id: communityAnswers.id });

    return { id: created!.id, submitted: true };
  }

  // ── Admin: List all questions ──────────────────────────────────────────────

  @Get('admin')
  @RequirePermission('feed.post.delete_any')
  async adminList(
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    const conditions: SQL[] = [];
    if (status && (QA_STATUSES as readonly string[]).includes(status)) {
      conditions.push(eq(communityQuestions.status, status as QaStatus));
    }
    if (category && (CATEGORIES as readonly string[]).includes(category)) {
      conditions.push(eq(communityQuestions.category, category as (typeof CATEGORIES)[number]));
    }

    const rows = await this.db
      .select({
        id: communityQuestions.id,
        userId: communityQuestions.userId,
        email: communityQuestions.email,
        displayName: communityQuestions.displayName,
        questionText: communityQuestions.questionText,
        category: communityQuestions.category,
        status: communityQuestions.status,
        isMutfakPublished: communityQuestions.isMutfakPublished,
        isSahnePublished: communityQuestions.isSahnePublished,
        isFeatured: communityQuestions.isFeatured,
        feedPostId: communityQuestions.feedPostId,
        viewCount: communityQuestions.viewCount,
        source: communityQuestions.source,
        createdAt: communityQuestions.createdAt,
        updatedAt: communityQuestions.updatedAt,
      })
      .from(communityQuestions)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(communityQuestions.createdAt));

    const result = await Promise.all(rows.map(async (row) => {
      const answers = await this.db
        .select({
          id: communityAnswers.id,
          body: communityAnswers.body,
          source: communityAnswers.source,
          submitterName: communityAnswers.submitterName,
          submitterEmail: communityAnswers.submitterEmail,
          isPublished: communityAnswers.isPublished,
          createdAt: communityAnswers.createdAt,
          updatedAt: communityAnswers.updatedAt,
        })
        .from(communityAnswers)
        .where(eq(communityAnswers.questionId, row.id))
        .orderBy(desc(communityAnswers.createdAt));
      return { ...row, answers };
    }));

    return result;
  }

  // ── Admin: Update question content ────────────────────────────────────────

  @Patch('admin/:id')
  @RequirePermission('feed.post.delete_any')
  async adminUpdateQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateQuestionDto,
  ) {
    await this.ensureQuestion(id);
    const [updated] = await this.db
      .update(communityQuestions)
      .set({
        ...(dto.questionText !== undefined ? { questionText: dto.questionText } : {}),
        ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
        ...(dto.category !== undefined ? { category: dto.category as (typeof CATEGORIES)[number] } : {}),
        ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
        updatedAt: new Date(),
      })
      .where(eq(communityQuestions.id, id))
      .returning();
    return updated;
  }

  // ── Admin: Set approval status ────────────────────────────────────────────

  @Patch('admin/:id/status')
  @RequirePermission('feed.post.delete_any')
  async adminSetStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminStatusDto,
    @CurrentUser() user: RequestUser,
  ) {
    const existing = await this.ensureQuestion(id);
    const [updated] = await this.db
      .update(communityQuestions)
      .set({
        status: dto.status,
        approvedBy: dto.status === 'approved' ? user.id : existing.approvedBy,
        updatedAt: new Date(),
      })
      .where(eq(communityQuestions.id, id))
      .returning({ id: communityQuestions.id, status: communityQuestions.status });
    return updated;
  }

  // ── Admin: Set publish channels (Mutfak / Sahne toggles) ─────────────────

  @Patch('admin/:id/publish')
  @RequirePermission('feed.post.delete_any')
  async adminSetPublish(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminPublishDto,
    @CurrentUser() user: RequestUser,
  ) {
    const existing = await this.ensureQuestion(id);

    // Mutfak feed post sync
    if (dto.isMutfakPublished === true) {
      await this.syncFeedPost(existing, user.id);
    } else if (dto.isMutfakPublished === false && existing.feedPostId) {
      await this.hideFeedPost(existing.feedPostId);
    }

    const [updated] = await this.db
      .update(communityQuestions)
      .set({
        ...(dto.isMutfakPublished !== undefined ? { isMutfakPublished: dto.isMutfakPublished } : {}),
        ...(dto.isSahnePublished !== undefined ? { isSahnePublished: dto.isSahnePublished } : {}),
        // Auto-approve if publishing anywhere
        ...(dto.isMutfakPublished || dto.isSahnePublished
          ? { status: 'approved', approvedBy: user.id }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(communityQuestions.id, id))
      .returning({
        id: communityQuestions.id,
        isMutfakPublished: communityQuestions.isMutfakPublished,
        isSahnePublished: communityQuestions.isSahnePublished,
        status: communityQuestions.status,
        feedPostId: communityQuestions.feedPostId,
      });
    return updated;
  }

  // ── Admin: Delete question ─────────────────────────────────────────────────

  @Delete('admin/:id')
  @RequirePermission('feed.post.delete_any')
  async adminDelete(@Param('id', ParseUUIDPipe) id: string) {
    const existing = await this.ensureQuestion(id);
    if (existing.feedPostId) {
      await this.db.update(posts)
        .set({ status: 'deleted', updatedAt: new Date() })
        .where(eq(posts.id, existing.feedPostId));
    }
    await this.db.delete(communityQuestions).where(eq(communityQuestions.id, id));
    return { id, deleted: true };
  }

  // ── Admin: Add admin-written answer ───────────────────────────────────────

  @Post('admin/:id/answers')
  @RequirePermission('feed.post.delete_any')
  async adminAddAnswer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpsertAnswerDto,
    @CurrentUser() user: RequestUser,
  ) {
    await this.ensureQuestion(id);
    const [created] = await this.db
      .insert(communityAnswers)
      .values({
        questionId: id,
        submitterUserId: user.id,
        submitterName: 'Haritailesi Uzman Ekibi',
        body: dto.body,
        source: 'admin',
        isPublished: dto.isPublished ?? false,
        approvedBy: user.id,
      })
      .returning();
    return created;
  }

  // ── Admin: Update an answer ────────────────────────────────────────────────

  @Patch('admin/answers/:answerId')
  @RequirePermission('feed.post.delete_any')
  async adminUpdateAnswer(
    @Param('answerId', ParseUUIDPipe) answerId: string,
    @Body() dto: AdminUpsertAnswerDto,
    @CurrentUser() user: RequestUser,
  ) {
    const answer = await this.db.query.communityAnswers.findFirst({
      where: eq(communityAnswers.id, answerId),
    });
    if (!answer) throw new NotFoundException('Cevap bulunamadı.');

    const [updated] = await this.db
      .update(communityAnswers)
      .set({
        body: dto.body,
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished, approvedBy: user.id } : {}),
        updatedAt: new Date(),
      })
      .where(eq(communityAnswers.id, answerId))
      .returning();
    return updated;
  }

  // ── Admin: Publish / unpublish an answer ──────────────────────────────────

  @Patch('admin/answers/:answerId/publish')
  @RequirePermission('feed.post.delete_any')
  async adminPublishAnswer(
    @Param('answerId', ParseUUIDPipe) answerId: string,
    @Body() dto: AdminPublishAnswerDto,
    @CurrentUser() user: RequestUser,
  ) {
    const answer = await this.db.query.communityAnswers.findFirst({
      where: eq(communityAnswers.id, answerId),
    });
    if (!answer) throw new NotFoundException('Cevap bulunamadı.');

    const [updated] = await this.db
      .update(communityAnswers)
      .set({
        isPublished: dto.isPublished,
        approvedBy: dto.isPublished ? user.id : null,
        updatedAt: new Date(),
      })
      .where(eq(communityAnswers.id, answerId))
      .returning({ id: communityAnswers.id, isPublished: communityAnswers.isPublished });
    return updated;
  }

  // ── Admin: Delete an answer ────────────────────────────────────────────────

  @Delete('admin/answers/:answerId')
  @RequirePermission('feed.post.delete_any')
  async adminDeleteAnswer(@Param('answerId', ParseUUIDPipe) answerId: string) {
    const answer = await this.db.query.communityAnswers.findFirst({
      where: eq(communityAnswers.id, answerId),
    });
    if (!answer) throw new NotFoundException('Cevap bulunamadı.');
    await this.db.delete(communityAnswers).where(eq(communityAnswers.id, answerId));
    return { deleted: true };
  }

  // ── Auth: Upvote toggle ────────────────────────────────────────────────────

  @Post('answers/:answerId/upvote')
  async toggleUpvote(
    @Param('answerId', ParseUUIDPipe) answerId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const answer = await this.db.query.communityAnswers.findFirst({
      where: and(eq(communityAnswers.id, answerId), eq(communityAnswers.isPublished, true)),
    });
    if (!answer) throw new NotFoundException('Cevap bulunamadı.');

    const existing = await this.db.query.communityAnswerVotes.findFirst({
      where: and(
        eq(communityAnswerVotes.userId, user.id),
        eq(communityAnswerVotes.answerId, answerId),
      ),
    });

    if (existing) {
      await this.db.delete(communityAnswerVotes)
        .where(eq(communityAnswerVotes.id, existing.id));
      const [updated] = await this.db
        .update(communityAnswers)
        .set({ upvoteCount: drizzleSql`${communityAnswers.upvoteCount} - 1`, updatedAt: new Date() })
        .where(eq(communityAnswers.id, answerId))
        .returning({ upvoteCount: communityAnswers.upvoteCount });
      return { upvoted: false, upvoteCount: updated!.upvoteCount };
    }

    await this.db.insert(communityAnswerVotes).values({ userId: user.id, answerId });
    const [updated] = await this.db
      .update(communityAnswers)
      .set({ upvoteCount: drizzleSql`${communityAnswers.upvoteCount} + 1`, updatedAt: new Date() })
      .where(eq(communityAnswers.id, answerId))
      .returning({ upvoteCount: communityAnswers.upvoteCount });
    return { upvoted: true, upvoteCount: updated!.upvoteCount };
  }

  // ── Auth: Check my vote ────────────────────────────────────────────────────

  @Get('answers/:answerId/my-vote')
  async getMyVote(
    @Param('answerId', ParseUUIDPipe) answerId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const vote = await this.db.query.communityAnswerVotes.findFirst({
      where: and(
        eq(communityAnswerVotes.userId, user.id),
        eq(communityAnswerVotes.answerId, answerId),
      ),
    });
    return { upvoted: !!vote };
  }

  // ── Auth: Accept answer (question author only) ────────────────────────────

  @Patch('answers/:answerId/accept')
  async toggleAccept(
    @Param('answerId', ParseUUIDPipe) answerId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const answer = await this.db.query.communityAnswers.findFirst({
      where: eq(communityAnswers.id, answerId),
    });
    if (!answer) throw new NotFoundException('Cevap bulunamadı.');

    const question = await this.db.query.communityQuestions.findFirst({
      where: eq(communityQuestions.id, answer.questionId),
    });
    if (!question) throw new NotFoundException('Soru bulunamadı.');
    if (question.userId !== user.id) throw new ForbiddenException('Sadece soru sahibi kabul işlemi yapabilir.');

    const newAccepted = !answer.isAccepted;
    const [updated] = await this.db
      .update(communityAnswers)
      .set({ isAccepted: newAccepted, updatedAt: new Date() })
      .where(eq(communityAnswers.id, answerId))
      .returning({ id: communityAnswers.id, isAccepted: communityAnswers.isAccepted });
    return updated;
  }
}

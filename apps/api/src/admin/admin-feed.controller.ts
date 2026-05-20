import {
  Controller, Delete, Get, NotFoundException,
  Param, ParseUUIDPipe, Patch, Query, Body, Post as HttpPost,
} from '@nestjs/common';
import {
  IsBoolean, IsOptional, IsIn, IsString, MaxLength, IsArray, IsUUID,
} from 'class-validator';
import { RequirePermission } from '../rbac/rbac.decorator';
import { InjectDb } from '../database/inject-db.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import type { Database } from '@haritailesi/database';
import { posts, userProfiles } from '@haritailesi/database';
import { eq, desc, and, or, ilike, inArray, sql, type SQL } from 'drizzle-orm';

const STATUSES = ['published', 'hidden', 'deleted', 'pending_review', 'draft'] as const;
type PostStatus = (typeof STATUSES)[number];

const POST_TYPE_VALUES = [
  'general', 'question', 'idea', 'project_call', 'content_draft',
  'team_search', 'mentorship_experience', 'poll', 'announcement', 'resource',
] as const;

const POST_CATEGORY_VALUES = [
  'klasik_haritacilik', 'cbs', 'fotogrametri_uzaktan_algilama', 'insaat',
  'gayrimenkul_degerleme', 'yazilim_teknoloji', 'kariyer', 'egitim',
  'mentorluk', 'gonullulik', 'proje_gelistirme', 'haritailesi_duyurulari',
] as const;

// ─── DTOs ─────────────────────────────────────────────────────────────────────

class AdminPinDto {
  @IsBoolean()
  pinned!: boolean;
}

class AdminUpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  body?: string;
}

class AdminPostStatusDto {
  @IsIn(STATUSES)
  status!: PostStatus;
}

class AdminCreatePostDto {
  @IsIn(POST_TYPE_VALUES)
  type!: string;

  @IsIn(POST_CATEGORY_VALUES)
  category!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string | null;

  @IsString()
  @MaxLength(5000)
  body!: string;

  @IsIn(STATUSES)
  status!: PostStatus;
}

class AdminBulkStatusDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids!: string[];

  @IsIn(STATUSES)
  status!: PostStatus;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller('admin/feed')
export class AdminFeedController {
  constructor(@InjectDb() private readonly db: Database) {}

  @Get('posts')
  @RequirePermission('feed.post.delete_any')
  async listPosts(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('q') q?: string,
  ) {
    const conditions: SQL[] = [];

    if (status && (STATUSES as readonly string[]).includes(status)) {
      conditions.push(eq(posts.status, status as PostStatus));
    } else {
      conditions.push(sql`${posts.status} IN ('published','hidden','pending_review')`);
    }
    if (category) conditions.push(sql`${posts.category} = ${category}`);
    if (type) conditions.push(sql`${posts.type} = ${type}`);
    if (q?.trim()) {
      const term = `%${q.trim()}%`;
      conditions.push(or(ilike(posts.title, term), ilike(posts.body, term))!);
    }

    const rows = await this.db
      .select({
        id: posts.id,
        type: posts.type,
        category: posts.category,
        title: posts.title,
        body: posts.body,
        status: posts.status,
        isPinned: posts.isPinned,
        createdAt: posts.createdAt,
        authorId: posts.authorId,
        displayName: userProfiles.displayName,
        reactionCount: sql<number>`(SELECT COUNT(*) FROM post_reactions WHERE post_id = ${posts.id})`.as('reaction_count'),
        commentCount: sql<number>`(SELECT COUNT(*) FROM comments WHERE post_id = ${posts.id} AND is_deleted = false)`.as('comment_count'),
      })
      .from(posts)
      .innerJoin(userProfiles, eq(userProfiles.userId, posts.authorId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(posts.isPinned), desc(posts.createdAt))
      .limit(200);

    return rows;
  }

  @HttpPost('posts')
  @RequirePermission('feed.post.delete_any')
  async createPost(
    @Body() dto: AdminCreatePostDto,
    @CurrentUser() user: RequestUser,
  ) {
    const [created] = await this.db
      .insert(posts)
      .values({
        type: dto.type as (typeof POST_TYPE_VALUES)[number],
        category: dto.category as (typeof POST_CATEGORY_VALUES)[number],
        title: dto.title ?? null,
        body: dto.body,
        status: dto.status,
        authorId: user.id,
      })
      .returning();

    const profile = await this.db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    return {
      ...created,
      displayName: profile?.displayName ?? user.email,
      reactionCount: 0,
      commentCount: 0,
    };
  }

  @HttpPost('posts/bulk')
  @RequirePermission('feed.post.delete_any')
  async bulkUpdateStatus(@Body() dto: AdminBulkStatusDto) {
    if (!dto.ids.length) return { updated: 0 };
    await this.db
      .update(posts)
      .set({ status: dto.status, updatedAt: new Date() })
      .where(inArray(posts.id, dto.ids));
    return { updated: dto.ids.length };
  }

  @Patch('posts/:id')
  @RequirePermission('feed.post.delete_any')
  async updatePost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdatePostDto,
  ) {
    const existing = await this.db.query.posts.findFirst({ where: eq(posts.id, id) });
    if (!existing) throw new NotFoundException('Gönderi bulunamadı.');
    const [updated] = await this.db
      .update(posts)
      .set({
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.body ? { body: dto.body } : {}),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();
    return updated;
  }

  @Patch('posts/:id/pin')
  @RequirePermission('feed.post.pin')
  async pinPost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminPinDto,
  ) {
    const [updated] = await this.db
      .update(posts)
      .set({ isPinned: dto.pinned, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning({ id: posts.id, isPinned: posts.isPinned });
    return updated;
  }

  @Patch('posts/:id/status')
  @RequirePermission('feed.post.delete_any')
  async setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminPostStatusDto,
  ) {
    const [updated] = await this.db
      .update(posts)
      .set({ status: dto.status, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning({ id: posts.id, status: posts.status });
    return updated;
  }

  @Delete('posts/:id')
  @RequirePermission('feed.post.delete_any')
  async deletePost(@Param('id', ParseUUIDPipe) id: string) {
    const [updated] = await this.db
      .update(posts)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning({ id: posts.id });
    return updated;
  }
}

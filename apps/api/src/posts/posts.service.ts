import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { eq, and, desc, sql, ne, ilike, or, type SQL } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import {
  posts,
  postReactions,
  postBookmarks,
  postImages,
  comments,
  users,
  userFollows,
  userProfiles,
  postTypeEnum,
  postCategoryEnum,
  pollOptions,
  pollVotes,
} from '@haritailesi/database';
import type Redis from 'ioredis';
import { REDIS_TOKEN } from '../redis/redis.constants';

export type PostType = (typeof postTypeEnum.enumValues)[number];
export type PostCategory = (typeof postCategoryEnum.enumValues)[number];
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';

const FEED_PAGE_SIZE = 20;
const FEED_CACHE_TTL = 30; // seconds

const REACTION_TYPES = ['like', 'celebrate', 'support', 'insightful'] as const;
type ReactionType = (typeof REACTION_TYPES)[number];

export { REACTION_TYPES };
export type { ReactionType };

const MENTION_PATTERN = /@([\p{L}\p{N}_. -]{2,60})/gu;

@Injectable()
export class PostsService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly notificationsService: NotificationsService,
    private readonly storageService: StorageService,
    @Inject(REDIS_TOKEN) private readonly redis: Redis,
  ) {}

  // ─── Feed ──────────────────────────────────────────────────────────────────────

  async listPosts(params: {
    cursor?: string;
    category?: string;
    type?: string;
    q?: string;
    limit?: number;
    authorId?: string;
    viewerId?: string;
    followingOnly?: boolean;
    sort?: 'recent' | 'hot';
  } = {}) {
    const limit = Math.min(params.limit ?? FEED_PAGE_SIZE, 50);

    // Cache first-page unfiltered feed to reduce DB load on hot path
    const isCacheable = !params.cursor && !params.q && !params.followingOnly && !params.authorId && params.sort !== 'hot';
    if (isCacheable) {
      const cacheKey = `feed:list:${params.viewerId ?? 'anon'}:${params.category ?? ''}:${params.type ?? ''}`;
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) return JSON.parse(cached) as Awaited<ReturnType<typeof this._queryListPosts>>;
      } catch { /* redis unavailable — fall through to DB */ }

      const result = await this._queryListPosts(params, limit);
      try {
        await this.redis.setex(cacheKey, FEED_CACHE_TTL, JSON.stringify(result));
      } catch { /* ignore redis write errors */ }
      return result;
    }

    return this._queryListPosts(params, limit);
  }

  async listPublicPosts(params: { cursor?: string; category?: string; limit?: number } = {}) {
    const limit = Math.min(params.limit ?? 20, 50);
    const conditions: SQL[] = [
      eq(posts.status, 'published'),
      eq(posts.isPublic, true),
    ];
    if (params.category) conditions.push(sql`${posts.category} = ${params.category}`);
    if (params.cursor) conditions.push(sql`${posts.createdAt} < ${new Date(params.cursor)}`);

    const rows = await this.db
      .select({
        id: posts.id,
        type: posts.type,
        category: posts.category,
        title: posts.title,
        body: posts.body,
        isPinned: posts.isPinned,
        createdAt: posts.createdAt,
        authorId: posts.authorId,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        profession: userProfiles.profession,
        reactionCount: sql<number>`(SELECT COUNT(*) FROM post_reactions WHERE post_id = ${posts.id})`.as('reaction_count'),
        commentCount: sql<number>`(SELECT COUNT(*) FROM comments WHERE post_id = ${posts.id} AND is_deleted = false)`.as('comment_count'),
      })
      .from(posts)
      .leftJoin(userProfiles, eq(posts.authorId, userProfiles.userId))
      .where(and(...conditions))
      .orderBy(desc(posts.isPinned), desc(posts.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? items[items.length - 1]?.createdAt?.toISOString() : null;
    return { items, nextCursor, hasMore };
  }

  private async _queryListPosts(params: {
    cursor?: string;
    category?: string;
    type?: string;
    q?: string;
    limit?: number;
    authorId?: string;
    viewerId?: string;
    followingOnly?: boolean;
    sort?: 'recent' | 'hot';
  }, limit: number) {

    const conditions: SQL[] = [
      eq(posts.status, 'published'),
    ];

    if (params.authorId) {
      conditions.push(eq(posts.authorId, params.authorId));
    }
    if (params.category) {
      conditions.push(sql`${posts.category} = ${params.category}`);
    }
    if (params.type) {
      conditions.push(sql`${posts.type} = ${params.type}`);
    }
    if (params.q) {
      const like = `%${params.q}%`;
      conditions.push(
        or(ilike(posts.title, like), ilike(posts.body, like), ilike(userProfiles.displayName, like))!,
      );
    }
    if (params.followingOnly && params.viewerId) {
      conditions.push(
        sql`${posts.authorId} IN (SELECT followee_id FROM user_follows WHERE follower_id = ${params.viewerId})`,
      );
    }
    const isHot = params.sort === 'hot';

    if (isHot) {
      // Hot mode: last 30 days, no cursor pagination
      conditions.push(sql`${posts.createdAt} >= NOW() - INTERVAL '30 days'`);
    } else if (params.cursor) {
      conditions.push(
        sql`(${posts.isPinned}, ${posts.createdAt}) < (
          SELECT is_pinned, created_at FROM posts WHERE id = ${params.cursor}
        )`,
      );
    }

    const selectFields = {
      id: posts.id,
      type: posts.type,
      category: posts.category,
      title: posts.title,
      body: posts.body,
      isPinned: posts.isPinned,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      authorId: posts.authorId,
      displayName: userProfiles.displayName,
      avatarUrl: userProfiles.avatarUrl,
      profession: userProfiles.profession,
      reactionCount: sql<number>`(SELECT COUNT(*) FROM post_reactions WHERE post_id = ${posts.id})`.as('reaction_count'),
      commentCount: sql<number>`(SELECT COUNT(*) FROM comments WHERE post_id = ${posts.id} AND is_deleted = false)`.as('comment_count'),
      reactionSummary: sql<Record<string, number>>`COALESCE((SELECT jsonb_object_agg(type, cnt) FROM (SELECT type, COUNT(*) AS cnt FROM post_reactions WHERE post_id = ${posts.id} GROUP BY type) t), '{}')`.as('reaction_summary'),
      isBookmarked: params.viewerId
        ? sql<boolean>`EXISTS(SELECT 1 FROM post_bookmarks WHERE post_id = ${posts.id} AND user_id = ${params.viewerId})`.as('is_bookmarked')
        : sql<boolean>`false`.as('is_bookmarked'),
      imageUrl: sql<string | null>`(SELECT image_key FROM post_images WHERE post_id = ${posts.id} ORDER BY sort_order ASC LIMIT 1)`.as('image_url'),
      pollOptions: sql<Array<{ id: string; text: string; voteCount: number; sortOrder: number }> | null>`
        CASE WHEN ${posts.type} = 'poll' THEN (
          SELECT json_agg(json_build_object('id', o.id, 'text', o.text, 'voteCount', (SELECT COUNT(*) FROM poll_votes WHERE option_id = o.id), 'sortOrder', o.sort_order) ORDER BY o.sort_order)
          FROM poll_options o WHERE o.post_id = ${posts.id}
        ) ELSE NULL END
      `.as('poll_options'),
      viewerVote: params.viewerId
        ? sql<string | null>`(SELECT option_id FROM poll_votes WHERE post_id = ${posts.id} AND user_id = ${params.viewerId} LIMIT 1)`.as('viewer_vote')
        : sql<string | null>`NULL`.as('viewer_vote'),
    };

    const orderBy = isHot
      ? [
          desc(sql`(SELECT COUNT(*) FROM post_reactions WHERE post_id = ${posts.id}) * 3 + (SELECT COUNT(*) FROM comments WHERE post_id = ${posts.id} AND is_deleted = false) * 2`),
          desc(posts.createdAt),
        ]
      : [desc(posts.isPinned), desc(posts.createdAt)];

    const rows = await this.db
      .select(selectFields)
      .from(posts)
      .innerJoin(userProfiles, eq(userProfiles.userId, posts.authorId))
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(isHot ? limit : limit + 1);

    if (isHot) {
      return { data: rows, next_cursor: null, has_more: false };
    }

    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit);
    return {
      data,
      next_cursor: hasMore ? (data[data.length - 1]?.id ?? null) : null,
      has_more: hasMore,
    };
  }

  async getPost(postId: string, viewerId?: string) {
    const [post] = await this.db
      .select({
        id: posts.id,
        type: posts.type,
        category: posts.category,
        title: posts.title,
        body: posts.body,
        status: posts.status,
        isPinned: posts.isPinned,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        authorId: posts.authorId,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        profession: userProfiles.profession,
        reactionCount: sql<number>`(SELECT COUNT(*) FROM post_reactions WHERE post_id = ${posts.id})`.as('reaction_count'),
        commentCount: sql<number>`(SELECT COUNT(*) FROM comments WHERE post_id = ${posts.id} AND is_deleted = false)`.as('comment_count'),
        reactionSummary: sql<Record<string, number>>`COALESCE((SELECT jsonb_object_agg(type, cnt) FROM (SELECT type, COUNT(*) AS cnt FROM post_reactions WHERE post_id = ${posts.id} GROUP BY type) t), '{}')`.as('reaction_summary'),
        isBookmarked: viewerId
          ? sql<boolean>`EXISTS(SELECT 1 FROM post_bookmarks WHERE post_id = ${posts.id} AND user_id = ${viewerId})`.as('is_bookmarked')
          : sql<boolean>`false`.as('is_bookmarked'),
        imageUrl: sql<string | null>`(SELECT image_key FROM post_images WHERE post_id = ${posts.id} ORDER BY sort_order ASC LIMIT 1)`.as('image_url'),
        pollOptions: sql<Array<{ id: string; text: string; voteCount: number; sortOrder: number }> | null>`
          CASE WHEN ${posts.type} = 'poll' THEN (
            SELECT json_agg(json_build_object('id', o.id, 'text', o.text, 'voteCount', (SELECT COUNT(*) FROM poll_votes WHERE option_id = o.id), 'sortOrder', o.sort_order) ORDER BY o.sort_order)
            FROM poll_options o WHERE o.post_id = ${posts.id}
          ) ELSE NULL END
        `.as('poll_options'),
        viewerVote: viewerId
          ? sql<string | null>`(SELECT option_id FROM poll_votes WHERE post_id = ${posts.id} AND user_id = ${viewerId} LIMIT 1)`.as('viewer_vote')
          : sql<string | null>`NULL`.as('viewer_vote'),
      })
      .from(posts)
      .innerJoin(userProfiles, eq(userProfiles.userId, posts.authorId))
      .where(and(eq(posts.id, postId), ne(posts.status, 'deleted')))
      .limit(1);

    if (!post) throw new NotFoundException('Gönderi bulunamadı.');

    let viewerReaction: string | null = null;
    if (viewerId) {
      const reaction = await this.db.query.postReactions.findFirst({
        where: and(
          eq(postReactions.postId, postId),
          eq(postReactions.userId, viewerId),
        ),
      });
      viewerReaction = reaction?.type ?? null;
    }

    return { ...post, viewerReaction };
  }

  // ─── Post CRUD ────────────────────────────────────────────────────────────────

  async createPost(
    authorId: string,
    data: {
      type: PostType;
      category: PostCategory;
      title?: string;
      body: string;
      pollOptions?: string[];
      isPublic?: boolean;
    },
  ) {
    const [created] = await this.db
      .insert(posts)
      .values({
        authorId,
        type: data.type,
        category: data.category,
        title: data.title ?? null,
        body: data.body,
        status: 'published',
        isPublic: data.isPublic ?? false,
      })
      .returning();

    if (created) {
      void this.processMentions(authorId, created.id, data.body);
      if (data.type === 'poll' && data.pollOptions && data.pollOptions.length >= 2) {
        await this.setPollOptions(created.id, data.pollOptions);
      }
      void this.invalidateFeedCache();
    }

    return created;
  }

  async updatePost(
    requesterId: string,
    postId: string,
    data: { title?: string | null; body?: string },
  ) {
    const post = await this.db.query.posts.findFirst({
      where: and(eq(posts.id, postId), eq(posts.status, 'published')),
    });
    if (!post) throw new NotFoundException('Gönderi bulunamadı.');
    if (post.authorId !== requesterId) throw new ForbiddenException('Bu gönderiyi düzenleme yetkiniz yok.');

    const [updated] = await this.db
      .update(posts)
      .set({
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.body ? { body: data.body } : {}),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning();

    return updated;
  }

  async deletePost(requesterId: string, postId: string, canDeleteAny: boolean) {
    const post = await this.db.query.posts.findFirst({
      where: and(eq(posts.id, postId), ne(posts.status, 'deleted')),
    });

    if (!post) throw new NotFoundException('Gönderi bulunamadı.');
    if (!canDeleteAny && post.authorId !== requesterId) {
      throw new ForbiddenException('Bu gönderiyi silme yetkiniz yok.');
    }

    const [updated] = await this.db
      .update(posts)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(eq(posts.id, postId))
      .returning();

    void this.invalidateFeedCache();
    return updated;
  }

  private async invalidateFeedCache() {
    try {
      const keys = await this.redis.keys('feed:list:*');
      if (keys.length) await this.redis.del(...keys);
    } catch { /* redis unavailable */ }
  }

  async pinPost(postId: string, pinned: boolean) {
    const post = await this.db.query.posts.findFirst({
      where: and(eq(posts.id, postId), eq(posts.status, 'published')),
    });
    if (!post) throw new NotFoundException('Gönderi bulunamadı.');

    const [updated] = await this.db
      .update(posts)
      .set({ isPinned: pinned, updatedAt: new Date() })
      .where(eq(posts.id, postId))
      .returning();

    return updated;
  }

  // ─── Reactions ────────────────────────────────────────────────────────────────

  async react(userId: string, postId: string, type: ReactionType) {
    if (!REACTION_TYPES.includes(type)) {
      throw new BadRequestException('Geçersiz reaksiyon tipi.');
    }

    const existing = await this.db.query.postReactions.findFirst({
      where: and(
        eq(postReactions.postId, postId),
        eq(postReactions.userId, userId),
      ),
    });

    if (existing) {
      if (existing.type === type) {
        // toggle off
        await this.db
          .delete(postReactions)
          .where(eq(postReactions.id, existing.id));
        return { reacted: false, type: null };
      }
      // change type
      await this.db
        .update(postReactions)
        .set({ type })
        .where(eq(postReactions.id, existing.id));
      return { reacted: true, type };
    }

    await this.db
      .insert(postReactions)
      .values({ postId, userId, type });
    void this.notifyReaction(userId, postId, type);
    return { reacted: true, type };
  }

  private async notifyReaction(reactorId: string, postId: string, type: ReactionType) {
    try {
      const [post, profile] = await Promise.all([
        this.db.query.posts.findFirst({ where: eq(posts.id, postId) }),
        this.db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, reactorId) }),
      ]);
      if (!post || post.authorId === reactorId) return;
      const name = profile?.displayName ?? 'Biri';
      const labels: Record<string, string> = {
        like: 'beğendi', celebrate: 'kutladı', support: 'destekledi', insightful: 'içgörü buldu',
      };
      await this.notificationsService.create(post.authorId, {
        type: 'new_reaction',
        title: 'Gönderinize tepki',
        body: `${name} gönderinizi ${labels[type] ?? 'tepki verdi'}.`,
        data: { postId },
      });
    } catch { /* non-blocking */ }
  }

  // ─── Comments ─────────────────────────────────────────────────────────────────

  async listComments(postId: string) {
    const rows = await this.db
      .select({
        id: comments.id,
        body: comments.body,
        isDeleted: comments.isDeleted,
        createdAt: comments.createdAt,
        authorId: comments.authorId,
        parentId: comments.parentId,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(comments)
      .innerJoin(userProfiles, eq(userProfiles.userId, comments.authorId))
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);

    return rows.map((r) =>
      r.isDeleted ? { ...r, body: '[Yorum silindi]', displayName: 'Silindi', avatarUrl: null } : r,
    );
  }

  async addComment(authorId: string, postId: string, body: string, parentId?: string) {
    const post = await this.db.query.posts.findFirst({
      where: and(eq(posts.id, postId), eq(posts.status, 'published')),
    });
    if (!post) throw new NotFoundException('Gönderi bulunamadı.');

    const [created] = await this.db
      .insert(comments)
      .values({ postId, authorId, body, ...(parentId ? { parentId } : {}) })
      .returning();

    if (post.authorId !== authorId) {
      void this.notifyComment(post.authorId, authorId, postId, body);
    }

    return created;
  }

  private async notifyComment(toUserId: string, commenterId: string, postId: string, body: string) {
    try {
      const profile = await this.db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, commenterId),
      });
      const name = profile?.displayName ?? 'Biri';
      const preview = body.length > 80 ? body.slice(0, 80) + '…' : body;
      await this.notificationsService.create(toUserId, {
        type: 'new_comment',
        title: 'Gönderinize yeni yorum',
        body: `${name} gönderinizi yorumladı: "${preview}"`,
        data: { postId },
      });
    } catch { /* non-blocking */ }
  }

  async deleteComment(
    requesterId: string,
    commentId: string,
    canDeleteAny: boolean,
  ) {
    const comment = await this.db.query.comments.findFirst({
      where: and(eq(comments.id, commentId), eq(comments.isDeleted, false)),
    });
    if (!comment) throw new NotFoundException('Yorum bulunamadı.');
    if (!canDeleteAny && comment.authorId !== requesterId) {
      throw new ForbiddenException('Bu yorumu silme yetkiniz yok.');
    }

    const [updated] = await this.db
      .update(comments)
      .set({ isDeleted: true, body: '[Yorum silindi]', updatedAt: new Date() })
      .where(eq(comments.id, commentId))
      .returning();

    return updated;
  }

  // ─── Bookmarks ────────────────────────────────────────────────────────────────

  async toggleBookmark(userId: string, postId: string): Promise<{ bookmarked: boolean }> {
    const existing = await this.db.query.postBookmarks.findFirst({
      where: and(eq(postBookmarks.userId, userId), eq(postBookmarks.postId, postId)),
    });

    if (existing) {
      await this.db.delete(postBookmarks).where(eq(postBookmarks.id, existing.id));
      return { bookmarked: false };
    }

    const post = await this.db.query.posts.findFirst({
      where: and(eq(posts.id, postId), eq(posts.status, 'published')),
    });
    if (!post) throw new NotFoundException('Gönderi bulunamadı.');

    await this.db.insert(postBookmarks).values({ userId, postId });
    return { bookmarked: true };
  }

  async getMyBookmarks(userId: string) {
    const rows = await this.db
      .select({
        id: posts.id,
        type: posts.type,
        category: posts.category,
        title: posts.title,
        body: posts.body,
        isPinned: posts.isPinned,
        createdAt: posts.createdAt,
        authorId: posts.authorId,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        profession: userProfiles.profession,
        reactionCount: sql<number>`(SELECT COUNT(*) FROM post_reactions WHERE post_id = ${posts.id})`.as('reaction_count'),
        commentCount: sql<number>`(SELECT COUNT(*) FROM comments WHERE post_id = ${posts.id} AND is_deleted = false)`.as('comment_count'),
        isBookmarked: sql<boolean>`true`.as('is_bookmarked'),
        bookmarkedAt: postBookmarks.createdAt,
      })
      .from(postBookmarks)
      .innerJoin(posts, eq(posts.id, postBookmarks.postId))
      .innerJoin(userProfiles, eq(userProfiles.userId, posts.authorId))
      .where(and(eq(postBookmarks.userId, userId), eq(posts.status, 'published')))
      .orderBy(desc(postBookmarks.createdAt));

    return rows;
  }

  // ─── Post Images ──────────────────────────────────────────────────────────────

  async uploadPostImage(
    userId: string,
    postId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ): Promise<{ imageKey: string }> {
    const post = await this.db.query.posts.findFirst({
      where: and(eq(posts.id, postId), eq(posts.status, 'published')),
    });
    if (!post) throw new NotFoundException('Gönderi bulunamadı.');
    if (post.authorId !== userId) throw new ForbiddenException('Bu gönderiye görsel yükleyemezsiniz.');

    const { key, url } = await this.storageService.upload(file.buffer, {
      folder: 'post-images',
      originalFilename: file.originalname,
      mimeType: file.mimetype,
    });

    await this.db.insert(postImages).values({ postId, imageKey: url });
    return { imageKey: url };
  }

  // ─── Poll ─────────────────────────────────────────────────────────────────────

  async setPollOptions(postId: string, options: string[]): Promise<void> {
    await this.db.delete(pollOptions).where(eq(pollOptions.postId, postId));
    if (options.length === 0) return;
    await this.db.insert(pollOptions).values(
      options.map((text, i) => ({ postId, text: text.trim(), sortOrder: i })),
    );
  }

  async voteOnPoll(
    userId: string,
    postId: string,
    optionId: string,
  ): Promise<{ optionId: string | null }> {
    const option = await this.db.query.pollOptions.findFirst({
      where: and(eq(pollOptions.id, optionId), eq(pollOptions.postId, postId)),
    });
    if (!option) throw new BadRequestException('Geçersiz seçenek.');

    const existing = await this.db.query.pollVotes.findFirst({
      where: and(eq(pollVotes.postId, postId), eq(pollVotes.userId, userId)),
    });

    if (existing) {
      if (existing.optionId === optionId) {
        await this.db.delete(pollVotes).where(eq(pollVotes.id, existing.id));
        return { optionId: null };
      }
      await this.db
        .update(pollVotes)
        .set({ optionId })
        .where(eq(pollVotes.id, existing.id));
      return { optionId };
    }

    await this.db.insert(pollVotes).values({ postId, optionId, userId });
    return { optionId };
  }

  // ─── Mentions ─────────────────────────────────────────────────────────────────

  private async processMentions(authorId: string, postId: string, body: string): Promise<void> {
    const rawMentions = [...body.matchAll(MENTION_PATTERN)].map((m) => m[1]?.trim()).filter((s): s is string => Boolean(s));
    if (rawMentions.length === 0) return;

    const uniqueNames = [...new Set(rawMentions)];

    for (const name of uniqueNames) {
      const profile = await this.db.query.userProfiles.findFirst({
        where: ilike(userProfiles.displayName, name),
      });
      if (profile && profile.userId !== authorId) {
        await this.notificationsService.create(profile.userId, {
          type: 'new_mention',
          title: 'Sizi bir gönderide bahsetti',
          body: `@${name} sizi bir gönderide etiketledi.`,
          data: { postId },
        });
      }
    }
  }
}

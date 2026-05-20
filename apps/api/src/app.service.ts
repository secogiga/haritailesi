import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, isNull, ilike, or } from 'drizzle-orm';
import { InjectDb } from './database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { users, posts, mentorProfiles, userProfiles } from '@haritailesi/database';
import { REDIS_TOKEN } from './redis/redis.constants';
import type Redis from 'ioredis';

const STATS_CACHE_KEY = 'mutfak:stats:v1';
const STATS_TTL_SECONDS = 300; // 5 minutes

@Injectable()
export class AppService {
  constructor(
    @InjectDb() private readonly db: Database,
    @Inject(REDIS_TOKEN) private readonly redis: Redis,
  ) {}

  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'haritailesi-api',
    };
  }

  async getStats() {
    const cached = await this.redis.get(STATS_CACHE_KEY);
    if (cached) return JSON.parse(cached) as Record<string, number>;

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [memberRow, postsRow, mentorRow] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(users)
        .where(and(eq(users.status, 'active'), isNull(users.deletedAt))),

      this.db
        .select({ count: count() })
        .from(posts)
        .where(and(eq(posts.status, 'published'), gte(posts.createdAt, weekAgo))),

      this.db
        .select({ count: count() })
        .from(mentorProfiles)
        .where(eq(mentorProfiles.isAcceptingRequests, true)),
    ]);

    const stats = {
      memberCount: memberRow[0]?.count ?? 0,
      postsThisWeek: postsRow[0]?.count ?? 0,
      activeMentors: mentorRow[0]?.count ?? 0,
    };

    await this.redis.setex(STATS_CACHE_KEY, STATS_TTL_SECONDS, JSON.stringify(stats));
    return stats;
  }

  async search(q: string, type: 'all' | 'posts' | 'members' = 'all') {
    const like = `%${q}%`;
    const [searchPosts, searchMembers] = await Promise.all([
      type !== 'members'
        ? this.db
            .select({
              id: posts.id,
              type: posts.type,
              title: posts.title,
              body: posts.body,
              createdAt: posts.createdAt,
              authorId: posts.authorId,
              displayName: userProfiles.displayName,
              avatarUrl: userProfiles.avatarUrl,
            })
            .from(posts)
            .innerJoin(userProfiles, eq(userProfiles.userId, posts.authorId))
            .where(and(
              eq(posts.status, 'published'),
              or(ilike(posts.title, like), ilike(posts.body, like))!,
            ))
            .orderBy(desc(posts.createdAt))
            .limit(10)
        : Promise.resolve([]),
      type !== 'posts'
        ? this.db
            .select({
              id: users.id,
              displayName: userProfiles.displayName,
              avatarUrl: userProfiles.avatarUrl,
              profession: userProfiles.profession,
              city: userProfiles.city,
              membershipTier: users.membershipTier,
            })
            .from(users)
            .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
            .where(and(
              eq(users.status, 'active'),
              isNull(users.deletedAt),
              or(ilike(userProfiles.displayName, like), ilike(userProfiles.profession, like))!,
            ))
            .limit(10)
        : Promise.resolve([]),
    ]);

    return { posts: searchPosts, members: searchMembers };
  }

  async scrapeOg(url: string): Promise<{ title: string | null; description: string | null; image: string | null; siteName: string | null }> {
    const cacheKey = `og:${url}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as ReturnType<AppService['scrapeOg']> extends Promise<infer T> ? T : never;

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Haritailesi Bot/1.0' },
        signal: AbortSignal.timeout(5000),
      });
      const html = await res.text();

      const extract = (prop: string): string | null => {
        const match = new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, 'i').exec(html)
          ?? new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`, 'i').exec(html);
        return match?.[1] ?? null;
      };

      const result = {
        title: extract('title'),
        description: extract('description'),
        image: extract('image'),
        siteName: extract('site_name'),
      };

      await this.redis.setex(cacheKey, 3600, JSON.stringify(result));
      return result;
    } catch {
      return { title: null, description: null, image: null, siteName: null };
    }
  }
}

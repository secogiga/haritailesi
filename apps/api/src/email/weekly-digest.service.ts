import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { users, userProfiles, posts, notificationPreferences } from '@haritailesi/database';
import { and, desc, eq, gte, isNull, sql } from 'drizzle-orm';
import { EmailService } from './email.service';

@Injectable()
export class WeeklyDigestService {
  private readonly logger = new Logger(WeeklyDigestService.name);

  constructor(
    @InjectDb() private readonly db: Database,
    private readonly emailService: EmailService,
  ) {}

  // Her Pazartesi 08:00 UTC
  @Cron('0 8 * * 1')
  async sendWeeklyDigests(): Promise<void> {
    this.logger.log('Haftalık özet emaili gönderimi başlıyor...');

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [topPosts, newMemberCount] = await Promise.all([
      this.db
        .select({
          title: posts.title,
          body: posts.body,
          displayName: userProfiles.displayName,
          reactionCount: sql<number>`(SELECT COUNT(*) FROM post_reactions WHERE post_id = ${posts.id})`,
        })
        .from(posts)
        .innerJoin(userProfiles, eq(userProfiles.userId, posts.authorId))
        .where(and(eq(posts.status, 'published'), gte(posts.createdAt, weekAgo)))
        .orderBy(desc(sql`(SELECT COUNT(*) FROM post_reactions WHERE post_id = ${posts.id})`))
        .limit(3),
      this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(and(gte(users.createdAt, weekAgo), isNull(users.deletedAt)))
        .then((r) => Number(r[0]?.count ?? 0)),
    ]);

    const [activeMembers, optedOut] = await Promise.all([
      this.db
        .select({
          userId: users.id,
          email: users.email,
          displayName: userProfiles.displayName,
        })
        .from(users)
        .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
        .where(and(eq(users.status, 'active'), isNull(users.deletedAt))),
      // users who explicitly disabled weekly_digest
      this.db
        .select({ userId: notificationPreferences.userId })
        .from(notificationPreferences)
        .where(sql`(preferences->>'weekly_digest')::boolean = false`),
    ]);

    const optedOutIds = new Set(optedOut.map((r) => r.userId));

    const topPostSummary = topPosts
      .map((p, i) => `${i + 1}. ${p.title ?? p.body.slice(0, 80)} — ${p.displayName}`)
      .join('\n') || 'Bu hafta gönderi bulunmuyor.';

    let sent = 0;
    for (const member of activeMembers) {
      if (optedOutIds.has(member.userId)) continue;
      try {
        await this.emailService.send(member.email, 'weekly_digest', {
          displayName: member.displayName ?? 'Üye',
          newMemberCount: String(newMemberCount),
          topPosts: topPostSummary,
          weekYear: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
        });
        sent++;
      } catch (err) {
        this.logger.warn(`Digest email gönderilemedi: ${member.email} — ${String(err)}`);
      }
    }

    this.logger.log(`Haftalık özet: ${sent}/${activeMembers.length} üyeye gönderildi.`);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, or, desc, isNull } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { Subject } from 'rxjs';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { dmThreads, directMessages, users, userProfiles } from '@haritailesi/database';

@Injectable()
export class MessagesService {
  private readonly streams = new Map<string, Subject<MessageEvent>>();

  constructor(@InjectDb() private readonly db: Database) {}

  getStream(userId: string): Subject<MessageEvent> {
    if (!this.streams.has(userId)) {
      this.streams.set(userId, new Subject<MessageEvent>());
    }
    return this.streams.get(userId)!;
  }

  closeStream(userId: string): void {
    const subject = this.streams.get(userId);
    if (subject) {
      subject.complete();
      this.streams.delete(userId);
    }
  }

  private emitToUser(userId: string, data: unknown): void {
    const subject = this.streams.get(userId);
    if (subject && !subject.closed) {
      subject.next(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  private resolveUserPair(a: string, b: string): [string, string] {
    return a < b ? [a, b] : [b, a];
  }

  async getOrCreateThread(user1Id: string, user2Id: string): Promise<typeof dmThreads.$inferSelect> {
    const [id1, id2] = this.resolveUserPair(user1Id, user2Id);

    const existing = await this.db.query.dmThreads.findFirst({
      where: and(eq(dmThreads.user1Id, id1), eq(dmThreads.user2Id, id2)),
    });
    if (existing) return existing;

    const other = await this.db.query.users.findFirst({
      where: and(eq(users.id, user2Id), eq(users.status, 'active'), isNull(users.deletedAt)),
    });
    if (!other) throw new NotFoundException('Üye bulunamadı.');

    const [created] = await this.db
      .insert(dmThreads)
      .values({ user1Id: id1, user2Id: id2 })
      .returning();

    return created!;
  }

  async sendMessage(senderId: string, recipientId: string, body: string) {
    const thread = await this.getOrCreateThread(senderId, recipientId);

    const [msg] = await this.db
      .insert(directMessages)
      .values({ threadId: thread.id, senderId, recipientId, body })
      .returning();

    await this.db
      .update(dmThreads)
      .set({ lastMessageAt: new Date() })
      .where(eq(dmThreads.id, thread.id));

    this.emitToUser(recipientId, msg);

    return msg;
  }

  async getMessages(userId: string, otherUserId: string) {
    const thread = await this.getOrCreateThread(userId, otherUserId);

    const rows = await this.db
      .select()
      .from(directMessages)
      .where(eq(directMessages.threadId, thread.id))
      .orderBy(directMessages.createdAt);

    // Mark incoming messages as read
    await this.db
      .update(directMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(directMessages.threadId, thread.id),
          eq(directMessages.recipientId, userId),
          eq(directMessages.isRead, false),
        ),
      );

    return rows;
  }

  async getThreads(userId: string) {
    const rows = await this.db
      .select({
        threadId: dmThreads.id,
        user1Id: dmThreads.user1Id,
        user2Id: dmThreads.user2Id,
        lastMessageAt: dmThreads.lastMessageAt,
        lastBody: sql<string>`(SELECT body FROM direct_messages WHERE thread_id = ${dmThreads.id} ORDER BY created_at DESC LIMIT 1)`.as('last_body'),
        unreadCount: sql<number>`(SELECT COUNT(*) FROM direct_messages WHERE thread_id = ${dmThreads.id} AND recipient_id = ${userId} AND is_read = false)`.as('unread_count'),
      })
      .from(dmThreads)
      .where(or(eq(dmThreads.user1Id, userId), eq(dmThreads.user2Id, userId)))
      .orderBy(desc(dmThreads.lastMessageAt));

    // Enrich with counterpart profile
    const enriched = await Promise.all(
      rows.map(async (row) => {
        const counterpartId = row.user1Id === userId ? row.user2Id : row.user1Id;
        const profile = await this.db
          .select({
            id: users.id,
            displayName: userProfiles.displayName,
            avatarUrl: userProfiles.avatarUrl,
            profession: userProfiles.profession,
          })
          .from(users)
          .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
          .where(eq(users.id, counterpartId))
          .limit(1);

        return { ...row, counterpart: profile[0] ?? null };
      }),
    );

    return enriched;
  }

  async markThreadRead(userId: string, otherUserId: string): Promise<void> {
    const thread = await this.getOrCreateThread(userId, otherUserId);
    await this.db
      .update(directMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(directMessages.threadId, thread.id),
          eq(directMessages.recipientId, userId),
          eq(directMessages.isRead, false),
        ),
      );
  }
}

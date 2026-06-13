import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { eq, and, or, desc, isNull, lt, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { Subject } from 'rxjs';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import type Redis from 'ioredis';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { dmThreads, directMessages, users, userProfiles, userFunctionalRoles } from '@haritailesi/database';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { EMAIL_QUEUE, REDIS_TOKEN, REDIS_SUB_TOKEN } from '../redis/redis.constants';

const DM_EMAIL_DELAY_MS = 10 * 60 * 1000;
const DM_CHANNEL_PREFIX = 'dm:user:';
const STAFF_DISPLAY_NAME = 'Haritailesi Yönetimi';

@Injectable()
export class MessagesService implements OnModuleInit {
  private readonly streams = new Map<string, Subject<MessageEvent>>();

  constructor(
    @InjectDb() private readonly db: Database,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue,
    @Inject(REDIS_TOKEN) private readonly redis: Redis,
    @Inject(REDIS_SUB_TOKEN) private readonly redisSub: Redis,
  ) {}

  onModuleInit(): void {
    void this.redisSub.psubscribe(`${DM_CHANNEL_PREFIX}*`);
    this.redisSub.on('pmessage', (_pattern: string, channel: string, rawMessage: string) => {
      const userId = channel.slice(DM_CHANNEL_PREFIX.length);
      const subject = this.streams.get(userId);
      if (subject && !subject.closed) {
        subject.next(new MessageEvent('message', { data: rawMessage }));
      }
    });
  }

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
    void this.redis.publish(`${DM_CHANNEL_PREFIX}${userId}`, JSON.stringify(data));
  }

  private resolveUserPair(a: string, b: string): [string, string] {
    return a < b ? [a, b] : [b, a];
  }

  private dmEmailJobId(recipientId: string, threadId: string): string {
    return `dm:notify:${recipientId}:${threadId}`;
  }

  private async cancelDmEmailJob(recipientId: string, threadId: string): Promise<void> {
    const jobId = this.dmEmailJobId(recipientId, threadId);
    const job = await this.emailQueue.getJob(jobId);
    if (job) await job.remove();
  }

  private async isStaff(userId: string): Promise<boolean> {
    const row = await this.db
      .select({ id: userFunctionalRoles.id })
      .from(userFunctionalRoles)
      .where(and(eq(userFunctionalRoles.userId, userId), eq(userFunctionalRoles.isActive, true)))
      .limit(1);
    return row.length > 0;
  }

  async getOrCreateThread(
    user1Id: string,
    user2Id: string,
    opts: { requireRecipientActive?: boolean } = {},
  ): Promise<typeof dmThreads.$inferSelect> {
    const [id1, id2] = this.resolveUserPair(user1Id, user2Id);

    const existing = await this.db.query.dmThreads.findFirst({
      where: and(eq(dmThreads.user1Id, id1), eq(dmThreads.user2Id, id2)),
    });
    if (existing) return existing;

    // Validate recipient exists (active check is optional — skipped for admin DMs)
    const recipientWhere = opts.requireRecipientActive
      ? and(eq(users.id, user2Id), eq(users.status, 'active'), isNull(users.deletedAt))
      : and(eq(users.id, user2Id), isNull(users.deletedAt));

    const other = await this.db.query.users.findFirst({ where: recipientWhere });
    if (!other) throw new NotFoundException('Üye bulunamadı.');

    const [created] = await this.db
      .insert(dmThreads)
      .values({ user1Id: id1, user2Id: id2 })
      .returning();

    return created!;
  }

  async sendMessage(
    senderId: string,
    recipientId: string,
    body: string,
    opts: { requireRecipientActive?: boolean } = {},
  ) {
    const thread = await this.getOrCreateThread(senderId, recipientId, {
      ...(opts.requireRecipientActive !== undefined ? { requireRecipientActive: opts.requireRecipientActive } : {}),
    });

    const [msg] = await this.db
      .insert(directMessages)
      .values({ threadId: thread.id, senderId, recipientId, body })
      .returning();

    await this.db
      .update(dmThreads)
      .set({ lastMessageAt: new Date() })
      .where(eq(dmThreads.id, thread.id));

    this.emitToUser(recipientId, { type: 'dm_message', ...msg });

    // Sender display name (staff → branded name for notifications)
    const senderIsStaff = await this.isStaff(senderId);
    const senderProfile = await this.db
      .select({ displayName: userProfiles.displayName })
      .from(userProfiles)
      .where(eq(userProfiles.userId, senderId))
      .limit(1);
    const senderName = senderIsStaff
      ? STAFF_DISPLAY_NAME
      : (senderProfile[0]?.displayName ?? 'Bir üye');

    // In-app notification + web push
    void this.notificationsService.create(recipientId, {
      type: 'dm',
      title: senderName,
      body: body.length > 100 ? body.slice(0, 100) + '…' : body,
      data: { senderId, threadId: thread.id, url: '/mesajlar?with=' + senderId },
    });

    // Delayed email
    const recipientRow = await this.db
      .select({ email: users.email, displayName: userProfiles.displayName })
      .from(users)
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(users.id, recipientId))
      .limit(1);

    if (recipientRow[0]?.email) {
      const { email, displayName } = recipientRow[0];
      const jobId = this.dmEmailJobId(recipientId, thread.id);
      const existing = await this.emailQueue.getJob(jobId);
      if (existing) await existing.remove();
      void this.emailService.sendDmReceived(
        email,
        displayName ?? 'Değerli Üye',
        senderName,
        body,
        DM_EMAIL_DELAY_MS,
        jobId,
      );
    }

    return msg;
  }

  async getMessages(
    userId: string,
    otherUserId: string,
    opts: { limit?: number; before?: string } = {},
  ) {
    const thread = await this.getOrCreateThread(userId, otherUserId);
    const limit = Math.min(opts.limit ?? 50, 100);

    // Fetch newest-first so cursor (before) works correctly, then reverse for display
    const rows = await this.db
      .select()
      .from(directMessages)
      .where(
        and(
          eq(directMessages.threadId, thread.id),
          opts.before ? lt(directMessages.createdAt, new Date(opts.before)) : undefined,
        ),
      )
      .orderBy(desc(directMessages.createdAt))
      .limit(limit + 1); // +1 to detect hasMore

    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit).reverse(); // ASC for rendering

    // Mark incoming as read
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

    // Real-time read receipt to sender
    this.emitToUser(otherUserId, { type: 'read_receipt', threadId: thread.id, readBy: userId });

    void this.cancelDmEmailJob(userId, thread.id);

    // Return with corrected isRead
    const data = page.map((r) => (r.recipientId === userId ? { ...r, isRead: true } : r));
    return { data, hasMore };
  }

  async getThreads(userId: string) {
    // Query 1 — thread rows (with subquery scalars for lastBody + unreadCount)
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

    if (rows.length === 0) return [];

    // Collect unique counterpart IDs in one pass
    const counterpartIds = [...new Set(
      rows.map((r) => (r.user1Id === userId ? r.user2Id : r.user1Id)),
    )];

    // Query 2 — all counterpart profiles in a single IN query
    const profiles = await this.db
      .select({
        id: users.id,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        profession: userProfiles.profession,
      })
      .from(users)
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(inArray(users.id, counterpartIds));

    // Query 3 — all isStaff flags in a single IN query
    const staffRows = await this.db
      .select({ userId: userFunctionalRoles.userId })
      .from(userFunctionalRoles)
      .where(
        and(
          inArray(userFunctionalRoles.userId, counterpartIds),
          eq(userFunctionalRoles.isActive, true),
        ),
      );

    // Build lookup maps (O(1) access per row)
    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    const staffSet = new Set(staffRows.map((s) => s.userId));

    return rows.map((row) => {
      const counterpartId = row.user1Id === userId ? row.user2Id : row.user1Id;
      const profile = profileMap.get(counterpartId) ?? null;
      const isStaff = staffSet.has(counterpartId);

      return {
        ...row,
        counterpart: profile
          ? {
              ...profile,
              displayName: isStaff ? STAFF_DISPLAY_NAME : profile.displayName,
              isStaff,
            }
          : null,
      };
    });
  }

  async deleteThread(userId: string, otherUserId: string): Promise<void> {
    const [id1, id2] = this.resolveUserPair(userId, otherUserId);
    const thread = await this.db.query.dmThreads.findFirst({
      where: and(eq(dmThreads.user1Id, id1), eq(dmThreads.user2Id, id2)),
    });
    if (!thread) return;
    await this.db.delete(directMessages).where(eq(directMessages.threadId, thread.id));
    await this.db.delete(dmThreads).where(eq(dmThreads.id, thread.id));
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

    this.emitToUser(otherUserId, { type: 'read_receipt', threadId: thread.id, readBy: userId });
    void this.cancelDmEmailJob(userId, thread.id);
  }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { Subject } from 'rxjs';
import { eq, and, desc } from 'drizzle-orm';
import * as webpush from 'web-push';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { notifications, notificationPreferences, pushSubscriptions } from '@haritailesi/database';
import { PUSH_QUEUE } from '../redis/redis.constants';
import type { PushJob } from './push.types';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  // userId → Subject for SSE streams
  private readonly streams = new Map<string, Subject<MessageEvent>>();

  constructor(
    @InjectDb() private readonly db: Database,
    @InjectQueue(PUSH_QUEUE) private readonly pushQueue: Queue<PushJob>,
  ) {}

  onModuleInit() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (publicKey && privateKey) {
      webpush.setVapidDetails('mailto:destek@haritailesi.org', publicKey, privateKey);
    }
  }

  // ── SSE stream management ──────────────────────────────────────────────────

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

  private emit(userId: string, type: string, data: unknown): void {
    const subject = this.streams.get(userId);
    if (subject && !subject.closed) {
      subject.next(new MessageEvent(type, { data: JSON.stringify(data) }));
    }
  }

  // ── Preferences ────────────────────────────────────────────────────────────

  async getPreferences(userId: string): Promise<Record<string, boolean>> {
    const row = await this.db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    });
    return row?.preferences ?? {};
  }

  async updatePreferences(userId: string, prefs: Record<string, boolean>): Promise<void> {
    await this.db
      .insert(notificationPreferences)
      .values({ userId, preferences: prefs })
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: { preferences: prefs, updatedAt: new Date() },
      });
  }

  async getForUser(userId: string) {
    return this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(30);
  }

  async markAllRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return { ok: true };
  }

  async create(
    userId: string,
    opts: { type: string; title: string; body: string; data?: Record<string, string> },
  ) {
    // Check if user has disabled this notification type
    const prefs = await this.getPreferences(userId);
    if (prefs[opts.type] === false) return null;

    const [created] = await this.db
      .insert(notifications)
      .values({
        userId,
        type: opts.type,
        title: opts.title,
        body: opts.body,
        ...(opts.data ? { data: opts.data } : {}),
      })
      .returning();
    // Push SSE event to live stream if connected
    if (created) this.emit(userId, 'notification', created);
    // Enqueue web push delivery (BullMQ — retried on failure)
    if (created) {
      await this.pushQueue.add(
        'send',
        { userId, title: opts.title, body: opts.body, tag: opts.type },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 100, removeOnFail: 200 },
      );
    }
    return created;
  }

  async unreadCount(userId: string) {
    const rows = await this.db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return { count: rows.length };
  }

  // ── Push subscriptions ─────────────────────────────────────────────────────

  async savePushSubscription(userId: string, sub: { endpoint: string; p256dh: string; auth: string }) {
    await this.db
      .insert(pushSubscriptions)
      .values({ userId, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth })
      .onConflictDoNothing();
    return { ok: true };
  }

  async deletePushSubscription(userId: string, endpoint: string) {
    await this.db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
    return { ok: true };
  }

}

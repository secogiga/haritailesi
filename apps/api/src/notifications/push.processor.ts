import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import * as webpush from 'web-push';
import { eq } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { pushSubscriptions } from '@haritailesi/database';
import { PUSH_QUEUE } from '../redis/redis.constants';
import type { PushJob } from './push.types';

@Processor(PUSH_QUEUE, {
  concurrency: 5,
  // 3 retry with exponential backoff: 5s, 25s, 125s
  limiter: { max: 100, duration: 1000 },
})
export class PushProcessor extends WorkerHost {
  private readonly logger = new Logger(PushProcessor.name);

  constructor(@InjectDb() private readonly db: Database) {
    super();
  }

  async process(job: Job<PushJob>): Promise<void> {
    if (!process.env.VAPID_PUBLIC_KEY) return;

    const { userId, title, body, url, tag } = job.data;

    const subs = await this.db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subs.length === 0) return;

    const payload = JSON.stringify({ title, body, ...(url ? { url } : {}), ...(tag ? { tag } : {}) });
    const expired: string[] = [];

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
        } catch (err: unknown) {
          const status = err && typeof err === 'object' && 'statusCode' in err
            ? (err as { statusCode: number }).statusCode
            : 0;
          if (status === 410) {
            expired.push(sub.id);
          } else {
            this.logger.warn(`push_failed uid=${userId} endpoint=${sub.endpoint.slice(-20)} err=${String(err)}`);
            throw err; // trigger BullMQ retry for this job
          }
        }
      }),
    );

    // Remove expired subscriptions
    for (const id of expired) {
      await this.db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
    }

    this.logger.debug(`push_sent uid=${userId} subs=${subs.length} expired=${expired.length}`);
  }
}

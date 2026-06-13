import { Controller, Get, Inject, HttpCode } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import type Redis from 'ioredis';
import { Public } from '../auth/decorators/public.decorator';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { REDIS_TOKEN, EMAIL_QUEUE, PUSH_QUEUE } from '../redis/redis.constants';
import { sql } from 'drizzle-orm';

type CheckStatus = 'ok' | 'fail';

interface HealthCheck {
  status: CheckStatus;
  latencyMs?: number;
  detail?: string;
}

interface HealthResponse {
  status: 'ok' | 'degraded';
  checks: {
    db: HealthCheck;
    redis: HealthCheck;
    emailQueue: HealthCheck & { waiting?: number; failed?: number };
    pushQueue: HealthCheck & { waiting?: number; failed?: number };
  };
  timestamp: string;
}

@Controller('health')
export class HealthController {
  constructor(
    @InjectDb() private readonly db: Database,
    @Inject(REDIS_TOKEN) private readonly redis: Redis,
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue,
    @InjectQueue(PUSH_QUEUE) private readonly pushQueue: Queue,
  ) {}

  @Get()
  @Public()
  @HttpCode(200)
  async check(): Promise<HealthResponse> {
    const [db, redis, emailQueue, pushQueue] = await Promise.all([
      this.checkDb(),
      this.checkRedis(),
      this.checkQueue(this.emailQueue),
      this.checkQueue(this.pushQueue),
    ]);

    const anyFail = [db, redis, emailQueue, pushQueue].some((c) => c.status === 'fail');

    return {
      status: anyFail ? 'degraded' : 'ok',
      checks: { db, redis, emailQueue, pushQueue },
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDb(): Promise<HealthCheck> {
    const t = Date.now();
    try {
      await this.db.execute(sql`SELECT 1`);
      return { status: 'ok', latencyMs: Date.now() - t };
    } catch (err) {
      return { status: 'fail', detail: String(err) };
    }
  }

  private async checkRedis(): Promise<HealthCheck> {
    const t = Date.now();
    try {
      const res = await this.redis.ping();
      return { status: res === 'PONG' ? 'ok' : 'fail', latencyMs: Date.now() - t };
    } catch (err) {
      return { status: 'fail', detail: String(err) };
    }
  }

  private async checkQueue(queue: Queue): Promise<HealthCheck & { waiting?: number; failed?: number }> {
    try {
      const counts = await queue.getJobCounts('waiting', 'failed');
      return {
        status: 'ok',
        waiting: counts['waiting'] ?? 0,
        failed: counts['failed'] ?? 0,
      };
    } catch (err) {
      return { status: 'fail', detail: String(err) };
    }
  }
}

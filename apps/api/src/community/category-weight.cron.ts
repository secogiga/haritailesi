import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Inject } from '@nestjs/common';
import { REDIS_TOKEN } from '../redis/redis.constants';
import type Redis from 'ioredis';

@Injectable()
export class CategoryWeightCron {
  private readonly logger = new Logger(CategoryWeightCron.name);

  constructor(@Inject(REDIS_TOKEN) private readonly redis: Redis) {}

  // Haftalık kapsamlı hesaplama — Pazartesi 02:00
  @Cron('0 2 * * 1')
  async weeklyRecompute(): Promise<void> {
    this.logger.log('Haftalık kategori bias hesaplama başladı.');
    await this.recompute();
    await this.redis.set('bias_last_count', String(
      (await this.redis.llen('category_corrections')) + (await this.redis.llen('category_confirms'))
    ));
    this.logger.log('Haftalık bias hesaplama tamamlandı.');
  }

  async recompute(): Promise<void> {
    const corrRaw = await this.redis.lrange('category_corrections', 0, -1);
    const confRaw = await this.redis.lrange('category_confirms', 0, -1);

    const delta: Record<string, number> = {};
    const bump = (cat: string, n: number) => { delta[cat] = (delta[cat] ?? 0) + n; };

    // Düzeltmeler: güçlü sinyal (-1.5 yanlış, +1.5 doğru)
    for (const item of corrRaw) {
      try {
        const e = JSON.parse(item) as { detected: string; corrected: string };
        bump(e.detected, -1.5);
        bump(e.corrected, +1.5);
      } catch { /* skip */ }
    }

    // Onaylar: zayıf pozitif sinyal (+0.4)
    for (const item of confRaw) {
      try {
        const e = JSON.parse(item) as { categoryId: string };
        bump(e.categoryId, +0.4);
      } catch { /* skip */ }
    }

    const total = Math.max(corrRaw.length + confRaw.length, 1);
    const normalized: Record<string, number> = {};
    for (const [cat, v] of Object.entries(delta)) {
      normalized[cat] = Math.max(-2, Math.min(2, Math.round((v / total) * 10 * 100) / 100));
    }

    // Pair bias — LLM prompt'u için
    const pairFreq: Record<string, number> = {};
    for (const item of corrRaw) {
      try {
        const e = JSON.parse(item) as { detected: string; corrected: string };
        if (e.detected !== e.corrected) {
          const key = `${e.detected}→${e.corrected}`;
          pairFreq[key] = (pairFreq[key] ?? 0) + 1;
        }
      } catch { /* skip */ }
    }
    const pairBias: Record<string, number> = {};
    for (const [key, count] of Object.entries(pairFreq)) {
      const ratio = count / Math.max(corrRaw.length, 1);
      if (ratio >= 0.05 && count >= 3) pairBias[key] = Math.round(ratio * 100) / 100;
    }

    await Promise.all([
      this.redis.set('category_direct_bias', JSON.stringify(normalized), 'EX', 60 * 60 * 24 * 8),
      this.redis.set('category_bias', JSON.stringify(pairBias), 'EX', 60 * 60 * 24 * 8),
    ]);
  }
}

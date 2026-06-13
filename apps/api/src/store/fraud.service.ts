import { Injectable, Logger } from '@nestjs/common';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { storeFraudBlockedIps } from '@haritailesi/database';
import { eq, or, gt, isNull } from 'drizzle-orm';

export type FraudLevel = 'low' | 'medium' | 'high' | 'block';

export interface FraudCheck {
  level: FraudLevel;
  score: number;         // 0-100
  flags: string[];
  shouldBlock: boolean;
  requireManualReview: boolean;
}

interface OrderContext {
  buyerEmail: string;
  buyerIp?: string;
  total: number;
  items: Array<{ type: string; price: number; quantity: number }>;
  previousOrderEmails?: string[];  // aynı IP'den farklı email
  recentOrderCount?: number;       // son 24h aynı emailden kaç sipariş
  recentFailedPayments?: number;
}

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  constructor(@InjectDb() private readonly db: Database) {}

  // İzin verilen e-posta alan adları bloklist
  private readonly BLOCKED_DOMAINS = [
    'mailinator.com', 'guerrillamail.com', 'tempmail.com',
    'throwaway.email', 'yopmail.com', '10minutemail.com',
  ];

  async isIpBlocked(ip: string): Promise<boolean> {
    const now = new Date();
    const row = await this.db.query.storeFraudBlockedIps.findFirst({
      where: eq(storeFraudBlockedIps.ip, ip),
    });
    if (!row) return false;
    if (row.expiresAt && row.expiresAt < now) {
      // Süresi dolmuş — temizle
      await this.db.delete(storeFraudBlockedIps).where(eq(storeFraudBlockedIps.ip, ip));
      return false;
    }
    return true;
  }

  async evaluate(ctx: OrderContext): Promise<FraudCheck> {
    const flags: string[] = [];
    let score = 0;

    // 1. Geçici e-posta
    const domain = ctx.buyerEmail.split('@')[1]?.toLowerCase() ?? '';
    if (this.BLOCKED_DOMAINS.includes(domain)) {
      flags.push('disposable_email');
      score += 40;
    }

    // 2. Engelli IP (DB'den kontrol)
    if (ctx.buyerIp && await this.isIpBlocked(ctx.buyerIp)) {
      flags.push('blocked_ip');
      score += 100; // direkt blok
    }

    // 3. Yüksek değerli sipariş
    if (ctx.total > 50000_00) { // 50.000 TL
      flags.push('high_value_order');
      score += 20;
    } else if (ctx.total > 10000_00) { // 10.000 TL
      flags.push('large_order');
      score += 10;
    }

    // 4. Aynı IP'den birden fazla e-posta
    if ((ctx.previousOrderEmails?.length ?? 0) > 2) {
      flags.push('multiple_emails_same_ip');
      score += 25;
    }

    // 5. Son 24 saatte çok fazla sipariş
    if ((ctx.recentOrderCount ?? 0) > 5) {
      flags.push('velocity_abuse');
      score += 30;
    } else if ((ctx.recentOrderCount ?? 0) > 3) {
      flags.push('high_frequency');
      score += 15;
    }

    // 6. Ardışık ödeme başarısızlıkları
    if ((ctx.recentFailedPayments ?? 0) > 2) {
      flags.push('payment_retry_abuse');
      score += 20;
    }

    // 7. Dijital ürünlerde yüksek miktar
    const digitalItems = ctx.items.filter(i => i.type === 'digital');
    const digitalQty = digitalItems.reduce((s, i) => s + i.quantity, 0);
    if (digitalQty > 10) {
      flags.push('high_digital_quantity');
      score += 15;
    }

    // Seviye belirle
    let level: FraudLevel = 'low';
    if (score >= 70) level = 'block';
    else if (score >= 50) level = 'high';
    else if (score >= 25) level = 'medium';

    const result: FraudCheck = {
      level,
      score,
      flags,
      shouldBlock: level === 'block',
      requireManualReview: level === 'high' || level === 'block',
    };

    if (result.shouldBlock) {
      this.logger.warn(`Fraud block: ${ctx.buyerEmail} | score=${score} | flags=${flags.join(',')}`);
    } else if (result.requireManualReview) {
      this.logger.warn(`Fraud review: ${ctx.buyerEmail} | score=${score} | flags=${flags.join(',')}`);
    }

    return result;
  }

  async markIpSuspicious(ip: string, reason?: string, blockedBy?: string, expiresAt?: Date) {
    await this.db.insert(storeFraudBlockedIps)
      .values({ ip, reason: reason ?? null, blockedBy: blockedBy ?? null, expiresAt: expiresAt ?? null })
      .onConflictDoUpdate({
        target: storeFraudBlockedIps.ip,
        set: { reason: reason ?? null, blockedBy: blockedBy ?? null, expiresAt: expiresAt ?? null, createdAt: new Date() },
      });
    this.logger.warn(`IP blocked in DB: ${ip} | reason: ${reason ?? 'manual'}`);
  }

  async clearIpSuspicion(ip: string) {
    await this.db.delete(storeFraudBlockedIps).where(eq(storeFraudBlockedIps.ip, ip));
    this.logger.log(`IP unblocked: ${ip}`);
  }

  async listBlockedIps() {
    const now = new Date();
    return this.db.select().from(storeFraudBlockedIps)
      .where(or(isNull(storeFraudBlockedIps.expiresAt), gt(storeFraudBlockedIps.expiresAt, now)));
  }
}

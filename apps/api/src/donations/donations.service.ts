import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc, and, sql, sum, type SQL } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { donations, users } from '@haritailesi/database';
import { MembershipService, FREE_TIERS } from '../membership/membership.service';
import { randomBytes } from 'crypto';
import type { MembershipTier } from '@haritailesi/types';

// donationCategory → MembershipTier mapping
const CATEGORY_TO_TIER: Record<string, MembershipTier> = {
  bireysel: 'individual_member',
  kurumsal: 'corporate_member',
  genc:     'haritailesi_genc',
  mezun:    'new_graduate_member',
};

@Injectable()
export class DonationsService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly membershipService: MembershipService,
  ) {}

  async create(dto: {
    userId?: string | undefined;
    email: string;
    fullName: string;
    amount: number;
    currency?: string | undefined;
    type: 'one_time' | 'recurring';
    method: 'bank_transfer' | 'iyzico';
    paymentAccount?: 'vakif' | 'sirket';
    notes?: string | undefined;
    donationCategory?: string | undefined;
    companyName?: string | undefined;
    packageTier?: string | undefined;
  }) {
    const referenceCode = `DON-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
    const isAnnual = dto.type === 'recurring' || dto.donationCategory === 'kurumsal' || dto.donationCategory === 'bireysel';
    const renewalDue = isAnnual
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : undefined;

    const [row] = await this.db
      .insert(donations)
      .values({
        userId: dto.userId ?? null,
        email: dto.email.toLowerCase(),
        fullName: dto.fullName,
        amount: dto.amount,
        currency: dto.currency ?? 'TRY',
        type: dto.type,
        method: dto.method,
        paymentAccount: dto.paymentAccount ?? 'vakif',
        status: 'pending',
        referenceCode,
        notes: dto.notes ?? null,
        donationCategory: dto.donationCategory ?? 'genel',
        companyName: dto.companyName ?? null,
        packageTier: dto.packageTier ?? null,
        renewalDue: renewalDue ?? null,
      })
      .returning({ id: donations.id, referenceCode: donations.referenceCode });

    return row!;
  }

  async list(params: {
    status?: string | undefined;
    method?: string | undefined;
    account?: string | undefined;
    userId?: string | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
  }) {
    const limit = Math.min(params.limit ?? 30, 100);
    const conditions: SQL[] = [];
    if (params.status) conditions.push(eq(donations.status, params.status as 'pending' | 'completed' | 'failed' | 'refunded'));
    if (params.method) conditions.push(eq(donations.method, params.method as 'bank_transfer' | 'iyzico'));
    if (params.account) conditions.push(eq(donations.paymentAccount, params.account as 'vakif' | 'sirket'));
    if (params.userId) conditions.push(eq(donations.userId, params.userId));
    if (params.cursor) {
      conditions.push(sql`${donations.createdAt} < (SELECT created_at FROM donations WHERE id = ${params.cursor})`);
    }

    const rows = await this.db
      .select()
      .from(donations)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(donations.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit);
    return { data, next_cursor: hasMore ? (data[data.length - 1]?.id ?? null) : null, has_more: hasMore };
  }

  async getStats() {
    const [totalRow] = await this.db
      .select({ total: sum(donations.amount), count: sql<number>`COUNT(*)` })
      .from(donations)
      .where(eq(donations.status, 'completed'));

    const [pendingRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(donations)
      .where(eq(donations.status, 'pending'));

    const [thisMonth] = await this.db
      .select({ total: sum(donations.amount) })
      .from(donations)
      .where(and(
        eq(donations.status, 'completed'),
        sql`${donations.completedAt} >= date_trunc('month', now())`,
      ));

    return {
      totalCompleted: Number(totalRow?.count ?? 0),
      totalAmount: Number(totalRow?.total ?? 0),
      pendingCount: Number(pendingRow?.count ?? 0),
      thisMonthAmount: Number(thisMonth?.total ?? 0),
    };
  }

  async confirm(id: string, adminId: string) {
    const donation = await this.findById(id);
    if (!donation) throw new NotFoundException('Bağış bulunamadı.');

    const [row] = await this.db
      .update(donations)
      .set({ status: 'completed', completedAt: new Date() })
      .where(eq(donations.id, id))
      .returning();

    if (!row) throw new NotFoundException('Bağış bulunamadı.');

    // Üyelik bağışı ise abonelik oluştur
    await this.maybeActivateMembership(row);
    return row;
  }

  async findById(id: string) {
    const [row] = await this.db.select().from(donations).where(eq(donations.id, id)).limit(1);
    return row ?? null;
  }

  async setIyzicoToken(id: string, token: string) {
    await this.db.update(donations).set({ iyzicoToken: token }).where(eq(donations.id, id));
  }

  async saveProof(id: string, proofKey: string) {
    await this.db
      .update(donations)
      .set({ proofKey, proofUploadedAt: new Date() })
      .where(eq(donations.id, id));
  }

  // ─── iyzico Webhook ───────────────────────────────────────────────────────────
  // paymentId + conversationId iyzico'dan gelir; token fallback olarak desteklenir

  async handleIyzicoWebhook(payload: {
    token?: string;
    paymentId?: string;
    conversationId?: string;
    status: string;
  }) {
    // Token veya conversationId ile bul
    let existing = null;
    if (payload.token) {
      const [r] = await this.db.select().from(donations).where(eq(donations.iyzicoToken, payload.token)).limit(1);
      existing = r ?? null;
    }
    if (!existing && payload.conversationId) {
      const [r] = await this.db.select().from(donations).where(eq(donations.id, payload.conversationId)).limit(1);
      existing = r ?? null;
    }

    if (!existing) return { processed: false, reason: 'not_found' };

    const isSuccess = payload.status === 'success' || payload.status === 'SUCCESS';
    const [updated] = await this.db
      .update(donations)
      .set({
        status: isSuccess ? 'completed' : 'failed',
        iyzicoPaymentId: payload.paymentId ?? null,
        completedAt: isSuccess ? new Date() : null,
      })
      .where(eq(donations.id, existing.id))
      .returning();

    if (updated && isSuccess) {
      await this.maybeActivateMembership(updated);
    }

    return { processed: true, donationId: existing.id };
  }

  // ─── Üyelik Aktivasyonu ───────────────────────────────────────────────────────

  private async maybeActivateMembership(donation: typeof donations.$inferSelect) {
    if (!donation.donationCategory) return;

    const tier = CATEGORY_TO_TIER[donation.donationCategory];
    if (!tier) return;

    // Ücretsiz tier'lar bu yolla aktive edilmez (admin manuel yapar)
    if (FREE_TIERS.includes(tier)) return;

    try {
      await this.membershipService.createSubscription({
        ...(donation.userId ? { userId: donation.userId } : {}),
        donationId: donation.id,
        ...(donation.userId ? {} : { guestEmail: donation.email, guestFullName: donation.fullName }),
        tier,
      });
    } catch (err) {
      // Duplicate member number gibi hatalar loglanır ama webhook response'unu bozmaz
      console.error('Üyelik aktivasyon hatası:', err);
    }
  }
}

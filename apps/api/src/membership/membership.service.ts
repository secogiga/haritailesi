import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import {
  membershipSubscriptions,
  memberNumberSeqs,
  membershipFeeConfigs,
  users,
  donations,
  setupTokens,
} from '@haritailesi/database';
import { eq, and, lte, isNull, sql } from 'drizzle-orm';
import type { MembershipTier } from '@haritailesi/types';
import { EmailService } from '../email/email.service';

// ─── Tier → Kategori Kodu Mapping ─────────────────────────────────────────────
// Format: HA-YY-KAT-SIRANO → HA-26-10-001

const TIER_CATEGORY: Record<string, string> = {
  haritailesi_genc:    '12',
  new_graduate_member: '11',
  individual_member:   '10',
  corporate_member:    '15',
};

// Ücretsiz tier'lar — iyzico ödemesi gerekmez
export const FREE_TIERS: MembershipTier[] = ['haritailesi_genc', 'new_graduate_member'];

@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name);

  constructor(
    @InjectDb() private readonly db: Database,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  // ─── Üye Numarası Üretimi (Atomic) ──────────────────────────────────────────

  async generateMemberNumber(tier: MembershipTier): Promise<{
    memberNumber: string;
    year: number;
    category: string;
    seq: number;
  }> {
    const categoryCode = TIER_CATEGORY[tier];
    if (!categoryCode) throw new BadRequestException(`Bu tier için üye numarası üretilemez: ${tier}`);

    const now = new Date();
    const year = now.getFullYear();
    const yy = year % 100; // 2026 → 26

    // Atomic increment — concurrent işlemlere karşı güvenli
    const [result] = await this.db
      .insert(memberNumberSeqs)
      .values({ year: yy, category: categoryCode, lastSeq: 1 })
      .onConflictDoUpdate({
        target: [memberNumberSeqs.year, memberNumberSeqs.category],
        set: { lastSeq: sql`${memberNumberSeqs.lastSeq} + 1` },
      })
      .returning({ lastSeq: memberNumberSeqs.lastSeq });

    const seq = result!.lastSeq;
    const memberNumber = `HA-${String(yy).padStart(2, '0')}-${categoryCode}-${String(seq).padStart(3, '0')}`;

    return { memberNumber, year, category: categoryCode, seq };
  }

  // ─── Abonelik Oluştur ────────────────────────────────────────────────────────

  async createSubscription(dto: {
    userId?: string;
    donationId?: string;
    guestEmail?: string;
    guestFullName?: string;
    tier: MembershipTier;
    startsAt?: Date;
  }) {
    const startsAt = dto.startsAt ?? new Date();
    const expiresAt = new Date(startsAt);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { memberNumber, year, category, seq } = await this.generateMemberNumber(dto.tier);

    const [sub] = await this.db
      .insert(membershipSubscriptions)
      .values({
        userId: dto.userId ?? null,
        donationId: dto.donationId ?? null,
        guestEmail: dto.guestEmail ?? null,
        guestFullName: dto.guestFullName ?? null,
        memberNumber,
        memberNumberYear: year % 100,
        memberNumberCategory: category,
        memberNumberSeq: seq,
        membershipTier: dto.tier,
        startsAt,
        expiresAt,
        status: 'active',
      })
      .returning();

    // users.membership_expires_at denormalize güncelle
    if (dto.userId) {
      await this.db
        .update(users)
        .set({ membershipExpiresAt: expiresAt })
        .where(eq(users.id, dto.userId));
    }

    // Kurumsal üye için şifre henüz belirlenmemişse otomatik davet e-postası gönder
    if (dto.tier === 'corporate_member' && dto.userId) {
      const member = await this.db.query.users.findFirst({
        where: eq(users.id, dto.userId),
        columns: { passwordHash: true },
      });
      if (member?.passwordHash === '!') {
        await this.sendInviteToUser(dto.userId).catch(err =>
          this.logger.error(`Kurumsal davet e-postası gönderilemedi: ${err}`),
        );
      }
    }

    this.logger.log(`Üyelik aboneliği oluşturuldu: ${memberNumber} → ${dto.tier}`);
    return sub!;
  }

  // ─── Aktif Abonelik Sorgula ──────────────────────────────────────────────────

  async getActiveSubscription(userId: string) {
    return this.db.query.membershipSubscriptions.findFirst({
      where: and(
        eq(membershipSubscriptions.userId, userId),
        eq(membershipSubscriptions.status, 'active'),
      ),
      orderBy: (t, { desc }) => [desc(t.expiresAt)],
    });
  }

  async getSubscriptionByMemberNumber(memberNumber: string) {
    return this.db.query.membershipSubscriptions.findFirst({
      where: eq(membershipSubscriptions.memberNumber, memberNumber),
    });
  }

  // ─── Ücret Konfigürasyonu ────────────────────────────────────────────────────

  async getFeeConfig(year: number, tier: MembershipTier) {
    return this.db.query.membershipFeeConfigs.findFirst({
      where: and(
        eq(membershipFeeConfigs.year, year),
        eq(membershipFeeConfigs.tier, tier),
        eq(membershipFeeConfigs.isActive, true),
      ),
    });
  }

  async getCurrentFeeConfigs() {
    const year = new Date().getFullYear();
    return this.db.query.membershipFeeConfigs.findMany({
      where: and(eq(membershipFeeConfigs.year, year), eq(membershipFeeConfigs.isActive, true)),
      orderBy: (t, { asc }) => [asc(t.tier)],
    });
  }

  async upsertFeeConfig(dto: {
    year: number;
    tier: MembershipTier;
    amountKurus: number;
    label: string;
    description?: string;
  }) {
    const [row] = await this.db
      .insert(membershipFeeConfigs)
      .values({
        year: dto.year,
        tier: dto.tier,
        amountKurus: dto.amountKurus,
        label: dto.label,
        description: dto.description ?? null,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [membershipFeeConfigs.year, membershipFeeConfigs.tier],
        set: {
          amountKurus: dto.amountKurus,
          label: dto.label,
          description: dto.description ?? null,
          isActive: true,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row!;
  }

  // ─── Hatırlatma / Sona Erme Kontrolü (Cron tarafından çağrılır) ─────────────

  async getSubscriptionsForReminder(daysLeft: number) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysLeft);
    const dayStart = new Date(targetDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(targetDate); dayEnd.setHours(23, 59, 59, 999);

    const reminderField = daysLeft === 30
      ? membershipSubscriptions.reminder30SentAt
      : daysLeft === 7
        ? membershipSubscriptions.reminder7SentAt
        : membershipSubscriptions.reminder1SentAt;

    return this.db.query.membershipSubscriptions.findMany({
      where: and(
        eq(membershipSubscriptions.status, 'active'),
        sql`${membershipSubscriptions.expiresAt} BETWEEN ${dayStart} AND ${dayEnd}`,
        isNull(reminderField),
      ),
      with: { user: { columns: { id: true, email: true } } },
    });
  }

  async markReminderSent(id: string, daysLeft: number) {
    const field = daysLeft === 30
      ? { reminder30SentAt: new Date() }
      : daysLeft === 7
        ? { reminder7SentAt: new Date() }
        : { reminder1SentAt: new Date() };

    await this.db
      .update(membershipSubscriptions)
      .set({ ...field, updatedAt: new Date() })
      .where(eq(membershipSubscriptions.id, id));
  }

  async expireOverdueSubscriptions() {
    const now = new Date();

    // Süresi dolmuş, henüz bildirim gönderilmemiş abonelikler
    const expired = await this.db.query.membershipSubscriptions.findMany({
      where: and(
        eq(membershipSubscriptions.status, 'active'),
        lte(membershipSubscriptions.expiresAt, now),
        isNull(membershipSubscriptions.expiredNotifiedAt),
      ),
      with: { user: { columns: { id: true, email: true } } },
    });

    for (const sub of expired) {
      await this.db
        .update(membershipSubscriptions)
        .set({ status: 'expired', expiredNotifiedAt: now, updatedAt: now })
        .where(eq(membershipSubscriptions.id, sub.id));

      // Üye tier'ını registered_user'a düşür (3 günlük grace period yok — direkt)
      if (sub.userId) {
        await this.db
          .update(users)
          .set({ membershipTier: 'registered_user', membershipExpiresAt: null, updatedAt: now })
          .where(eq(users.id, sub.userId));
      }
    }

    return expired;
  }

  // ─── Admin: Abonelik Listesi ─────────────────────────────────────────────────

  async listSubscriptions(params: {
    status?: string;
    tier?: string;
    userId?: string;
    limit?: number;
    cursor?: string;
  }) {
    const limit = Math.min(params.limit ?? 30, 500);
    return this.db.query.membershipSubscriptions.findMany({
      where: and(
        params.status ? eq(membershipSubscriptions.status, params.status as 'active' | 'expired' | 'cancelled' | 'pending_payment') : undefined,
        params.userId ? eq(membershipSubscriptions.userId, params.userId) : undefined,
      ),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      limit,
      with: {
        user: {
          columns: { id: true, email: true },
          with: { profile: { columns: { displayName: true, profession: true } } },
        },
      },
    });
  }

  // ─── Kurumsal Temsilci Davet E-postası ──────────────────────────────────────
  // Yeni setup token oluşturur ve account_setup e-postası gönderir.
  // Admin "Davet Gönder / Yeniden Gönder" butonuna bastığında veya
  // corporate_member aboneliği ilk kez oluşturulduğunda otomatik tetiklenir.

  async sendInviteToUser(userId: string): Promise<void> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, email: true },
      with: { profile: { columns: { displayName: true } } },
    });
    if (!user) return;

    const rawToken = randomBytes(40).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 saat

    await this.db.insert(setupTokens).values({ userId, tokenHash, expiresAt });

    const mutfakUrl = this.config.get<string>('MUTFAK_URL', 'http://localhost:3003');
    const setupUrl = `${mutfakUrl}/hesabimi-kur?token=${rawToken}`;
    const displayName = user.profile?.displayName ?? user.email;

    await this.emailService.sendAccountSetup(user.email, displayName, rawToken, setupUrl);
    this.logger.log(`Kurumsal temsilci davet e-postası gönderildi: ${user.email}`);
  }

  async getStats() {
    const [row] = await this.db
      .select({
        total: sql<number>`COUNT(*)`,
        active: sql<number>`COUNT(*) FILTER (WHERE status = 'active')`,
        expiredCount: sql<number>`COUNT(*) FILTER (WHERE status = 'expired')`,
        expiringSoon: sql<number>`COUNT(*) FILTER (WHERE status = 'active' AND expires_at <= NOW() + INTERVAL '30 days')`,
      })
      .from(membershipSubscriptions);

    return {
      total: Number(row?.total ?? 0),
      active: Number(row?.active ?? 0),
      expired: Number(row?.expiredCount ?? 0),
      expiringSoon: Number(row?.expiringSoon ?? 0),
    };
  }
}

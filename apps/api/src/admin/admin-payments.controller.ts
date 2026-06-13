import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermission } from '../rbac/rbac.decorator';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { applications, users, userProfiles } from '@haritailesi/database';
import {
  eq, and, or, sql, count, sum, lte, gte, isNotNull, desc, type SQL,
} from 'drizzle-orm';

type PaymentStatus = NonNullable<typeof applications.$inferSelect['paymentStatus']>;

// ─── Payment List ─────────────────────────────────────────────────────────────

@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(@InjectDb() private readonly db: Database) {}

  @Get()
  @RequirePermission('payment.view')
  async list(
    @Query('status') status?: string,
    @Query('tier') tier?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('overdue') overdue?: string,
    @Query('waived') waived?: string,
    @Query('proofPending') proofPending?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitStr?: string,
  ) {
    const limit = Math.min(limitStr ? parseInt(limitStr, 10) : 30, 100);
    const conditions: SQL[] = [
      isNotNull(applications.paymentStatus),
    ];

    if (status) {
      conditions.push(
        eq(applications.paymentStatus, status as PaymentStatus),
      );
    }

    if (overdue === 'true') {
      conditions.push(
        sql`${applications.paymentDueAt} IS NOT NULL
            AND ${applications.paymentDueAt} <= now()
            AND ${applications.paymentStatus} IN ('pending', 'reminded')`,
      );
    }

    if (waived === 'true') {
      conditions.push(eq(applications.paymentStatus, 'waived'));
    }

    if (proofPending === 'true') {
      conditions.push(eq(applications.paymentStatus, 'waiting_verification'));
    }

    if (from) {
      conditions.push(sql`${applications.createdAt} >= ${new Date(from)}`);
    }

    if (to) {
      conditions.push(sql`${applications.createdAt} <= ${new Date(to)}`);
    }

    if (cursor) {
      conditions.push(
        sql`${applications.createdAt} < (SELECT created_at FROM applications WHERE id = ${cursor})`,
      );
    }

    const rows = await this.db
      .select({
        id: applications.id,
        type: applications.type,
        state: applications.state,
        applicantEmail: applications.applicantEmail,
        applicantUserId: applications.applicantUserId,
        paymentStatus: applications.paymentStatus,
        paymentDueAt: applications.paymentDueAt,
        paymentAmountKurus: applications.paymentAmountKurus,
        paymentDescription: applications.paymentDescription,
        reminderCount: applications.reminderCount,
        lastReminderAt: applications.lastReminderAt,
        createdAt: applications.createdAt,
        // Üye bilgileri
        displayName: userProfiles.displayName,
        membershipTier: users.membershipTier,
      })
      .from(applications)
      .leftJoin(users, eq(users.id, applications.applicantUserId))
      .leftJoin(userProfiles, eq(userProfiles.userId, applications.applicantUserId))
      .where(and(...conditions))
      .orderBy(desc(applications.createdAt))
      .limit(limit + 1);

    // Tier filter — post-query (join üzerinden yapılabilirdi ama OR koşulu karmaşıklaştırır)
    const filtered = tier
      ? rows.filter((r) => r.membershipTier === tier)
      : rows;

    const hasMore = filtered.length > limit;
    const data = filtered.slice(0, limit);

    return {
      data,
      next_cursor: hasMore ? (data[data.length - 1]?.id ?? null) : null,
      has_more: hasMore,
    };
  }

  // ─── Payment Summary (Dashboard Kartları) ─────────────────────────────────────

  @Get('summary')
  @RequirePermission('payment.view')
  async getSummary() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      pendingCount,
      overdueCount,
      remindedCount,
      waitingVerificationCount,
      verifiedThisMonth,
      failedCount,
      waivedCount,
      totalVerifiedAmount,
      expiredCount,
      remindersSentThisMonth,
    ] = await Promise.all([
      // Ödeme bekleniyor (pending, reminded)
      this.db
        .select({ count: count() })
        .from(applications)
        .where(
          or(
            eq(applications.paymentStatus, 'pending'),
            eq(applications.paymentStatus, 'reminded'),
          ),
        ),

      // Süresi geçmiş (paymentDueAt < now AND pending/reminded)
      this.db
        .select({ count: count() })
        .from(applications)
        .where(
          and(
            isNotNull(applications.paymentDueAt),
            lte(applications.paymentDueAt, sql`now()`),
            or(
              eq(applications.paymentStatus, 'pending'),
              eq(applications.paymentStatus, 'reminded'),
            ),
          ),
        ),

      // En az bir hatırlatma gönderilmiş
      this.db
        .select({ count: count() })
        .from(applications)
        .where(eq(applications.paymentStatus, 'reminded')),

      // Dekont yüklendi, doğrulama bekleniyor
      this.db
        .select({ count: count() })
        .from(applications)
        .where(eq(applications.paymentStatus, 'waiting_verification')),

      // Bu ay doğrulanan ödemeler
      this.db
        .select({ count: count() })
        .from(applications)
        .where(
          and(
            eq(applications.paymentStatus, 'verified'),
            gte(applications.updatedAt, startOfMonth),
          ),
        ),

      // Başarısız ödemeler
      this.db
        .select({ count: count() })
        .from(applications)
        .where(eq(applications.paymentStatus, 'failed')),

      // Muaf tutulan ödemeler
      this.db
        .select({ count: count() })
        .from(applications)
        .where(eq(applications.paymentStatus, 'waived')),

      // Doğrulanmış ödemelerin toplam tutarı
      this.db
        .select({ total: sum(applications.paymentAmountKurus) })
        .from(applications)
        .where(eq(applications.paymentStatus, 'verified')),

      // Süresi dolmuş (paymentStatus = 'expired')
      this.db
        .select({ count: count() })
        .from(applications)
        .where(eq(applications.paymentStatus, 'expired')),

      // Bu ay gönderilen hatırlatma sayısı
      this.db
        .select({ count: count() })
        .from(applications)
        .where(
          and(
            isNotNull(applications.lastReminderAt),
            gte(applications.lastReminderAt, startOfMonth),
          ),
        ),
    ]);

    return {
      pendingPayments:         Number(pendingCount[0]?.count ?? 0),
      overduePayments:         Number(overdueCount[0]?.count ?? 0),
      remindedPayments:        Number(remindedCount[0]?.count ?? 0),
      waitingVerification:     Number(waitingVerificationCount[0]?.count ?? 0),
      verifiedThisMonth:       Number(verifiedThisMonth[0]?.count ?? 0),
      failedPayments:          Number(failedCount[0]?.count ?? 0),
      waivedPayments:          Number(waivedCount[0]?.count ?? 0),
      expiredPayments:         Number(expiredCount[0]?.count ?? 0),
      totalVerifiedAmountKurus: Number(totalVerifiedAmount[0]?.total ?? 0),
      remindersSentThisMonth:  Number(remindersSentThisMonth[0]?.count ?? 0),
    };
  }
}

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { eq, desc, sql, and, inArray } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import {
  applications,
  applicationStateLogs,
  users,
  userProfiles,
  donations,
} from '@haritailesi/database';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { AuthService } from '../auth/auth.service';
import { getTransition } from './state-machine';
import {
  APPLICATION_STATE_CHANGED,
  ApplicationStateChangedEvent,
  DomainEvent,
} from './events/application.events';
import type { DomainEventPayload } from './events/application.events';
import { domainEmit } from './events/domain-events';
import type { CreateApplicationDto, TransitionStateDto } from './dto/create-application.dto';
import type { RequestUser } from '../auth/auth.types';
import type { MembershipTier } from '@haritailesi/types';
import { can } from '../rbac/permissions';

const STATE_TR: Record<string, string> = {
  submitted: 'Yeni Başvuru', under_review: 'Ön İnceleme',
  interview_needed: 'Görüşme', interview_scheduled: 'Görüşme Planlandı',
  interview_completed: 'Görüşme Tamamlandı', shortlisted: 'Ön Eleme',
  approved: 'Kabul', rejected: 'Reddedildi',
  waiting_payment: 'Ödeme Bekleniyor', waiting_verification: 'Ödeme Doğrulanıyor',
  active: 'Aktif', passive: 'Pasif',
  waitlisted: 'Yedek Liste', accepted: 'Kabul Edildi',
  active_program_member: 'Program Üyesi', program_completed: 'Program Tamamlandı',
  waiting_student_verification: 'Öğrenci Belgesi Bekleniyor',
};

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @InjectDb() private readonly db: Database,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
    private readonly authService: AuthService,
  ) {}

  // ─── Public: Submit Application ─────────────────────────────────────────────

  async submit(dto: CreateApplicationDto): Promise<{ id: string; state: string }> {
    const normalizedEmail = dto.applicantEmail.toLowerCase();

    // Aynı e-posta ile aktif/bekleyen başvuru var mı?
    const existing = await this.db
      .select({ id: applications.id, state: applications.state })
      .from(applications)
      .where(
        and(
          eq(applications.applicantEmail, normalizedEmail),
          inArray(applications.state, ['submitted', 'under_review', 'approved', 'awaiting_payment']),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new BadRequestException(
        'Bu e-posta adresiyle zaten aktif bir başvurunuz bulunmaktadır.',
      );
    }

    // Onaylı/aktif üye mi?
    const existingUser = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      throw new BadRequestException(
        'Bu e-posta adresi zaten bir üye hesabına kayıtlıdır.',
      );
    }

    const displayName = this.extractDisplayName(dto.formData);

    // Atomic: başvuru + ilk state log aynı transaction'da
    const app = await this.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(applications)
        .values({
          type: dto.type,
          applicantEmail: dto.applicantEmail.toLowerCase(),
          state: 'submitted',
          formData: dto.formData,
        })
        .returning({ id: applications.id, state: applications.state });

      if (!inserted) throw new Error('Application creation failed');

      await tx.insert(applicationStateLogs).values({
        applicationId: inserted.id,
        fromState: null,
        toState: 'submitted',
        reason: 'İlk başvuru',
      });

      return inserted;
    });

    // Side effects after commit
    await this.emailService.sendApplicationSubmitted(dto.applicantEmail, displayName);

    const DAY = 24 * 60 * 60 * 1000;
    await this.emailService.sendProvisionaryFollowup(dto.applicantEmail, displayName, 2, 2 * DAY);
    await this.emailService.sendProvisionaryFollowup(dto.applicantEmail, displayName, 5, 5 * DAY);
    await this.emailService.sendProvisionaryFollowup(dto.applicantEmail, displayName, 10, 10 * DAY);

    await this.auditService.log({
      action: 'application.submitted',
      entityType: 'application',
      entityId: app.id,
      afterState: { type: dto.type, email: dto.applicantEmail, state: 'submitted' },
    });

    return app;
  }

  // ─── Public: Get Own Application Status ─────────────────────────────────────

  async getStatusByEmail(email: string) {
    return this.db.query.applications.findMany({
      where: eq(applications.applicantEmail, email.toLowerCase()),
      columns: {
        id: true,
        type: true,
        state: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [desc(applications.createdAt)],
    });
  }

  // ─── Admin: Transition State ─────────────────────────────────────────────────

  async transitionState(
    id: string,
    dto: TransitionStateDto,
    actor: RequestUser,
  ): Promise<typeof applications.$inferSelect> {
    const app = await this.db.query.applications.findFirst({
      where: eq(applications.id, id),
    });

    if (!app) throw new NotFoundException('Başvuru bulunamadı.');

    const transition = getTransition(app.type, app.state, dto.toState);

    if (!transition) {
      throw new BadRequestException(
        `${STATE_TR[app.state] ?? app.state} → ${STATE_TR[dto.toState] ?? dto.toState} geçişi bu başvuru tipi için geçerli değil.`,
      );
    }

    if (!can(actor, transition.requiredPermission)) {
      throw new ForbiddenException('Bu state geçişi için yetkiniz yok.');
    }

    // Guard rail kontrolleri (DB read-only, transaction öncesi)
    await this.checkPrerequisites(transition.prerequisites ?? [], app, dto);

    const displayName = this.extractDisplayName(app.formData as Record<string, unknown>);

    // ─── ATOMIC: Tüm DB yazmaları tek transaction'da ──────────────────────────
    const { updated, newUserId, donationRefCode } = await this.db.transaction(async (tx) => {
      // 1. Application state + payment status güncelle
      const paymentDueAt =
        dto.toState === 'waiting_payment'
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 gün
          : undefined;

      // payment lifecycle state machine
      const paymentStatus: typeof applications.$inferInsert['paymentStatus'] | undefined =
        dto.toState === 'waiting_payment'        ? 'pending'
        : dto.toState === 'waiting_verification' ? 'waiting_verification'
        : dto.toState === 'active'               ? 'verified'
        : undefined;

      const [updated] = await tx
        .update(applications)
        .set({
          state: dto.toState,
          updatedAt: new Date(),
          ...(paymentDueAt !== undefined ? { paymentDueAt } : {}),
          ...(paymentStatus !== undefined ? { paymentStatus } : {}),
          ...(dto.toState === 'waiting_verification' && dto.paymentAmountKurus
            ? { paymentAmountKurus: dto.paymentAmountKurus }
            : {}),
          ...(dto.toState === 'waiting_verification' && dto.paymentDescription
            ? { paymentDescription: dto.paymentDescription }
            : {}),
        })
        .where(eq(applications.id, id))
        .returning();

      if (!updated) throw new Error('Update failed');

      // 2. State log
      await tx.insert(applicationStateLogs).values({
        applicationId: id,
        fromState: app.state,
        toState: dto.toState,
        triggeredBy: actor.id,
        reason: dto.reason ?? null,
        metadata: dto.metadata ?? null,
      });

      // 3. Bağış kaydı — waiting_payment → waiting_verification
      let donationRefCode: string | null = null;
      if (dto.toState === 'waiting_verification' && app.state === 'waiting_payment') {
        const amountKurus = dto.paymentAmountKurus ?? 0;
        if (amountKurus > 0) {
          donationRefCode = `MBR-${id.slice(0, 8).toUpperCase()}-${Date.now()}`;
          await tx.insert(donations).values({
            userId: app.applicantUserId ?? undefined,
            applicationId: id,
            email: app.applicantEmail,
            fullName: displayName,
            amount: amountKurus,
            currency: 'TRY',
            type: 'one_time',
            method: 'bank_transfer',
            status: 'completed',
            paymentAccount: 'vakif',
            donationCategory: 'bireysel',
            referenceCode: donationRefCode,
            notes:
              dto.paymentDescription ??
              `Üyelik ödemesi — başvuru #${id.slice(0, 8)}`,
            completedAt: new Date(),
          });
        }
      }

      // 4. Kullanıcı hesabı oluştur — active geçişinde
      let newUserId: string | null = null;
      const activatableTypes = ['individual', 'corporate', 'haritailesi_genc'];
      if (dto.toState === 'active' && activatableTypes.includes(app.type)) {
        const [existing] = await tx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, app.applicantEmail.toLowerCase()))
          .limit(1);

        if (existing) {
          newUserId = existing.id;
          this.logger.warn(
            `account_setup_existing_user email=${app.applicantEmail} userId=${newUserId} app=${id}`,
          );
        } else {
          const membershipTier = this.resolveMembershipTier(
            app.type,
            app.formData as Record<string, unknown>,
          );
          const [newUser] = await tx
            .insert(users)
            .values({
              email: app.applicantEmail.toLowerCase(),
              passwordHash: '!',
              membershipTier,
              status: 'pending',
            })
            .returning({ id: users.id });

          if (!newUser) throw new Error('User creation failed');
          newUserId = newUser.id;

          await tx
            .insert(userProfiles)
            .values({ userId: newUserId, displayName });
        }

        // Başvuruyu kullanıcıya bağla
        await tx
          .update(applications)
          .set({ applicantUserId: newUserId })
          .where(eq(applications.id, id));

        // Admin notlarını profile aktar
        if (app.adminNotes) {
          await tx
            .update(userProfiles)
            .set({ internalNotes: app.adminNotes })
            .where(eq(userProfiles.userId, newUserId));
        }
      }

      return { updated, newUserId, donationRefCode };
    });

    // ─── SIDE EFFECTS: transaction commit sonrası domain event emit ───────────
    if (donationRefCode) {
      this.logger.log(
        `donation_created refCode=${donationRefCode} app=${id} amount=${dto.paymentAmountKurus}`,
      );
    }

    const notifyUserId = app.applicantUserId ?? newUserId;

    const fd = (app.formData ?? {}) as Record<string, unknown>;
    const applicantPhone = app.type === 'corporate'
      ? (fd['temsilciTelefon'] as string | undefined) ?? null
      : (fd['telefon'] as string | undefined) ?? null;

    this.eventEmitter.emit(
      APPLICATION_STATE_CHANGED,
      new ApplicationStateChangedEvent(
        id,
        app.applicantEmail,
        app.applicantUserId,
        app.state,
        dto.toState,
        displayName,
        app.type,
        transition,
        notifyUserId,
        newUserId,
        actor,
        dto.paymentAmountKurus,
        applicantPhone,
      ),
    );

    return updated;
  }

  // ─── Admin: Update Notes ─────────────────────────────────────────────────────

  async updateNotes(
    id: string,
    adminNotes: string,
    actor: RequestUser,
  ): Promise<{ syncedToProfile: boolean }> {
    const app = await this.db.query.applications.findFirst({
      where: eq(applications.id, id),
      columns: { id: true, applicantUserId: true },
    });

    if (!app) throw new NotFoundException('Başvuru bulunamadı.');

    let syncedToProfile = false;

    await this.db.transaction(async (tx) => {
      await tx
        .update(applications)
        .set({ adminNotes, updatedAt: new Date() })
        .where(eq(applications.id, id));

      if (app.applicantUserId) {
        await tx
          .update(userProfiles)
          .set({ internalNotes: adminNotes, updatedAt: new Date() })
          .where(eq(userProfiles.userId, app.applicantUserId));
        syncedToProfile = true;
      }
    });

    await this.auditService.log({
      actor,
      action: 'application.notes_updated',
      entityType: 'application',
      entityId: id,
      afterState: { syncedToProfile },
    });

    return { syncedToProfile };
  }

  // ─── Admin: Resend Account Setup Email ──────────────────────────────────────

  async resendAccountSetup(id: string): Promise<void> {
    const app = await this.db.query.applications.findFirst({
      where: eq(applications.id, id),
    });
    if (!app) throw new NotFoundException('Başvuru bulunamadı.');
    if (app.state !== 'active') {
      throw new BadRequestException(
        'Hesap kurulum e-postası yalnızca aktif başvurular için gönderilebilir.',
      );
    }

    const [existing] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, app.applicantEmail.toLowerCase()))
      .limit(1);

    if (!existing) {
      throw new BadRequestException(
        'Bu başvuruya ait kullanıcı hesabı bulunamadı. Önce başvuruyu aktif yapın.',
      );
    }

    const displayName = this.extractDisplayName(app.formData as Record<string, unknown>);
    const setupToken = await this.authService.createSetupToken(existing.id);
    const webUrl = process.env['MUTFAK_URL'] ?? process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://mutfak.haritailesi.org';
    const setupUrl = `${webUrl}/sifre-belirle?token=${setupToken}`;
    await this.emailService.sendAccountSetup(app.applicantEmail, displayName, setupToken, setupUrl);
    this.logger.log(
      `account_setup_resent userId=${existing.id} email=${app.applicantEmail} app=${id}`,
    );
  }

  // ─── Admin: Resend Payment Reminder ─────────────────────────────────────────

  private static readonly REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 saat

  async resendPaymentReminder(id: string): Promise<void> {
    const app = await this.db.query.applications.findFirst({
      where: eq(applications.id, id),
    });
    if (!app) throw new NotFoundException('Başvuru bulunamadı.');
    if (app.state !== 'waiting_payment' && app.state !== 'approved') {
      throw new BadRequestException(
        'Ödeme hatırlatması yalnızca approved veya waiting_payment durumundaki başvurular için gönderilebilir.',
      );
    }

    // Cooldown: son hatırlatmadan bu yana 24 saat geçmemiş
    if (app.lastReminderAt) {
      const elapsed = Date.now() - app.lastReminderAt.getTime();
      if (elapsed < ApplicationsService.REMINDER_COOLDOWN_MS) {
        const waitMins = Math.ceil((ApplicationsService.REMINDER_COOLDOWN_MS - elapsed) / 60_000);
        throw new BadRequestException(
          `Son hatırlatmadan bu yana ${waitMins} dakika daha beklemelisiniz.`,
        );
      }
    }

    const displayName = this.extractDisplayName(app.formData as Record<string, unknown>);
    await this.emailService.send(app.applicantEmail, 'payment_reminder', { displayName, applicationType: app.type, applicationId: app.id });

    // Sayaç ve zaman güncelle
    await this.db
      .update(applications)
      .set({
        reminderCount: (app.reminderCount ?? 0) + 1,
        lastReminderAt: new Date(),
        paymentStatus: app.paymentStatus === 'pending' ? 'reminded' : app.paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, id));

    await this.db.insert(applicationStateLogs).values({
      applicationId: id,
      fromState: app.state,
      toState: app.state,
      reason: `Ödeme hatırlatması gönderildi (${(app.reminderCount ?? 0) + 1}. kez)`,
    });

    this.logger.log(`payment_reminder_resent email=${app.applicantEmail} app=${id} count=${(app.reminderCount ?? 0) + 1}`);
  }

  // ─── Admin: Ödeme Son Tarih Uzatma ──────────────────────────────────────────

  async extendPaymentDueDate(
    id: string,
    extraDays: number,
    actor: RequestUser,
  ): Promise<typeof applications.$inferSelect> {
    const app = await this.db.query.applications.findFirst({
      where: eq(applications.id, id),
    });
    if (!app) throw new NotFoundException('Başvuru bulunamadı.');
    if (app.state !== 'waiting_payment' && app.state !== 'approved') {
      throw new BadRequestException(
        'Son tarih uzatma yalnızca approved veya waiting_payment durumundaki başvurulara uygulanabilir.',
      );
    }

    const base = app.paymentDueAt ?? new Date();
    const newDueAt = new Date(base.getTime() + extraDays * 24 * 60 * 60 * 1000);

    const [updated] = await this.db
      .update(applications)
      .set({ paymentDueAt: newDueAt, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();

    if (!updated) throw new Error('Update failed');

    await this.db.insert(applicationStateLogs).values({
      applicationId: id,
      fromState: app.state,
      toState: app.state,
      triggeredBy: actor.id,
      reason: `Ödeme son tarihi ${extraDays} gün uzatıldı → ${newDueAt.toISOString()}`,
    });

    await this.auditService.log({
      actor,
      action: 'application.payment_due_extended',
      entityType: 'application',
      entityId: id,
      afterState: { extraDays, newDueAt },
    });

    this.logger.log(`payment_due_extended app=${id} extraDays=${extraDays} newDue=${newDueAt.toISOString()} by=${actor.id}`);
    return updated;
  }

  // ─── Admin: Ödemeyi Başarısız İşaretle ──────────────────────────────────────

  async markPaymentFailed(
    id: string,
    reason: string,
    actor: RequestUser,
  ): Promise<typeof applications.$inferSelect> {
    const app = await this.db.query.applications.findFirst({
      where: eq(applications.id, id),
    });
    if (!app) throw new NotFoundException('Başvuru bulunamadı.');
    if (app.state !== 'waiting_payment' && app.state !== 'waiting_verification') {
      throw new BadRequestException(
        'Ödeme başarısız işaretleme yalnızca waiting_payment veya waiting_verification durumundaki başvurulara uygulanabilir.',
      );
    }

    const [updated] = await this.db
      .update(applications)
      .set({ paymentStatus: 'failed', updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();

    if (!updated) throw new Error('Update failed');

    await this.db.insert(applicationStateLogs).values({
      applicationId: id,
      fromState: app.state,
      toState: app.state,
      triggeredBy: actor.id,
      reason: `Ödeme başarısız işaretlendi: ${reason}`,
    });

    const displayName = this.extractDisplayName(app.formData as Record<string, unknown>);
    domainEmit(this.eventEmitter, DomainEvent.PAYMENT_FAILED, {
      applicationId: id,
      applicantEmail: app.applicantEmail,
      applicantUserId: app.applicantUserId ?? null,
      displayName,
      actorId: actor.id,
      actorEmail: actor.email,
      timestamp: new Date(),
      metadata: { reason },
    });

    await this.auditService.log({
      actor,
      action: 'application.payment_failed',
      entityType: 'application',
      entityId: id,
      afterState: { reason },
    });

    this.logger.log(`payment_failed app=${id} by=${actor.id} reason=${reason}`);
    return updated;
  }

  // ─── Admin: Ödeme Muafiyetini İptal Et ──────────────────────────────────────

  async revokeWaiver(
    id: string,
    actor: RequestUser,
  ): Promise<typeof applications.$inferSelect> {
    const app = await this.db.query.applications.findFirst({
      where: eq(applications.id, id),
    });
    if (!app) throw new NotFoundException('Başvuru bulunamadı.');
    if (app.paymentStatus !== 'waived') {
      throw new BadRequestException(
        'Muafiyet iptali yalnızca waived durumundaki başvurulara uygulanabilir.',
      );
    }

    const [updated] = await this.db
      .update(applications)
      .set({
        state: 'waiting_payment',
        paymentStatus: 'pending',
        paymentDueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })
      .where(eq(applications.id, id))
      .returning();

    if (!updated) throw new Error('Update failed');

    await this.db.insert(applicationStateLogs).values({
      applicationId: id,
      fromState: app.state,
      toState: 'waiting_payment',
      triggeredBy: actor.id,
      reason: 'Ödeme muafiyeti iptal edildi — ödeme bekleniyor',
    });

    const displayName = this.extractDisplayName(app.formData as Record<string, unknown>);
    domainEmit(this.eventEmitter, DomainEvent.PAYMENT_WAIVER_REVOKED, {
      applicationId: id,
      applicantEmail: app.applicantEmail,
      applicantUserId: app.applicantUserId ?? null,
      displayName,
      actorId: actor.id,
      actorEmail: actor.email,
      timestamp: new Date(),
    });

    await this.auditService.log({
      actor,
      action: 'application.waiver_revoked',
      entityType: 'application',
      entityId: id,
      afterState: { previousState: app.state },
    });

    this.logger.log(`waiver_revoked app=${id} by=${actor.id}`);
    return updated;
  }

  // ─── Admin: Ödeme Muafiyeti ──────────────────────────────────────────────────
  // Burs/özel durumlarda ödeme adımı atlanır — paymentStatus = 'waived'

  async waivePayment(
    id: string,
    reason: string,
    actor: RequestUser,
  ): Promise<typeof applications.$inferSelect> {
    const app = await this.db.query.applications.findFirst({
      where: eq(applications.id, id),
    });
    if (!app) throw new NotFoundException('Başvuru bulunamadı.');
    if (app.state !== 'waiting_payment') {
      throw new BadRequestException(
        'Ödeme muafiyeti yalnızca waiting_payment durumundaki başvurulara uygulanabilir.',
      );
    }

    const [updated] = await this.db
      .update(applications)
      .set({
        state: 'waiting_verification',
        paymentStatus: 'waived',
        updatedAt: new Date(),
      })
      .where(eq(applications.id, id))
      .returning();

    if (!updated) throw new Error('Update failed');

    await this.db.insert(applicationStateLogs).values({
      applicationId: id,
      fromState: 'waiting_payment',
      toState: 'waiting_verification',
      triggeredBy: actor.id,
      reason,
    });

    const displayName = this.extractDisplayName(app.formData as Record<string, unknown>);

    domainEmit(this.eventEmitter, DomainEvent.PAYMENT_WAIVED, {
      applicationId: id,
      applicantEmail: app.applicantEmail,
      applicantUserId: app.applicantUserId ?? null,
      displayName,
      actorId: actor.id,
      actorEmail: actor.email,
      timestamp: new Date(),
      metadata: { reason },
    });

    this.logger.log(`payment_waived app=${id} by=${actor.id} reason=${reason}`);
    return updated;
  }

  // ─── Guard Rail Kontrolleri ──────────────────────────────────────────────────

  private async checkPrerequisites(
    prerequisites: NonNullable<
      import('./state-machine').StateTransition['prerequisites']
    >,
    app: typeof applications.$inferSelect,
    dto: TransitionStateDto,
  ): Promise<void> {
    for (const prereq of prerequisites) {
      switch (prereq.type) {
        case 'requires_admin_notes': {
          if (!app.adminNotes?.trim()) {
            throw new BadRequestException(prereq.errorMessage);
          }
          break;
        }
        case 'requires_payment_amount': {
          if (!dto.paymentAmountKurus || dto.paymentAmountKurus < 1) {
            throw new BadRequestException(prereq.errorMessage);
          }
          break;
        }
        case 'requires_donation_record': {
          // Ödeme muaf tutulmuşsa kontrol atlanır
          if (app.paymentStatus === 'waived') break;
          // Reference code pattern: MBR-{8-char-id-prefix}-{timestamp}
          const refPrefix = `MBR-${app.id.slice(0, 8).toUpperCase()}`;
          const [donation] = await this.db
            .select({ id: donations.id })
            .from(donations)
            .where(sql`${donations.referenceCode} LIKE ${refPrefix + '%'}`)
            .limit(1);
          if (!donation) {
            throw new BadRequestException(prereq.errorMessage);
          }
          break;
        }
      }
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private extractDisplayName(formData: Record<string, unknown>): string {
    const name =
      formData['adSoyad'] ?? formData['ad_soyad'] ?? formData['displayName'];
    return typeof name === 'string' ? name : 'Başvuran';
  }

  private resolveMembershipTier(
    appType: string,
    formData: Record<string, unknown>,
  ): MembershipTier {
    if (appType === 'corporate') return 'corporate_member';
    const membershipType = formData['membershipType'];
    if (membershipType === 'ogrenci') return 'haritailesi_genc';
    if (membershipType === 'yeni_mezun') return 'new_graduate_member';
    return 'individual_member';
  }

  // ─── Mevcut Durum Mailini Tekrar Gönder ──────────────────────────────────────

  async resendStateEmail(id: string): Promise<void> {
    const [app] = await this.db
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .limit(1);
    if (!app) throw new NotFoundException('Başvuru bulunamadı');

    const displayName = this.extractDisplayName(app.formData as Record<string, unknown>);
    const STATE_EMAIL_MAP: Record<string, () => Promise<void>> = {
      under_review:     () => this.emailService.sendApplicationUnderReview(app.applicantEmail, displayName),
      approved:         () => this.emailService.sendApplicationApproved(app.applicantEmail, displayName, app.type, app.id),
      rejected:         () => this.emailService.send(app.applicantEmail, 'application_rejected', { displayName }),
      waiting_payment:  () => this.emailService.send(app.applicantEmail, 'payment_reminder', { displayName, applicationType: app.type, applicationId: app.id }),
    };

    const sender = STATE_EMAIL_MAP[app.state];
    if (!sender) throw new BadRequestException(`${app.state} durumu için tekrar gönderilecek mail yok.`);
    await sender();
    this.logger.log(`state_email_resent state=${app.state} email=${app.applicantEmail} app=${id}`);
  }

  // ─── Görüşme Daveti (slot gerektirmez) ───────────────────────────────────────

  async sendInterviewInviteDirect(id: string, meetUrl: string | undefined, actor: RequestUser): Promise<void> {
    const [app] = await this.db
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .limit(1);
    if (!app) throw new NotFoundException('Başvuru bulunamadı');

    const displayName = this.extractDisplayName(app.formData as Record<string, unknown>);
    await this.emailService.send(app.applicantEmail, 'application_interview_scheduled', {
      displayName,
      applicantName: displayName,
      meetUrl: meetUrl ?? '',
      scheduledAt: '',
    });
    this.logger.log(`interview_invite_direct_sent app=${id} email=${app.applicantEmail}`);
  }

  // ─── Silme ───────────────────────────────────────────────────────────────────

  async deleteApplication(id: string, actor: RequestUser): Promise<{ id: string; deleted: boolean }> {
    const [app] = await this.db
      .select({ id: applications.id, state: applications.state })
      .from(applications)
      .where(eq(applications.id, id))
      .limit(1);

    if (!app) throw new NotFoundException('Başvuru bulunamadı');

    await this.db.delete(applicationStateLogs).where(eq(applicationStateLogs.applicationId, id));
    await this.db.delete(applications).where(eq(applications.id, id));

    await this.auditService.log({
      actor,
      action: 'application.deleted',
      entityType: 'application',
      entityId: id,
      beforeState: { state: app.state },
    });

    return { id, deleted: true };
  }
}

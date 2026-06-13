import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, eq, gte, lte, lt, isNotNull, inArray } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { applications } from '@haritailesi/database';
import { ApplicationQueryService } from './application-query.service';
import { EmailService } from '../email/email.service';
import { DomainEvent, domainEmit } from './events/domain-events';
import type { DomainEventPayload } from './events/domain-events';

const STATE_LABEL: Record<string, string> = {
  submitted:        'Yeni Başvuru',
  under_review:     'Ön İnceleme',
  interview_needed: 'Görüşme Bekliyor',
  waiting_payment:  'Ödeme Bekliyor',
  approved:         'Onaylandı',
};

const TYPE_LABEL: Record<string, string> = {
  individual:            'Bireysel',
  corporate:             'Kurumsal',
  meslegin_gelecekleri:  'Mesleğin Geleceği',
  haritailesi_genc:      'Haritailesi Genç',
};

@Injectable()
export class ApplicationSlaCron {
  private readonly logger = new Logger(ApplicationSlaCron.name);

  constructor(
    @InjectDb() private readonly db: Database,
    private readonly queryService: ApplicationQueryService,
    private readonly emailService: EmailService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Her gün 09:15 İstanbul saatiyle çalışır
  @Cron('15 9 * * *', { timeZone: 'Europe/Istanbul' })
  async checkSla() {
    this.logger.log('Başvuru SLA kontrolü başlatıldı…');

    const stuck = await this.queryService.getStuckApplications();
    if (!stuck.length) {
      this.logger.log('SLA ihlali yok.');
      return;
    }

    this.logger.warn(`${stuck.length} başvuru SLA süresi aşıldı.`);

    const adminEmail = process.env['ADMIN_ALERT_EMAIL'] ?? 'admin@haritailesi.org';
    const adminUrl   = `${process.env['ADMIN_URL'] ?? 'https://admin.haritailesi.org'}/basvurular`;

    const rows = stuck.map((a) => {
      const name = String(a.formData['adSoyad'] ?? a.applicantEmail);
      const stateLabel = STATE_LABEL[a.state] ?? a.state;
      const typeLabel  = TYPE_LABEL[a.type]  ?? a.type;
      const color = a.daysStuck >= 7 ? '#dc2626' : '#d97706';
      return `<tr><td style="padding:7px 12px;border:1px solid #e5e7eb">${name}</td><td style="padding:7px 12px;border:1px solid #e5e7eb">${typeLabel}</td><td style="padding:7px 12px;border:1px solid #e5e7eb">${stateLabel}</td><td style="padding:7px 12px;border:1px solid #e5e7eb;text-align:right;color:${color};font-weight:600">${a.daysStuck} gün</td></tr>`;
    }).join('');

    try {
      await this.emailService.send(
        adminEmail,
        'application_sla_alert',
        { rows, adminUrl },
        { jobId: `sla_alert:${new Date().toISOString().slice(0, 10)}` },
      );
      this.logger.log(`SLA uyarı e-postası gönderildi → ${adminEmail}`);
    } catch (err) {
      this.logger.error('SLA e-posta gönderilemedi', err);
    }
  }

  // Her gün 10:00 — son 48 saatte vadesi dolan başvurulara hatırlatma, geçmişleri expired yap
  @Cron('0 10 * * *', { timeZone: 'Europe/Istanbul' })
  async checkPaymentDeadlines() {
    this.logger.log('Ödeme son tarih kontrolü başlatıldı…');

    const now   = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // 1. Süresi dolmuş, hâlâ waiting_payment olanları expired'a çek
    const expired = await this.db
      .update(applications)
      .set({ paymentStatus: 'expired', updatedAt: now })
      .where(
        and(
          eq(applications.state, 'waiting_payment'),
          isNotNull(applications.paymentDueAt),
          lt(applications.paymentDueAt, now),
          inArray(applications.paymentStatus, ['pending', 'reminded']),
        ),
      )
      .returning({ id: applications.id });

    if (expired.length) {
      this.logger.warn(`${expired.length} başvurunun ödeme süresi doldu → expired işaretlendi.`);
    }

    // 2. Son 48 saatte vadesi dolacak, hâlâ pending olanları reminded yap + mail gönder
    const upcoming = await this.db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.state, 'waiting_payment'),
          isNotNull(applications.paymentDueAt),
          gte(applications.paymentDueAt, now),
          lte(applications.paymentDueAt, in48h),
          eq(applications.paymentStatus, 'pending'),
        ),
      );

    if (!upcoming.length) {
      this.logger.log('Yaklaşan ödeme son tarihi yok.');
      return;
    }

    this.logger.log(`${upcoming.length} başvuruya son tarih hatırlatması gönderilecek.`);

    for (const app of upcoming) {
      const formData = app.formData as Record<string, unknown>;
      const name   = String(formData['adSoyad'] ?? formData['ad_soyad'] ?? app.applicantEmail);
      const dueStr = app.paymentDueAt
        ? app.paymentDueAt.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
        : '';

      try {
        // Email is sent directly here (not via orchestrator) to keep the
        // "only mark reminded if delivery succeeded" guarantee intact.
        await this.emailService.send(
          app.applicantEmail,
          'payment_reminder',
          { displayName: name, paymentDueAt: dueStr, applicationType: app.type, applicationId: app.id },
          { jobId: `payment_due_reminder:${app.id}:${now.toISOString().slice(0, 10)}` },
        );

        await this.db
          .update(applications)
          .set({
            paymentStatus: 'reminded',
            reminderCount: (app.reminderCount ?? 0) + 1,
            lastReminderAt: now,
            updatedAt: now,
          })
          .where(eq(applications.id, app.id));

        // Emit domain event for push notification routing via orchestrator
        domainEmit(this.eventEmitter, DomainEvent.PAYMENT_REMINDED, {
          applicationId: app.id,
          applicantEmail: app.applicantEmail,
          applicantUserId: app.applicantUserId ?? null,
          displayName: name,
          actorId: null,
          actorEmail: null,
          timestamp: now,
          metadata: { paymentDueAt: dueStr },
        });

        this.logger.log(`Ödeme hatırlatması → ${app.applicantEmail} (son: ${dueStr})`);
      } catch (err) {
        this.logger.error(`Ödeme hatırlatması gönderilemedi app=${app.id}`, err);
      }
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { SmsService } from '../sms/sms.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { NewsletterAutomationService } from '../admin/newsletter-automation.service';
import {
  APPLICATION_STATE_CHANGED,
  ApplicationStateChangedEvent,
  DomainEvent,
} from './events/application.events';
import type { DomainEventPayload } from './events/application.events';
import type { RequestUser } from '../auth/auth.types';

@Injectable()
export class ApplicationEventsListener {
  private readonly logger = new Logger(ApplicationEventsListener.name);

  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
    private readonly smsService: SmsService,
    private readonly whatsappService: WhatsappService,
    private readonly automationService: NewsletterAutomationService,
  ) {}

  // ─── State Değişimi: Audit ────────────────────────────────────────────────────

  @OnEvent(APPLICATION_STATE_CHANGED, { async: true })
  async handleAudit(event: ApplicationStateChangedEvent): Promise<void> {
    try {
      await this.auditService.log({
        actor: event.actor,
        action: 'application.state_transition',
        entityType: 'application',
        entityId: event.applicationId,
        beforeState: { state: event.fromState },
        afterState: { state: event.toState, paymentAmountKurus: event.paymentAmountKurus },
      });
    } catch (err) {
      this.logger.error(
        `audit_failed app=${event.applicationId} err=${(err as Error).message}`,
      );
    }
  }

  // ─── State Değişimi: emailTrigger'a göre mail gönder ─────────────────────────

  @OnEvent(APPLICATION_STATE_CHANGED, { async: true })
  async handleEmailTrigger(event: ApplicationStateChangedEvent): Promise<void> {
    const trigger = event.transition.emailTrigger;
    if (!trigger || trigger === 'account_setup') return; // account_setup ayrı handler'da
    try {
      switch (trigger) {
        case 'application_under_review':
          await this.emailService.sendApplicationUnderReview(event.applicantEmail, event.displayName, event.applicationId);
          break;
        case 'application_approved':
          await this.emailService.sendApplicationApproved(event.applicantEmail, event.displayName, event.applicationType, event.applicationId);
          break;
        case 'application_rejected':
          await this.emailService.send(event.applicantEmail, 'application_rejected', { displayName: event.displayName }, { jobId: `application_rejected:${event.applicationId}` });
          break;
        default:
          this.logger.warn(`unhandled_email_trigger trigger=${trigger} app=${event.applicationId}`);
      }
      this.logger.log(`email_sent trigger=${trigger} email=${event.applicantEmail} app=${event.applicationId}`);
    } catch (err) {
      this.logger.error(`email_trigger_failed trigger=${trigger} app=${event.applicationId} err=${(err as Error).message}`);
    }
  }

  // ─── State Değişimi: Hesap Kurulum Maili (active geçişi) ──────────────────────

  @OnEvent(APPLICATION_STATE_CHANGED, { async: true })
  async handleAccountSetup(event: ApplicationStateChangedEvent): Promise<void> {
    if (event.toState !== 'active' || !event.newUserId) return;
    try {
      const setupToken = await this.authService.createSetupToken(event.newUserId);
      const webUrl = process.env['MUTFAK_URL'] ?? process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://mutfak.haritailesi.org';
      const setupUrl = `${webUrl}/sifre-belirle?token=${setupToken}`;
      await this.emailService.sendAccountSetup(
        event.applicantEmail,
        event.displayName,
        setupToken,
        setupUrl,
      );
      this.logger.log(
        `account_setup_queued userId=${event.newUserId} email=${event.applicantEmail} app=${event.applicationId}`,
      );
    } catch (err) {
      this.logger.error(
        `account_setup_failed userId=${event.newUserId} app=${event.applicationId} err=${(err as Error).message}`,
      );
    }
  }

  // ─── State Değişimi: SMS ──────────────────────────────────────────────────────

  @OnEvent(APPLICATION_STATE_CHANGED, { async: true })
  async handleSms(event: ApplicationStateChangedEvent): Promise<void> {
    if (!event.applicantPhone) return;
    const n = event.displayName;
    const byType: Record<string, Partial<Record<string, string>>> = {
      individual: {
        under_review:       `${n}, bireysel üyelik başvurunuz incelemeye alındı.`,
        interview_needed:   `${n}, başvurunuz görüşme aşamasına geçti. Detaylar için e-postanızı kontrol edin.`,
        interview_scheduled:`${n}, görüşme tarihiniz belirlendi. Detaylar için e-postanızı kontrol edin.`,
        approved:           `Tebrikler ${n}! Bireysel üyelik başvurunuz onaylandı. Üyeliğinizi tamamlamak için e-postanızı kontrol edin.`,
        waiting_payment:    `${n}, üyeliğiniz için ödeme adımına geçildi. Detaylar için e-postanızı kontrol edin.`,
        waiting_verification:`${n}, ödemeniz alındı. Belge doğrulaması bekleniyor.`,
        active:             `${n}, Haritailesi Bireysel üyeliğiniz aktif! Mutfak'a giriş yapabilirsiniz: mutfak.haritailesi.org`,
        passive:            `${n}, bireysel üyeliğiniz geçici olarak pasif duruma alındı. Bilgi için ekibimizle iletişime geçebilirsiniz.`,
        rejected:           `${n}, bireysel üyelik başvurunuz değerlendirildi. Detaylı bilgi için e-postanızı kontrol edin.`,
      },
      corporate: {
        under_review:        `${n}, kurumsal üyelik başvurunuz incelemeye alındı.`,
        interview_needed:    `${n}, kurumsal başvurunuz görüşme aşamasına geçti. Detaylar için e-postanızı kontrol edin.`,
        approved:            `Tebrikler ${n}! Kurumsal üyelik başvurunuz onaylandı. Üyeliğinizi tamamlamak için e-postanızı kontrol edin.`,
        waiting_payment:     `${n}, kurumsal üyeliğiniz için ödeme adımına geçildi. Detaylar için e-postanızı kontrol edin.`,
        waiting_verification:`${n}, ödemeniz alındı. Belge doğrulaması bekleniyor.`,
        verified:            `${n}, belgeleriniz doğrulandı. Üyelik aktivasyonu için ekibimiz sizi bilgilendirecek.`,
        active:              `${n}, Haritailesi Kurumsal üyeliğiniz aktif! Mutfak'a giriş yapabilirsiniz: mutfak.haritailesi.org`,
        passive:             `${n}, kurumsal üyeliğiniz geçici olarak pasif duruma alındı. Bilgi için ekibimizle iletişime geçebilirsiniz.`,
        rejected:            `${n}, kurumsal üyelik başvurunuz değerlendirildi. Detaylı bilgi için e-postanızı kontrol edin.`,
      },
      meslegin_gelecekleri: {
        under_review:                 `${n}, Mesleğin Gelecekleri başvurunuz incelemeye alındı.`,
        shortlisted:                  `Tebrikler ${n}! Mesleğin Gelecekleri ön elemesini geçtiniz.`,
        interview_needed:             `${n}, Mesleğin Gelecekleri mülakatına davet edildiniz. Detaylar için e-postanızı kontrol edin.`,
        interview_completed:          `${n}, mülakatınız tamamlandı. Değerlendirme sonucunu e-posta ile ileteceğiz.`,
        waitlisted:                   `${n}, Mesleğin Gelecekleri yedek listesine alındınız. Yer açıldığında bilgilendirileceksiniz.`,
        accepted:                     `Tebrikler ${n}! Mesleğin Gelecekleri programına kabul edildiniz! Detaylar için e-postanızı kontrol edin.`,
        waiting_student_verification: `${n}, kaydınızı tamamlamak için öğrenci belgenizi yüklemeniz gerekiyor.`,
        active_program_member:        `${n}, Mesleğin Gelecekleri program üyeliğiniz aktif! Mutfak'a giriş yapabilirsiniz: mutfak.haritailesi.org`,
        program_completed:            `Tebrikler ${n}! Mesleğin Gelecekleri programını başarıyla tamamladınız.`,
        rejected:                     `${n}, Mesleğin Gelecekleri başvurunuz değerlendirildi. Detaylı bilgi için e-postanızı kontrol edin.`,
      },
      haritailesi_genc: {
        under_review:`${n}, Haritailesi Genç üyelik başvurunuz incelemeye alındı.`,
        approved:    `Tebrikler ${n}! Haritailesi Genç üyelik başvurunuz onaylandı! Hesabınızı oluşturmak için e-postanızı kontrol edin.`,
        active:      `${n}, Haritailesi Genç üyeliğiniz aktif! Mutfak'a giriş yapabilirsiniz: mutfak.haritailesi.org`,
        passive:     `${n}, Haritailesi Genç üyeliğiniz geçici olarak pasif duruma alındı. Bilgi için ekibimizle iletişime geçebilirsiniz.`,
        rejected:    `${n}, Haritailesi Genç başvurunuz değerlendirildi. Detaylı bilgi için e-postanızı kontrol edin.`,
      },
    };
    const message = byType[event.applicationType]?.[event.toState];
    if (!message) return;
    try {
      await this.smsService.send(event.applicantPhone, message);
      this.logger.log(`sms_queued state=${event.toState} app=${event.applicationId}`);
    } catch (err) {
      this.logger.error(`sms_failed state=${event.toState} app=${event.applicationId} err=${(err as Error).message}`);
    }
  }

  // ─── State Değişimi: WhatsApp ─────────────────────────────────────────────────
  // Template: basvuru_guncelleme — {{1}} = ad soyad, {{2}} = kisa durum metni
  // Serbest metin (sendText) 24 saatlik musteri penceresi gerektirdigindan
  // sadece onaylanmis template kullanilir; template PENDING ise API hatasi
  // loglara duser ama throw edilmez.

  @OnEvent(APPLICATION_STATE_CHANGED, { async: true })
  async handleWhatsapp(event: ApplicationStateChangedEvent): Promise<void> {
    if (!event.applicantPhone) return;
    const n = event.displayName;

    const byType: Record<string, Partial<Record<string, string>>> = {
      individual: {
        under_review:        'Bireysel üyelik başvurunuz incelemeye alındı',
        interview_needed:    'Başvurunuz görüşme aşamasına geçti, e-postanızı kontrol edin',
        interview_scheduled: 'Görüşme tarihiniz belirlendi, e-postanızı kontrol edin',
        approved:            'Bireysel üyelik başvurunuz onaylandı! E-postanızı kontrol edin',
        waiting_payment:     'Üyeliğiniz için ödeme adımına geçildi, e-postanızı kontrol edin',
        waiting_verification:'Ödemeniz alındı, belge doğrulaması bekleniyor',
        active:              'Bireysel üyeliğiniz aktif! mutfak.haritailesi.org adresinden giriş yapabilirsiniz',
        passive:             'Üyeliğiniz geçici olarak pasife alındı, bilgi için info@haritailesi.org adresine yazın',
        rejected:            'Başvurunuz değerlendirildi, detaylı bilgi için e-postanızı kontrol edin',
      },
      corporate: {
        under_review:        'Kurumsal üyelik başvurunuz incelemeye alındı',
        interview_needed:    'Kurumsal başvurunuz görüşme aşamasına geçti, e-postanızı kontrol edin',
        approved:            'Kurumsal üyelik başvurunuz onaylandı! E-postanızı kontrol edin',
        waiting_payment:     'Kurumsal üyeliğiniz için ödeme adımına geçildi, e-postanızı kontrol edin',
        waiting_verification:'Ödemeniz alındı, belge doğrulaması bekleniyor',
        verified:            'Belgeleriniz doğrulandı, aktivasyon için ekibimiz sizi bilgilendirecek',
        active:              'Kurumsal üyeliğiniz aktif! mutfak.haritailesi.org adresinden giriş yapabilirsiniz',
        passive:             'Kurumsal üyeliğiniz geçici olarak pasife alındı, bilgi için info@haritailesi.org adresine yazın',
        rejected:            'Başvurunuz değerlendirildi, detaylı bilgi için e-postanızı kontrol edin',
      },
      meslegin_gelecekleri: {
        under_review:                 'Mesleğin Gelecekleri başvurunuz incelemeye alındı',
        shortlisted:                  'Mesleğin Gelecekleri ön elemesini geçtiniz, tebrikler!',
        interview_needed:             'Mesleğin Gelecekleri mülakatına davet edildiniz, e-postanızı kontrol edin',
        interview_completed:          'Mülakatınız tamamlandı, sonucu e-posta ile ileteceğiz',
        waitlisted:                   'Yedek listesine alındınız, yer açıldığında bilgilendirileceksiniz',
        accepted:                     'Mesleğin Gelecekleri programına kabul edildiniz! E-postanızı kontrol edin',
        waiting_student_verification: 'Kaydınızı tamamlamak için öğrenci belgenizi yüklemeniz gerekiyor',
        active_program_member:        'Program üyeliğiniz aktif! mutfak.haritailesi.org adresinden giriş yapabilirsiniz',
        program_completed:            'Mesleğin Gelecekleri programını başarıyla tamamladınız, tebrikler!',
        rejected:                     'Başvurunuz değerlendirildi, detaylı bilgi için e-postanızı kontrol edin',
      },
      haritailesi_genc: {
        under_review:'Haritailesi Genç üyelik başvurunuz incelemeye alındı',
        approved:    'Haritailesi Genç üyelik başvurunuz onaylandı! E-postanızı kontrol edin',
        active:      'Haritailesi Genç üyeliğiniz aktif! mutfak.haritailesi.org adresinden giriş yapabilirsiniz',
        passive:     'Üyeliğiniz geçici olarak pasife alındı, bilgi için info@haritailesi.org adresine yazın',
        rejected:    'Başvurunuz değerlendirildi, detaylı bilgi için e-postanızı kontrol edin',
      },
    };

    const statusText = byType[event.applicationType]?.[event.toState];
    if (!statusText) return;

    try {
      await this.whatsappService.sendTemplate(
        event.applicantPhone,
        'basvuru_durum_bildir',
        'tr',
        [{
          type: 'body',
          parameters: [
            { type: 'text', text: n },
            { type: 'text', text: statusText },
          ],
        }],
      );
      this.logger.log(`whatsapp_template_sent state=${event.toState} app=${event.applicationId}`);
    } catch (err) {
      this.logger.error(`whatsapp_template_failed state=${event.toState} app=${event.applicationId} err=${(err as Error).message}`);
    }
  }

  // ─── State Değişimi: Otomasyon Tetikleyicileri ────────────────────────────────

  @OnEvent(APPLICATION_STATE_CHANGED, { async: true })
  async handleAutomationTrigger(event: ApplicationStateChangedEvent): Promise<void> {
    const triggerMap: Partial<Record<string, string>> = {
      active: 'member_approved',
      submitted: 'application_submitted',
      accepted: 'member_approved',
      active_program_member: 'member_approved',
    };
    const triggerType = triggerMap[event.toState];
    if (!triggerType) return;
    try {
      await this.automationService.triggerAutomation(triggerType, event.applicantEmail, {
        applicationType: event.applicationType,
        displayName: event.displayName,
        applicationId: event.applicationId,
      });
      this.logger.log(`automation_triggered type=${triggerType} email=${event.applicantEmail}`);
    } catch (err) {
      this.logger.error(`automation_trigger_failed type=${triggerType} err=${(err as Error).message}`);
    }
  }

  // ─── Ödeme Muafiyeti: Audit ───────────────────────────────────────────────────

  @OnEvent(DomainEvent.PAYMENT_WAIVED, { async: true })
  async handlePaymentWaivedAudit(payload: DomainEventPayload): Promise<void> {
    try {
      // AuditService only reads actor.id and actor.email — minimal cast is safe here
      const actor = payload.actorId
        ? ({ id: payload.actorId, email: payload.actorEmail ?? '' } as unknown as RequestUser)
        : null;

      await this.auditService.log({
        actor,
        action: 'application.payment_waived',
        entityType: 'application',
        entityId: payload.applicationId,
        afterState: payload.metadata,
      });
    } catch (err) {
      this.logger.error(
        `waive_audit_failed app=${payload.applicationId} err=${(err as Error).message}`,
      );
    }
  }
}

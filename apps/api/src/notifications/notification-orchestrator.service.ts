import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from '../email/email.service';
import { NotificationsService } from './notifications.service';
import {
  APPLICATION_STATE_CHANGED,
  ApplicationStateChangedEvent,
  DomainEvent,
} from '../applications/events/application.events';
import type { DomainEventPayload, MemberEventPayload, MemberRoleEventPayload } from '../applications/events/domain-events';

// ─── Notification Orchestrator ─────────────────────────────────────────────────
// Single source of truth for all notification routing decisions.
// Subscribes to both the internal APPLICATION_STATE_CHANGED event (for
// state-machine-driven email/push) and semantic domain events (for
// payment lifecycle notifications outside the state machine).

@Injectable()
export class NotificationOrchestratorService {
  private readonly logger = new Logger(NotificationOrchestratorService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── State-machine transitions: email ─────────────────────────────────────────

  @OnEvent(APPLICATION_STATE_CHANGED, { async: true })
  async handleStateChangedEmail(event: ApplicationStateChangedEvent): Promise<void> {
    if (!event.transition.emailTrigger) return;
    try {
      await this.emailService.send(event.applicantEmail, event.transition.emailTrigger, {
        displayName: event.displayName,
      });
      this.logger.log(
        `email_queued template=${event.transition.emailTrigger} to=${event.applicantEmail} app=${event.applicationId}`,
      );
    } catch (err) {
      this.logger.error(
        `email_queue_failed template=${event.transition.emailTrigger} app=${event.applicationId} err=${(err as Error).message}`,
      );
    }
  }

  // ─── State-machine transitions: push ──────────────────────────────────────────

  @OnEvent(APPLICATION_STATE_CHANGED, { async: true })
  async handleStateChangedPush(event: ApplicationStateChangedEvent): Promise<void> {
    if (!event.transition.push || !event.notifyUserId) return;
    try {
      await this.notificationsService.create(event.notifyUserId, {
        type: 'application_state_changed',
        title: event.transition.push.title,
        body: event.transition.push.body,
        data: { applicationId: event.applicationId, toState: event.toState },
      });
    } catch (err) {
      this.logger.error(
        `push_failed app=${event.applicationId} userId=${event.notifyUserId} err=${(err as Error).message}`,
      );
    }
  }

  // ─── Payment waived ───────────────────────────────────────────────────────────

  @OnEvent(DomainEvent.PAYMENT_WAIVED, { async: true })
  async handlePaymentWaived(payload: DomainEventPayload): Promise<void> {
    try {
      await this.emailService.send(payload.applicantEmail, 'payment_waived', {
        displayName: payload.displayName,
        reason: String(payload.metadata?.['reason'] ?? ''),
      });
    } catch (err) {
      this.logger.error(
        `waive_email_failed app=${payload.applicationId} err=${(err as Error).message}`,
      );
    }
    if (payload.applicantUserId) {
      try {
        await this.notificationsService.create(payload.applicantUserId, {
          type: 'payment_waived',
          title: 'Ödeme Muafiyeti',
          body: 'Üyelik ödemeniz muaf tutulmuştur.',
          data: { applicationId: payload.applicationId },
        });
      } catch (err) {
        this.logger.error(
          `waive_push_failed app=${payload.applicationId} err=${(err as Error).message}`,
        );
      }
    }
  }

  // ─── Payment reminded (push only — email sent directly from cron) ─────────────

  @OnEvent(DomainEvent.PAYMENT_REMINDED, { async: true })
  async handlePaymentReminded(payload: DomainEventPayload): Promise<void> {
    if (!payload.applicantUserId) return;
    try {
      await this.notificationsService.create(payload.applicantUserId, {
        type: 'payment_reminder',
        title: 'Ödeme Hatırlatması',
        body: `Üyelik ödemenizin son tarihi yaklaşıyor: ${String(payload.metadata?.['paymentDueAt'] ?? '')}`,
        data: { applicationId: payload.applicationId },
      });
    } catch (err) {
      this.logger.error(
        `reminder_push_failed app=${payload.applicationId} err=${(err as Error).message}`,
      );
    }
  }

  // ─── Member activated ─────────────────────────────────────────────────────────

  @OnEvent(DomainEvent.MEMBER_ACTIVATED, { async: true })
  async handleMemberActivated(payload: MemberEventPayload): Promise<void> {
    try {
      await this.emailService.send(payload.email, 'membership_activated', {
        displayName: payload.displayName,
      });
    } catch (err) {
      this.logger.error(
        `member_activated_email_failed userId=${payload.userId} err=${(err as Error).message}`,
      );
    }
    try {
      await this.notificationsService.create(payload.userId, {
        type: 'member_activated',
        title: 'Üyeliğiniz Aktif! 🎉',
        body: 'Haritailesi üyeliğiniz aktif hale getirildi. Topluluğa hoş geldiniz!',
        data: {},
      });
    } catch (err) {
      this.logger.error(
        `member_activated_push_failed userId=${payload.userId} err=${(err as Error).message}`,
      );
    }
  }

  // ─── Role assigned (in-app notification only) ─────────────────────────────────

  @OnEvent(DomainEvent.MEMBER_ROLE_ASSIGNED, { async: true })
  async handleRoleAssigned(payload: MemberRoleEventPayload): Promise<void> {
    try {
      await this.notificationsService.create(payload.userId, {
        type: 'role_assigned',
        title: 'Yeni Rol',
        body: `Size "${payload.role}" rolü atandı.`,
        data: { role: payload.role },
      });
    } catch (err) {
      this.logger.error(
        `role_assigned_push_failed userId=${payload.userId} err=${(err as Error).message}`,
      );
    }
  }
}

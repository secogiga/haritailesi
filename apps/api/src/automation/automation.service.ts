import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DomainEvent } from '../applications/events/domain-events';
import type {
  MemberEventPayload,
  MemberRoleEventPayload,
  MemberTierEventPayload,
} from '../applications/events/domain-events';
import { PUSH_QUEUE } from '../redis/redis.constants';
import type { PushJob } from '../notifications/push.types';
import { AUTOMATION_RULES } from './rules';
import type { AnyAutomationRule, AutomationAction } from './automation.types';
import { resolveValue } from './automation.types';

// ─── Automation Engine ────────────────────────────────────────────────────────
// Evaluates code-defined rules against domain events and executes their actions.
// Separation from NotificationOrchestratorService:
//   - Orchestrator: 1:1 immediate reactions (every event of type X → action)
//   - AutomationService: conditional + delayed rules (if X.field === Y → action after N ms)

@Injectable()
export class AutomationService implements OnModuleInit {
  private readonly logger = new Logger(AutomationService.name);
  private readonly ruleIndex = new Map<string, AnyAutomationRule[]>();

  constructor(
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    @InjectQueue(PUSH_QUEUE) private readonly pushQueue: Queue<PushJob>,
  ) {}

  onModuleInit() {
    for (const rule of AUTOMATION_RULES) {
      const bucket = this.ruleIndex.get(rule.event) ?? [];
      bucket.push(rule);
      this.ruleIndex.set(rule.event, bucket);
    }
    this.logger.log(
      `automation_rules_loaded count=${AUTOMATION_RULES.length} events=${this.ruleIndex.size}`,
    );
  }

  // ─── Event listeners ──────────────────────────────────────────────────────────

  @OnEvent(DomainEvent.MEMBER_ACTIVATED, { async: true })
  async onMemberActivated(payload: MemberEventPayload): Promise<void> {
    await this.evaluate(DomainEvent.MEMBER_ACTIVATED, payload);
  }

  @OnEvent(DomainEvent.MEMBER_DEACTIVATED, { async: true })
  async onMemberDeactivated(payload: MemberEventPayload): Promise<void> {
    await this.evaluate(DomainEvent.MEMBER_DEACTIVATED, payload);
  }

  @OnEvent(DomainEvent.MEMBER_ROLE_ASSIGNED, { async: true })
  async onMemberRoleAssigned(payload: MemberRoleEventPayload): Promise<void> {
    await this.evaluate(DomainEvent.MEMBER_ROLE_ASSIGNED, payload);
  }

  @OnEvent(DomainEvent.MEMBER_TIER_CHANGED, { async: true })
  async onMemberTierChanged(payload: MemberTierEventPayload): Promise<void> {
    await this.evaluate(DomainEvent.MEMBER_TIER_CHANGED, payload);
  }

  // ─── Evaluation engine ────────────────────────────────────────────────────────

  private async evaluate(event: string, payload: unknown): Promise<void> {
    const rules = this.ruleIndex.get(event) ?? [];
    for (const rule of rules) {
      try {
        if (rule.condition && !rule.condition(payload)) continue;
        await this.executeActions(rule.id, payload, rule.actions);
      } catch (err) {
        this.logger.error(
          `automation_rule_failed rule=${rule.id} event=${event} err=${(err as Error).message}`,
        );
      }
    }
  }

  private async executeActions(
    ruleId: string,
    payload: unknown,
    actions: AutomationAction<unknown>[],
  ): Promise<void> {
    for (const action of actions) {
      try {
        await this.executeAction(ruleId, payload, action);
      } catch (err) {
        this.logger.error(
          `automation_action_failed rule=${ruleId} type=${action.type} err=${(err as Error).message}`,
        );
      }
    }
  }

  private async executeAction(
    ruleId: string,
    payload: unknown,
    action: AutomationAction<unknown>,
  ): Promise<void> {
    switch (action.type) {
      case 'email': {
        const to = action.to(payload);
        const vars = action.vars(payload);
        await this.emailService.send(to, action.template, vars);
        this.logger.log(`automation_email rule=${ruleId} template=${action.template} to=${to}`);
        break;
      }

      case 'push': {
        const userId = action.userId(payload);
        const title = resolveValue(action.title, payload);
        const body = resolveValue(action.body, payload);
        await this.notificationsService.create(userId, {
          type: `automation.${ruleId}`,
          title,
          body,
        });
        this.logger.log(`automation_push rule=${ruleId} userId=${userId}`);
        break;
      }

      case 'delayed_push': {
        const userId = action.userId(payload);
        await this.pushQueue.add(
          'send',
          { userId, title: action.title, body: action.body, tag: `automation.${ruleId}` },
          {
            delay: action.delayMs,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 50,
            removeOnFail: 100,
            jobId: `automation.${ruleId}.${userId}`, // deduplicate: one nudge per user
          },
        );
        this.logger.log(
          `automation_delayed_push rule=${ruleId} userId=${userId} delayMs=${action.delayMs}`,
        );
        break;
      }
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { newsletterAutomations, newsletterAutomationLogs } from '@haritailesi/database';
import { eq, and, lte, desc } from 'drizzle-orm';

export interface AutomationStep {
  delayDays: number;
  subject: string;
  htmlBody: string;
  previewText?: string;
}

@Injectable()
export class NewsletterAutomationService {
  private readonly logger = new Logger(NewsletterAutomationService.name);

  constructor(
    @InjectDb() private readonly db: Database,
    private readonly config: ConfigService,
  ) {}

  private get brevoKey() { return this.config.get<string>('BREVO_API_KEY') ?? ''; }
  private get senderEmail() { return this.config.get<string>('BREVO_SENDER_EMAIL') ?? 'iletisim@haritailesi.org'; }
  private get senderName() { return this.config.get<string>('BREVO_SENDER_NAME') ?? 'Haritailesi'; }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async list() {
    return this.db
      .select()
      .from(newsletterAutomations)
      .orderBy(desc(newsletterAutomations.createdAt));
  }

  async create(dto: { name: string; description?: string; triggerType: string; steps: AutomationStep[] }) {
    const [row] = await this.db.insert(newsletterAutomations).values({
      name: dto.name,
      ...(dto.description ? { description: dto.description } : {}),
      triggerType: dto.triggerType,
      steps: dto.steps,
      status: 'active',
    }).returning();
    return row;
  }

  async update(id: string, dto: Partial<{ name: string; description: string; steps: AutomationStep[]; status: string }>) {
    const [row] = await this.db.update(newsletterAutomations)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(newsletterAutomations.id, id))
      .returning();
    return row;
  }

  async remove(id: string) {
    await this.db.delete(newsletterAutomations).where(eq(newsletterAutomations.id, id));
    return { ok: true };
  }

  async getLogs(automationId: string, limit = 50) {
    return this.db
      .select()
      .from(newsletterAutomationLogs)
      .where(eq(newsletterAutomationLogs.automationId, automationId))
      .orderBy(desc(newsletterAutomationLogs.createdAt))
      .limit(limit);
  }

  // ─── Trigger ─────────────────────────────────────────────────────────────────

  async triggerAutomation(triggerType: string, subscriberEmail: string, metadata?: Record<string, unknown>) {
    const activeAutomations = await this.db
      .select()
      .from(newsletterAutomations)
      .where(and(
        eq(newsletterAutomations.triggerType, triggerType),
        eq(newsletterAutomations.status, 'active'),
      ));

    for (const automation of activeAutomations) {
      const steps = automation.steps as AutomationStep[];
      if (!Array.isArray(steps) || steps.length === 0) continue;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]!;
        const scheduledAt = new Date();
        scheduledAt.setDate(scheduledAt.getDate() + (step.delayDays ?? 0));

        await this.db.insert(newsletterAutomationLogs).values({
          automationId: automation.id,
          subscriberEmail,
          stepIndex: i,
          status: 'queued',
          scheduledAt,
          ...(metadata ? { metadata } : {}),
        }).onConflictDoNothing();
      }
    }
  }

  // ─── Cron: process due steps ─────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async processDueSteps() {
    if (!this.brevoKey) return;

    const due = await this.db
      .select()
      .from(newsletterAutomationLogs)
      .where(and(
        eq(newsletterAutomationLogs.status, 'queued'),
        lte(newsletterAutomationLogs.scheduledAt, new Date()),
      ))
      .limit(50);

    for (const log of due) {
      try {
        const [automation] = await this.db
          .select()
          .from(newsletterAutomations)
          .where(eq(newsletterAutomations.id, log.automationId))
          .limit(1);

        if (!automation || automation.status !== 'active') {
          await this.db.update(newsletterAutomationLogs)
            .set({ status: 'skipped' })
            .where(eq(newsletterAutomationLogs.id, log.id));
          continue;
        }

        const steps = automation.steps as AutomationStep[];
        const step = steps[log.stepIndex];
        if (!step) {
          await this.db.update(newsletterAutomationLogs)
            .set({ status: 'skipped' })
            .where(eq(newsletterAutomationLogs.id, log.id));
          continue;
        }

        await this.sendBrevoTransactional(log.subscriberEmail, step);

        await this.db.update(newsletterAutomationLogs)
          .set({ status: 'sent', sentAt: new Date() })
          .where(eq(newsletterAutomationLogs.id, log.id));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
        this.logger.warn(`Automation log ${log.id} gönderimi başarısız: ${msg}`);
        await this.db.update(newsletterAutomationLogs)
          .set({ status: 'failed', errorMessage: msg })
          .where(eq(newsletterAutomationLogs.id, log.id));
      }
    }
  }

  private async sendBrevoTransactional(to: string, step: AutomationStep) {
    const body = {
      sender: { email: this.senderEmail, name: this.senderName },
      to: [{ email: to }],
      subject: step.subject,
      htmlContent: step.htmlBody,
      ...(step.previewText ? { headers: { 'X-Preview-Text': step.previewText } } : {}),
    };

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': this.brevoKey, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message ?? `Brevo HTTP ${res.status}`);
    }
  }
}

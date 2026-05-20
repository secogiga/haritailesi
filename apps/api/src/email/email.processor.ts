import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import { EMAIL_QUEUE } from '../redis/redis.constants';
import type { EmailJob } from './email.types';
import { renderTemplate, getSubject } from './email.templates';

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async process(job: Job<EmailJob>): Promise<void> {
    const { to, name, variables, attachments } = job.data;

    try {
      await this.sendViaBrevo(to, name, variables, attachments);
      this.logger.log(`Email sent: ${name} → ${to}`);
    } catch (error) {
      this.logger.error(`Email failed: ${name} → ${to}`, error);
      throw error;
    }
  }

  private async sendViaBrevo(
    to: string,
    templateName: string,
    variables: Record<string, string | number | boolean>,
    attachments?: import('./email.types').EmailAttachment[],
  ): Promise<void> {
    const apiKey = this.config.getOrThrow<string>('BREVO_API_KEY');
    const fromEmail = this.config.get<string>('EMAIL_FROM', 'noreply@haritailesi.org');
    const fromName = this.config.get<string>('EMAIL_FROM_NAME', 'Haritailesi');

    const body: Record<string, unknown> = {
      sender: { email: fromEmail, name: fromName },
      to: [{ email: to }],
      subject: getSubject(templateName),
      htmlContent: renderTemplate(templateName, variables),
      params: variables,
    };
    if (attachments?.length) body['attachment'] = attachments;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Brevo API error ${response.status}: ${errorBody}`);
    }
  }
}

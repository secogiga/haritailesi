import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { EMAIL_QUEUE } from '../redis/redis.constants';
import type { EmailJob, EmailJobName } from './email.types';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(@InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue<EmailJob>) {}

  async send(
    to: string,
    name: EmailJobName,
    variables: Record<string, string | number | boolean>,
    options?: { delay?: number; jobId?: string; attachments?: import('./email.types').EmailAttachment[] },
  ): Promise<void> {
    await this.emailQueue.add(
      name,
      { to, name, variables, ...(options?.attachments?.length ? { attachments: options.attachments } : {}) },
      {
        jobId: options?.jobId ?? `${name}:${to}:${Date.now()}`,
        ...(options?.delay !== undefined && { delay: options.delay }),
      },
    );
  }

  async sendWelcome(to: string, displayName: string): Promise<void> {
    await this.send(to, 'welcome', { displayName });
  }

  async sendApplicationSubmitted(to: string, applicantName: string): Promise<void> {
    await this.send(to, 'application_submitted', { applicantName });
  }

  async sendApplicationApproved(to: string, applicantName: string): Promise<void> {
    await this.send(to, 'application_approved', { applicantName });
  }

  async sendAccountSetup(to: string, displayName: string, setupToken: string, setupUrl: string): Promise<void> {
    await this.send(to, 'account_setup', { displayName, setupToken, setupUrl });
  }

  async sendMentorshipRequestReceived(
    to: string,
    mentorName: string,
    menteeName: string,
    topic: string,
    goal: string,
  ): Promise<void> {
    await this.send(to, 'mentorship_request_received', { displayName: mentorName, menteeName, topic, goal });
  }

  async sendMentorshipRequestAccepted(
    to: string,
    menteeName: string,
    mentorName: string,
    scheduledAtFormatted: string,
    mentorNote: string,
    icsBase64: string,
  ): Promise<void> {
    await this.send(
      to,
      'mentorship_request_accepted',
      { displayName: menteeName, mentorName, scheduledAt: scheduledAtFormatted, mentorNote },
      { attachments: [{ name: 'bulusma.ics', content: icsBase64, type: 'text/calendar' }] },
    );
  }

  async sendMentorshipRequestRejected(
    to: string,
    menteeName: string,
    mentorName: string,
    mentorNote: string,
  ): Promise<void> {
    await this.send(to, 'mentorship_request_rejected', { displayName: menteeName, mentorName, mentorNote });
  }

  async sendMentorshipReminder(
    to: string,
    recipientName: string,
    counterpartName: string,
    scheduledAtFormatted: string,
    topic: string,
    stableJobId: string,
    delayMs: number,
  ): Promise<void> {
    await this.send(
      to,
      'mentorship_reminder',
      { displayName: recipientName, counterpartName, scheduledAt: scheduledAtFormatted, topic },
      { delay: delayMs, jobId: stableJobId },
    );
  }

  async sendMentorshipRescheduleProposed(
    to: string,
    menteeName: string,
    mentorName: string,
    proposedAtFormatted: string,
    rescheduleNote: string,
  ): Promise<void> {
    await this.send(to, 'mentorship_reschedule_proposed', { displayName: menteeName, mentorName, proposedAt: proposedAtFormatted, rescheduleNote });
  }

  async sendMentorshipRescheduleAccepted(
    to: string,
    mentorName: string,
    menteeName: string,
    newScheduledAtFormatted: string,
  ): Promise<void> {
    await this.send(to, 'mentorship_reschedule_accepted', { displayName: mentorName, menteeName, newScheduledAt: newScheduledAtFormatted });
  }

  async sendMentorshipRescheduleRejected(
    to: string,
    mentorName: string,
    menteeName: string,
    originalScheduledAtFormatted: string,
  ): Promise<void> {
    await this.send(to, 'mentorship_reschedule_rejected', { displayName: mentorName, menteeName, originalScheduledAt: originalScheduledAtFormatted });
  }

  async sendProvisionaryFollowup(
    to: string,
    displayName: string,
    dayOffset: 2 | 5 | 10,
    delayMs: number,
  ): Promise<void> {
    const name = `provisionary_followup_t${dayOffset}` as EmailJobName;
    await this.send(to, name, { displayName }, { delay: delayMs });
  }
}

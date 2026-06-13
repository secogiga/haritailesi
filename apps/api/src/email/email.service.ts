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

  async sendApplicationApproved(to: string, applicantName: string, applicationType: string, applicationId: string): Promise<void> {
    await this.send(to, 'application_approved', { applicantName, applicationType, applicationId });
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

  async sendApplicationUnderReview(to: string, displayName: string, applicationId?: string): Promise<void> {
    await this.send(to, 'application_under_review', { displayName }, applicationId ? { jobId: `application_under_review:${applicationId}` } : undefined);
  }

  async sendInterviewInvitation(
    to: string,
    displayName: string,
    adminName: string,
    confirmUrl: string,
    cancelUrl: string,
  ): Promise<void> {
    await this.send(to, 'application_interview_invitation', { displayName, adminName, confirmUrl, cancelUrl });
  }

  async sendInterviewConfirmed(
    to: string,
    displayName: string,
    scheduledAtFormatted: string,
    meetUrl: string,
  ): Promise<void> {
    await this.send(to, 'application_interview_confirmed', { displayName, scheduledAt: scheduledAtFormatted, meetUrl });
  }

  async sendInterviewRescheduled(
    to: string,
    applicantName: string,
    rescheduleNote: string,
    adminUrl: string,
  ): Promise<void> {
    await this.send(to, 'application_interview_rescheduled', { applicantName, rescheduleNote, adminUrl });
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

  async sendDmReceived(
    to: string,
    recipientName: string,
    senderName: string,
    messagePreview: string,
    delayMs: number,
    stableJobId: string,
  ): Promise<void> {
    await this.send(
      to,
      'dm_received',
      { recipientName, senderName, messagePreview },
      { delay: delayMs, jobId: stableJobId },
    );
  }

  async sendLevelUp(to: string, displayName: string, levelId: string): Promise<void> {
    const labels: Record<string, string> = {
      katilimci:    '2. Katılımcı',
      katki_sunan:  '3. Katkı Sunan',
      etki_yaratan: '4. Etki Yaratan',
    };
    await this.send(to, 'level_up', { displayName, levelLabel: labels[levelId] ?? levelId });
  }

  async sendAdminBroadcast(to: string, recipientName: string, subject: string, body: string): Promise<void> {
    await this.send(to, 'admin_broadcast', { recipientName, subject, body });
  }

  async sendFeedbackConfirmation(to: string, feedbackSubject: string, ticketNo: number): Promise<void> {
    await this.send(to, 'feedback_received', { feedbackSubject, ticketNo });
  }

  async sendFeedbackReviewing(to: string, feedbackSubject: string, ticketNo: number): Promise<void> {
    await this.send(to, 'feedback_reviewing', { feedbackSubject, ticketNo });
  }

  async sendFeedbackInProgress(to: string, feedbackSubject: string, ticketNo: number): Promise<void> {
    await this.send(to, 'feedback_in_progress', { feedbackSubject, ticketNo });
  }

  async sendFeedbackAwaitingInfo(to: string, feedbackSubject: string, ticketNo: number, adminReply?: string): Promise<void> {
    await this.send(to, 'feedback_awaiting_info', { feedbackSubject, ticketNo, ...(adminReply ? { adminReply } : {}) });
  }

  async sendFeedbackMentoring(to: string, feedbackSubject: string, ticketNo: number): Promise<void> {
    await this.send(to, 'feedback_mentoring', { feedbackSubject, ticketNo });
  }

  async sendFeedbackPartnerReferred(to: string, feedbackSubject: string, ticketNo: number): Promise<void> {
    await this.send(to, 'feedback_partner_referred', { feedbackSubject, ticketNo });
  }

  async sendFeedbackEducationSuggested(to: string, feedbackSubject: string, ticketNo: number): Promise<void> {
    await this.send(to, 'feedback_education_suggested', { feedbackSubject, ticketNo });
  }

  async sendFeedbackResolved(to: string, feedbackSubject: string, ticketNo: number, adminReply?: string): Promise<void> {
    await this.send(to, 'feedback_resolved', { feedbackSubject, ticketNo, ...(adminReply ? { adminNotes: adminReply } : {}) });
  }

  async sendFeedbackSatisfactionRequest(to: string, feedbackSubject: string, ticketNo: number, satisfactionUrl: string): Promise<void> {
    await this.send(to, 'feedback_satisfaction_request', { feedbackSubject, ticketNo, satisfactionUrl });
  }

  async sendCourseCertificateIssued(to: string, displayName: string, trainingTitle: string, certCode: string, certUrl: string): Promise<void> {
    await this.send(to, 'course_certificate_issued', { displayName, trainingTitle, certCode, certUrl });
  }

  async sendCourseCompleted(to: string, displayName: string, trainingTitle: string, courseUrl: string): Promise<void> {
    await this.send(to, 'course_completed', { displayName, trainingTitle, courseUrl });
  }

  async sendCourseAnnouncement(to: string, displayName: string, trainingTitle: string, announcementTitle: string, announcementBody: string, courseUrl: string): Promise<void> {
    await this.send(to, 'course_announcement', { displayName, trainingTitle, announcementTitle, announcementBody, courseUrl });
  }

  async sendStoreOrderConfirmed(to: string, dto: {
    buyerName: string; orderId: string; total: string; items: string;
    hasPhysical: boolean; orderUrl: string;
  }): Promise<void> {
    await this.send(to, 'store_order_confirmed', { ...dto, hasPhysical: dto.hasPhysical });
  }

  async sendStoreOrderShipped(to: string, dto: {
    buyerName: string; productTitle: string;
    trackingNumber?: string; trackingCompany?: string; orderUrl: string;
  }): Promise<void> {
    await this.send(to, 'store_order_shipped', {
      buyerName: dto.buyerName,
      productTitle: dto.productTitle,
      ...(dto.trackingNumber ? { trackingNumber: dto.trackingNumber } : {}),
      ...(dto.trackingCompany ? { trackingCompany: dto.trackingCompany } : {}),
      orderUrl: dto.orderUrl,
    });
  }

  async sendStoreSellerApproved(to: string, applicantName: string, dashboardUrl: string): Promise<void> {
    await this.send(to, 'store_seller_approved', { applicantName, dashboardUrl });
  }

  async sendStoreSellerRejected(to: string, applicantName: string, adminNotes?: string): Promise<void> {
    await this.send(to, 'store_seller_rejected', {
      applicantName,
      ...(adminNotes ? { adminNotes } : {}),
    });
  }

  async sendListingAlertNew(
    to: string,
    data: { listingTitle: string; listingCompany: string; catLabel: string; listingUrl: string; unsubUrl: string },
  ): Promise<void> {
    await this.send(to, 'listing_alert_new', { ...data });
  }

  async sendListingExpiryReminder(
    to: string,
    data: { displayName: string; listingTitle: string; daysLeft: number; expiresAt: string },
  ): Promise<void> {
    const renewUrl = `${process.env['MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org'}/ilanlarim`;
    await this.send(to, 'listing_expiry_reminder', {
      displayName:  data.displayName,
      listingTitle: data.listingTitle,
      daysLeft:     data.daysLeft,
      expiresAt:    data.expiresAt,
      renewUrl,
    });
  }

  async sendTestCertificate(to: string, displayName: string, testTitle: string, score: number, maxScore: number, percent: number): Promise<void> {
    const date = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    await this.send(to, 'test_certificate', { displayName, testTitle, score, maxScore, percent, date });
  }

  async sendSurveyParticipated(to: string, displayName: string, surveyTitle: string): Promise<void> {
    await this.send(to, 'survey_participated', { displayName, surveyTitle });
  }

  async sendCompetitionResultWinner(to: string, displayName: string, competitionTitle: string): Promise<void> {
    await this.send(to, 'competition_result_winner', { displayName, competitionTitle });
  }

  async sendListingContact(
    to: string,
    data: { listingTitle: string; listingCompany: string; senderName: string; senderEmail: string; message: string },
  ): Promise<void> {
    await this.send(to, 'listing_contact', {
      listingTitle:   data.listingTitle,
      listingCompany: data.listingCompany,
      senderName:     data.senderName,
      senderEmail:    data.senderEmail,
      message:        data.message,
    });
  }

  async sendLibraryRegulationUpdate(
    to: string,
    displayName: string,
    regulationSlug: string,
    regulationTitle: string,
    regulationShortTitle: string,
    changeNote: string,
  ): Promise<void> {
    await this.send(to, 'library_regulation_update', {
      displayName,
      regulationSlug,
      regulationTitle,
      regulationShortTitle,
      changeNote,
    });
  }
}

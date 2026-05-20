export type EmailJobName =
  | 'welcome'
  | 'application_submitted'
  | 'application_approved'
  | 'application_rejected'
  | 'application_interview_scheduled'
  | 'payment_reminder'
  | 'verification_approved'
  | 'verification_rejected'
  | 'provisionary_followup_t2'
  | 'provisionary_followup_t5'
  | 'provisionary_followup_t10'
  | 'account_setup'
  | 'forgot_password'
  | 'mentorship_request_received'
  | 'mentorship_request_accepted'
  | 'mentorship_request_rejected'
  | 'mentorship_reminder'
  | 'mentorship_reschedule_proposed'
  | 'mentorship_reschedule_accepted'
  | 'mentorship_reschedule_rejected'
  | 'weekly_digest'
  | 'payment_confirmed'
  | 'membership_paused'
  | 'membership_reactivated'
  | 'mentor_profile_approved'
  | 'membership_activated'
  | 'membership_renewal_reminder_30'
  | 'membership_renewal_reminder_7'
  | 'membership_renewal_reminder_1'
  | 'membership_expired'
  | 'application_sla_alert';

export interface EmailAttachment {
  name: string;
  content: string; // base64
  type: string;    // mime type
}

export interface EmailJob {
  to: string;
  name: EmailJobName;
  variables: Record<string, string | number | boolean>;
  attachments?: EmailAttachment[];
}

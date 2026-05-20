import { pgEnum } from 'drizzle-orm/pg-core';

// ─── Membership Tier ───────────────────────────────────────────────────────────

export const membershipTierEnum = pgEnum('membership_tier', [
  'visitor',
  'registered_user',
  'haritailesi_genc',
  'new_graduate_member',
  'individual_member',
  'corporate_member',
]);

// ─── Functional Role ───────────────────────────────────────────────────────────

export const functionalRoleEnum = pgEnum('functional_role', [
  'mentor',
  'moderator',
  'editor',
  'meslegin_gelecekleri_participant',
  'corporate_rep',
  'admin',
  'super_admin',
]);

// ─── User Status ───────────────────────────────────────────────────────────────

export const userStatusEnum = pgEnum('user_status', [
  'pending',
  'active',
  'passive',
  'suspended',
  'deleted',
]);

// ─── Verification Status ───────────────────────────────────────────────────────

export const verificationStatusEnum = pgEnum('verification_status', [
  'unverified',
  'verification_requested',
  'verification_submitted',
  'verified',
  'verification_rejected',
]);

// ─── Application Type ──────────────────────────────────────────────────────────

export const applicationTypeEnum = pgEnum('application_type', [
  'individual',
  'corporate',
  'meslegin_gelecekleri',
  'haritailesi_genc',
]);

// ─── Post Type ─────────────────────────────────────────────────────────────────

export const postTypeEnum = pgEnum('post_type', [
  'general',
  'question',
  'idea',
  'project_call',
  'content_draft',
  'team_search',
  'mentorship_experience',
  'poll',
  'announcement',
  'resource',
]);

// ─── Post Category ─────────────────────────────────────────────────────────────

export const postCategoryEnum = pgEnum('post_category', [
  'klasik_haritacilik',
  'cbs',
  'fotogrametri_uzaktan_algilama',
  'insaat',
  'gayrimenkul_degerleme',
  'yazilim_teknoloji',
  'kariyer',
  'egitim',
  'mentorluk',
  'gonullulik',
  'proje_gelistirme',
  'haritailesi_duyurulari',
]);

// ─── Post Status ───────────────────────────────────────────────────────────────

export const postStatusEnum = pgEnum('post_status', [
  'draft',
  'pending_review',
  'published',
  'hidden',
  'deleted',
]);

// ─── Event Type ────────────────────────────────────────────────────────────────

export const eventTypeEnum = pgEnum('event_type', [
  'kongre',
  'networking',
  'odul',
  'diger',
]);

// ─── Project Status ────────────────────────────────────────────────────────────

export const projectStatusEnum = pgEnum('project_status', [
  'active',
  'completed',
  'archived',
]);

// ─── Feedback / Community ──────────────────────────────────────────────────────

export const feedbackTypeEnum = pgEnum('feedback_type', ['talep', 'gorus']);
export const feedbackSourceEnum = pgEnum('feedback_source', ['sahne', 'mutfak', 'web']);
export const feedbackStatusEnum = pgEnum('feedback_status', ['open', 'in_progress', 'resolved']);

export const mentorApplicationTypeEnum = pgEnum('mentor_application_type', ['mentor', 'mentee']);
export const mentorApplicationStatusEnum = pgEnum('mentor_application_status', [
  'pending', 'reviewing', 'matched', 'rejected',
]);

// ─── Donation ─────────────────────────────────────────────────────────────────

export const donationTypeEnum = pgEnum('donation_type', ['one_time', 'recurring']);
export const donationMethodEnum = pgEnum('donation_method', ['bank_transfer', 'iyzico']);
export const donationStatusEnum = pgEnum('donation_status', [
  'pending', 'completed', 'failed', 'refunded',
]);

// ─── Payment Account ──────────────────────────────────────────────────────────
// vakif = Haritailesi Vakfı (bağış + üyelik)
// sirket = Haritailesiş Teknoloji ve Ticaret Ltd. Şti. (etkinlik/eğitim/mağaza)
export const paymentAccountEnum = pgEnum('payment_account', ['vakif', 'sirket']);

// ─── Membership Subscription ──────────────────────────────────────────────────
export const membershipSubStatusEnum = pgEnum('membership_sub_status', [
  'pending_payment', 'active', 'expired', 'cancelled',
]);

// ─── Content Request ──────────────────────────────────────────────────────────

export const contentRequestTypeEnum = pgEnum('content_request_type', [
  'magaza', 'etkinlik', 'egitim', 'ilan',
]);
export const contentRequestStatusEnum = pgEnum('content_request_status', [
  'pending', 'approved', 'rejected',
]);

// ─── Job Listing ──────────────────────────────────────────────────────────────

export const jobTypeEnum = pgEnum('job_type', [
  'full_time', 'part_time', 'freelance', 'internship',
  'satilik', 'kiralik', 'aranan', 'hizmet', 'isbirligi', 'diger',
  'proje', 'teknik_destek', 'freelancer', 'teknoloji_ekipman',
  'ikinci_el', 'mesleki_arac', 'firsat', 'duyuru',
]);
export const jobStatusEnum = pgEnum('job_status', ['draft', 'published', 'closed']);

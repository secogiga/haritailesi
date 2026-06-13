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
  'partner',
  'viewer',
  'finance',
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

export const feedbackTypeEnum = pgEnum('feedback_type', ['talep', 'gorus', 'hikaye', 'reklam']);
export const feedbackSourceEnum = pgEnum('feedback_source', ['sahne', 'mutfak', 'web']);
export const feedbackStatusEnum = pgEnum('feedback_status', [
  'open', 'reviewing', 'awaiting_info', 'in_progress', 'mentoring',
  'expert_review', 'partner_referred', 'offer_pending', 'education_suggested', 'gpt_responded',
  'suggested', 'resolved', 'archived',
]);

export const mentorApplicationTypeEnum = pgEnum('mentor_application_type', ['mentor', 'mentee']);
export const mentorApplicationStatusEnum = pgEnum('mentor_application_status', [
  'pending', 'reviewing', 'matched', 'rejected',
]);

// ─── Donation ─────────────────────────────────────────────────────────────────

export const donationTypeEnum = pgEnum('donation_type', [
  'one_time', 'recurring', 'waived_membership', 'sponsorship', 'event_payment',
]);
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

// ─── Application Payment Status ───────────────────────────────────────────────
// Lifecycle state'ten (waiting_payment, waiting_verification) bağımsız ödeme durumu.
// pending              — ödeme bekleniyor
// reminded             — en az bir hatırlatma gönderildi
// waiting_verification — dekont/ödeme belgesi yüklendi, admin onayı bekleniyor
// expired              — son tarih geçti
// verified             — ödeme doğrulandı
// failed               — ödeme başarısız / iade
// waived               — ödeme silindi (burs, özel durum)
export const applicationPaymentStatusEnum = pgEnum('application_payment_status', [
  'pending', 'reminded', 'waiting_verification', 'expired', 'verified', 'failed', 'waived',
]);

// ─── Content Request ──────────────────────────────────────────────────────────

export const contentRequestTypeEnum = pgEnum('content_request_type', [
  'magaza', 'etkinlik', 'egitim', 'ilan', 'sponsorluk',
]);
export const contentRequestStatusEnum = pgEnum('content_request_status', [
  'pending', 'approved', 'rejected',
]);

// ─── Store ────────────────────────────────────────────────────────────────────

export const storeSellerStatusEnum = pgEnum('store_seller_status', [
  'pending', 'approved', 'rejected', 'suspended',
]);
export const storeSellerTypeEnum = pgEnum('store_seller_type', ['bireysel', 'kurumsal']);
export const storeSellerSourceEnum = pgEnum('store_seller_source', ['sahne', 'mutfak']);

export const storeProductTypeEnum = pgEnum('store_product_type', ['digital', 'physical', 'app']);
export const storeProductOwnerEnum = pgEnum('store_product_owner', ['vakif', 'seller']);
export const storeProductStatusEnum = pgEnum('store_product_status', ['draft', 'active', 'paused', 'archived']);

export const storePaymentStatusEnum = pgEnum('store_payment_status', [
  'pending', 'paid', 'failed', 'refunded',
]);
export const storeOrderStatusEnum = pgEnum('store_order_status', [
  'pending', 'processing', 'partially_shipped', 'shipped', 'delivered', 'cancelled', 'refunded',
]);
export const storeItemShippingStatusEnum = pgEnum('store_item_shipping_status', [
  'pending', 'preparing', 'shipped', 'delivered',
]);
export const storeCouponTypeEnum = pgEnum('store_coupon_type', ['percentage', 'fixed']);
export const storeProductSourceEnum = pgEnum('store_product_source', ['sahne', 'mutfak']);
export const storeSubscriptionIntervalEnum = pgEnum('store_subscription_interval', ['monthly', 'quarterly', 'yearly']);
export const storeSubscriptionStatusEnum = pgEnum('store_subscription_status', ['active', 'paused', 'cancelled', 'past_due']);
export const storeReturnStatusEnum = pgEnum('store_return_status', ['pending', 'approved', 'rejected', 'completed']);
export const storePayoutStatusEnum = pgEnum('store_payout_status', ['held', 'released', 'disputed', 'cancelled']);
export const storeSellerPayoutStatusEnum = pgEnum('store_seller_payout_status', ['pending', 'paid', 'cancelled']);
export const storeInvoiceStatusEnum = pgEnum('store_invoice_status', ['draft', 'sent', 'failed', 'cancelled']);
export const storeInvoiceTypeEnum = pgEnum('store_invoice_type', ['e_arsiv', 'e_fatura']);

// ─── Job Listing ──────────────────────────────────────────────────────────────

export const jobTypeEnum = pgEnum('job_type', [
  'full_time', 'part_time', 'freelance', 'internship',
  'satilik', 'kiralik', 'aranan', 'hizmet', 'isbirligi', 'diger',
  'proje', 'teknik_destek', 'freelancer', 'teknoloji_ekipman',
  'ikinci_el', 'mesleki_arac', 'firsat', 'duyuru',
]);
export const jobStatusEnum = pgEnum('job_status', ['draft', 'published', 'closed']);

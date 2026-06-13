"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobStatusEnum = exports.jobTypeEnum = exports.storeInvoiceTypeEnum = exports.storeInvoiceStatusEnum = exports.storeSellerPayoutStatusEnum = exports.storePayoutStatusEnum = exports.storeReturnStatusEnum = exports.storeSubscriptionStatusEnum = exports.storeSubscriptionIntervalEnum = exports.storeProductSourceEnum = exports.storeCouponTypeEnum = exports.storeItemShippingStatusEnum = exports.storeOrderStatusEnum = exports.storePaymentStatusEnum = exports.storeProductStatusEnum = exports.storeProductOwnerEnum = exports.storeProductTypeEnum = exports.storeSellerSourceEnum = exports.storeSellerTypeEnum = exports.storeSellerStatusEnum = exports.contentRequestStatusEnum = exports.contentRequestTypeEnum = exports.applicationPaymentStatusEnum = exports.membershipSubStatusEnum = exports.paymentAccountEnum = exports.donationStatusEnum = exports.donationMethodEnum = exports.donationTypeEnum = exports.mentorApplicationStatusEnum = exports.mentorApplicationTypeEnum = exports.feedbackStatusEnum = exports.feedbackSourceEnum = exports.feedbackTypeEnum = exports.projectStatusEnum = exports.eventTypeEnum = exports.postStatusEnum = exports.postCategoryEnum = exports.postTypeEnum = exports.applicationTypeEnum = exports.verificationStatusEnum = exports.userStatusEnum = exports.functionalRoleEnum = exports.membershipTierEnum = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
// ─── Membership Tier ───────────────────────────────────────────────────────────
exports.membershipTierEnum = (0, pg_core_1.pgEnum)('membership_tier', [
    'visitor',
    'registered_user',
    'haritailesi_genc',
    'new_graduate_member',
    'individual_member',
    'corporate_member',
]);
// ─── Functional Role ───────────────────────────────────────────────────────────
exports.functionalRoleEnum = (0, pg_core_1.pgEnum)('functional_role', [
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
exports.userStatusEnum = (0, pg_core_1.pgEnum)('user_status', [
    'pending',
    'active',
    'passive',
    'suspended',
    'deleted',
]);
// ─── Verification Status ───────────────────────────────────────────────────────
exports.verificationStatusEnum = (0, pg_core_1.pgEnum)('verification_status', [
    'unverified',
    'verification_requested',
    'verification_submitted',
    'verified',
    'verification_rejected',
]);
// ─── Application Type ──────────────────────────────────────────────────────────
exports.applicationTypeEnum = (0, pg_core_1.pgEnum)('application_type', [
    'individual',
    'corporate',
    'meslegin_gelecekleri',
    'haritailesi_genc',
]);
// ─── Post Type ─────────────────────────────────────────────────────────────────
exports.postTypeEnum = (0, pg_core_1.pgEnum)('post_type', [
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
exports.postCategoryEnum = (0, pg_core_1.pgEnum)('post_category', [
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
exports.postStatusEnum = (0, pg_core_1.pgEnum)('post_status', [
    'draft',
    'pending_review',
    'published',
    'hidden',
    'deleted',
]);
// ─── Event Type ────────────────────────────────────────────────────────────────
exports.eventTypeEnum = (0, pg_core_1.pgEnum)('event_type', [
    'kongre',
    'networking',
    'odul',
    'diger',
]);
// ─── Project Status ────────────────────────────────────────────────────────────
exports.projectStatusEnum = (0, pg_core_1.pgEnum)('project_status', [
    'active',
    'completed',
    'archived',
]);
// ─── Feedback / Community ──────────────────────────────────────────────────────
exports.feedbackTypeEnum = (0, pg_core_1.pgEnum)('feedback_type', ['talep', 'gorus', 'hikaye', 'reklam']);
exports.feedbackSourceEnum = (0, pg_core_1.pgEnum)('feedback_source', ['sahne', 'mutfak', 'web']);
exports.feedbackStatusEnum = (0, pg_core_1.pgEnum)('feedback_status', [
    'open', 'reviewing', 'awaiting_info', 'in_progress', 'mentoring',
    'expert_review', 'partner_referred', 'offer_pending', 'education_suggested', 'gpt_responded',
    'suggested', 'resolved', 'archived',
]);
exports.mentorApplicationTypeEnum = (0, pg_core_1.pgEnum)('mentor_application_type', ['mentor', 'mentee']);
exports.mentorApplicationStatusEnum = (0, pg_core_1.pgEnum)('mentor_application_status', [
    'pending', 'reviewing', 'matched', 'rejected',
]);
// ─── Donation ─────────────────────────────────────────────────────────────────
exports.donationTypeEnum = (0, pg_core_1.pgEnum)('donation_type', [
    'one_time', 'recurring', 'waived_membership', 'sponsorship', 'event_payment',
]);
exports.donationMethodEnum = (0, pg_core_1.pgEnum)('donation_method', ['bank_transfer', 'iyzico']);
exports.donationStatusEnum = (0, pg_core_1.pgEnum)('donation_status', [
    'pending', 'completed', 'failed', 'refunded',
]);
// ─── Payment Account ──────────────────────────────────────────────────────────
// vakif = Haritailesi Vakfı (bağış + üyelik)
// sirket = Haritailesiş Teknoloji ve Ticaret Ltd. Şti. (etkinlik/eğitim/mağaza)
exports.paymentAccountEnum = (0, pg_core_1.pgEnum)('payment_account', ['vakif', 'sirket']);
// ─── Membership Subscription ──────────────────────────────────────────────────
exports.membershipSubStatusEnum = (0, pg_core_1.pgEnum)('membership_sub_status', [
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
exports.applicationPaymentStatusEnum = (0, pg_core_1.pgEnum)('application_payment_status', [
    'pending', 'reminded', 'waiting_verification', 'expired', 'verified', 'failed', 'waived',
]);
// ─── Content Request ──────────────────────────────────────────────────────────
exports.contentRequestTypeEnum = (0, pg_core_1.pgEnum)('content_request_type', [
    'magaza', 'etkinlik', 'egitim', 'ilan', 'sponsorluk',
]);
exports.contentRequestStatusEnum = (0, pg_core_1.pgEnum)('content_request_status', [
    'pending', 'approved', 'rejected',
]);
// ─── Store ────────────────────────────────────────────────────────────────────
exports.storeSellerStatusEnum = (0, pg_core_1.pgEnum)('store_seller_status', [
    'pending', 'approved', 'rejected', 'suspended',
]);
exports.storeSellerTypeEnum = (0, pg_core_1.pgEnum)('store_seller_type', ['bireysel', 'kurumsal']);
exports.storeSellerSourceEnum = (0, pg_core_1.pgEnum)('store_seller_source', ['sahne', 'mutfak']);
exports.storeProductTypeEnum = (0, pg_core_1.pgEnum)('store_product_type', ['digital', 'physical', 'app']);
exports.storeProductOwnerEnum = (0, pg_core_1.pgEnum)('store_product_owner', ['vakif', 'seller']);
exports.storeProductStatusEnum = (0, pg_core_1.pgEnum)('store_product_status', ['draft', 'active', 'paused', 'archived']);
exports.storePaymentStatusEnum = (0, pg_core_1.pgEnum)('store_payment_status', [
    'pending', 'paid', 'failed', 'refunded',
]);
exports.storeOrderStatusEnum = (0, pg_core_1.pgEnum)('store_order_status', [
    'pending', 'processing', 'partially_shipped', 'shipped', 'delivered', 'cancelled', 'refunded',
]);
exports.storeItemShippingStatusEnum = (0, pg_core_1.pgEnum)('store_item_shipping_status', [
    'pending', 'preparing', 'shipped', 'delivered',
]);
exports.storeCouponTypeEnum = (0, pg_core_1.pgEnum)('store_coupon_type', ['percentage', 'fixed']);
exports.storeProductSourceEnum = (0, pg_core_1.pgEnum)('store_product_source', ['sahne', 'mutfak']);
exports.storeSubscriptionIntervalEnum = (0, pg_core_1.pgEnum)('store_subscription_interval', ['monthly', 'quarterly', 'yearly']);
exports.storeSubscriptionStatusEnum = (0, pg_core_1.pgEnum)('store_subscription_status', ['active', 'paused', 'cancelled', 'past_due']);
exports.storeReturnStatusEnum = (0, pg_core_1.pgEnum)('store_return_status', ['pending', 'approved', 'rejected', 'completed']);
exports.storePayoutStatusEnum = (0, pg_core_1.pgEnum)('store_payout_status', ['held', 'released', 'disputed', 'cancelled']);
exports.storeSellerPayoutStatusEnum = (0, pg_core_1.pgEnum)('store_seller_payout_status', ['pending', 'paid', 'cancelled']);
exports.storeInvoiceStatusEnum = (0, pg_core_1.pgEnum)('store_invoice_status', ['draft', 'sent', 'failed', 'cancelled']);
exports.storeInvoiceTypeEnum = (0, pg_core_1.pgEnum)('store_invoice_type', ['e_arsiv', 'e_fatura']);
// ─── Job Listing ──────────────────────────────────────────────────────────────
exports.jobTypeEnum = (0, pg_core_1.pgEnum)('job_type', [
    'full_time', 'part_time', 'freelance', 'internship',
    'satilik', 'kiralik', 'aranan', 'hizmet', 'isbirligi', 'diger',
    'proje', 'teknik_destek', 'freelancer', 'teknoloji_ekipman',
    'ikinci_el', 'mesleki_arac', 'firsat', 'duyuru',
]);
exports.jobStatusEnum = (0, pg_core_1.pgEnum)('job_status', ['draft', 'published', 'closed']);

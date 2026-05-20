import type { Permission } from '../rbac/permissions';
import type { EmailJobName } from '../email/email.types';
import type {
  IndividualApplicationState,
  CorporateApplicationState,
  MesleginGelecekleriState,
  HaritailesiGencState,
  ApplicationType,
} from '@haritailesi/types';

export interface StateTransition {
  from: string;
  to: string;
  requiredPermission: Permission;
  emailTrigger?: EmailJobName;
  push?: { title: string; body: string };
}

// ─── Individual (Bireysel) ─────────────────────────────────────────────────────

const INDIVIDUAL_TRANSITIONS: StateTransition[] = [
  { from: 'submitted',          to: 'under_review',         requiredPermission: 'application.review' },
  { from: 'under_review',       to: 'interview_needed',     requiredPermission: 'application.review',  emailTrigger: 'application_interview_scheduled', push: { title: 'Görüşme Daveti', body: 'Başvurunuz görüşme aşamasına geçti. Detaylar e-postanızda.' } },
  { from: 'under_review',       to: 'approved',             requiredPermission: 'application.approve', emailTrigger: 'application_approved',            push: { title: 'Başvurunuz Onaylandı 🎉', body: 'Haritailesi\'ne kabul edildiniz! Üyeliğinizi tamamlamak için e-postanızı kontrol edin.' } },
  { from: 'under_review',       to: 'rejected',             requiredPermission: 'application.reject',  emailTrigger: 'application_rejected',            push: { title: 'Başvuru Sonucu', body: 'Başvurunuza ilişkin bilgilendirme e-postanıza gönderildi.' } },
  { from: 'interview_needed',   to: 'interview_scheduled',  requiredPermission: 'application.review',  emailTrigger: 'application_interview_scheduled', push: { title: 'Görüşme Planlandı', body: 'Görüşme tarihiniz belirlendi. Detaylar e-postanızda.' } },
  { from: 'interview_scheduled', to: 'approved',            requiredPermission: 'application.approve', emailTrigger: 'application_approved',            push: { title: 'Başvurunuz Onaylandı 🎉', body: 'Haritailesi\'ne kabul edildiniz!' } },
  { from: 'interview_scheduled', to: 'rejected',            requiredPermission: 'application.reject',  emailTrigger: 'application_rejected',            push: { title: 'Başvuru Sonucu', body: 'Başvurunuza ilişkin bilgilendirme e-postanıza gönderildi.' } },
  { from: 'approved',           to: 'waiting_payment',      requiredPermission: 'application.approve', emailTrigger: 'payment_reminder',                push: { title: 'Ödeme Adımı', body: 'Üyeliğinizi tamamlamak için ödeme bilgilerini e-postanızdan iletebilirsiniz.' } },
  { from: 'waiting_payment',    to: 'waiting_verification', requiredPermission: 'application.approve', emailTrigger: 'payment_confirmed',               push: { title: 'Ödeme Alındı', body: 'Ödemeniz alındı, belge doğrulaması bekleniyor.' } },
  { from: 'waiting_verification', to: 'active',             requiredPermission: 'application.approve' },
  { from: 'active',             to: 'passive',              requiredPermission: 'user.manage',         emailTrigger: 'membership_paused',               push: { title: 'Üyelik Pasif', body: 'Üyeliğiniz geçici olarak pasif duruma alındı.' } },
  { from: 'passive',            to: 'active',               requiredPermission: 'user.manage',         emailTrigger: 'membership_reactivated',          push: { title: 'Üyelik Aktif', body: 'Üyeliğiniz yeniden aktif edildi. Haritailesi\'ne hoş geldiniz!' } },
];

// ─── Corporate (Kurumsal) ──────────────────────────────────────────────────────

const CORPORATE_TRANSITIONS: StateTransition[] = [
  { from: 'submitted',          to: 'under_review',         requiredPermission: 'application.review' },
  { from: 'under_review',       to: 'interview_needed',     requiredPermission: 'application.review',  emailTrigger: 'application_interview_scheduled', push: { title: 'Görüşme Daveti', body: 'Kurumsal başvurunuz görüşme aşamasına geçti.' } },
  { from: 'under_review',       to: 'approved',             requiredPermission: 'application.approve', emailTrigger: 'application_approved',            push: { title: 'Başvurunuz Onaylandı 🎉', body: 'Kurumsal üyelik başvurunuz kabul edildi!' } },
  { from: 'under_review',       to: 'rejected',             requiredPermission: 'application.reject',  emailTrigger: 'application_rejected',            push: { title: 'Başvuru Sonucu', body: 'Başvurunuza ilişkin bilgilendirme e-postanıza gönderildi.' } },
  { from: 'interview_needed',   to: 'approved',             requiredPermission: 'application.approve', emailTrigger: 'application_approved',            push: { title: 'Başvurunuz Onaylandı 🎉', body: 'Kurumsal üyelik başvurunuz kabul edildi!' } },
  { from: 'interview_needed',   to: 'rejected',             requiredPermission: 'application.reject',  emailTrigger: 'application_rejected',            push: { title: 'Başvuru Sonucu', body: 'Başvurunuza ilişkin bilgilendirme e-postanıza gönderildi.' } },
  { from: 'approved',           to: 'waiting_payment',      requiredPermission: 'application.approve', emailTrigger: 'payment_reminder',                push: { title: 'Ödeme Adımı', body: 'Üyeliğinizi tamamlamak için ödeme bilgilerini e-postanızdan iletebilirsiniz.' } },
  { from: 'waiting_payment',    to: 'waiting_verification', requiredPermission: 'application.approve', emailTrigger: 'payment_confirmed',               push: { title: 'Ödeme Alındı', body: 'Ödemeniz alındı, belge doğrulaması bekleniyor.' } },
  { from: 'waiting_verification', to: 'verified',           requiredPermission: 'verification.review', emailTrigger: 'verification_approved' },
  { from: 'verified',           to: 'active',               requiredPermission: 'application.approve' },
  { from: 'active',             to: 'passive',              requiredPermission: 'user.manage',         emailTrigger: 'membership_paused',               push: { title: 'Üyelik Pasif', body: 'Üyeliğiniz geçici olarak pasif duruma alındı.' } },
  { from: 'passive',            to: 'active',               requiredPermission: 'user.manage',         emailTrigger: 'membership_reactivated',          push: { title: 'Üyelik Aktif', body: 'Üyeliğiniz yeniden aktif edildi.' } },
];

// ─── Mesleğin Gelecekleri ──────────────────────────────────────────────────────

const MG_TRANSITIONS: StateTransition[] = [
  { from: 'submitted',                  to: 'under_review',               requiredPermission: 'application.review' },
  { from: 'under_review',              to: 'shortlisted',                 requiredPermission: 'application.review',  push: { title: 'Ön Elemeyi Geçtiniz!', body: 'Mesleğin Gelecekleri programında ön elemeyi geçtiniz.' } },
  { from: 'under_review',              to: 'rejected',                    requiredPermission: 'application.reject',  emailTrigger: 'application_rejected', push: { title: 'Başvuru Sonucu', body: 'Başvurunuza ilişkin bilgilendirme e-postanıza gönderildi.' } },
  { from: 'shortlisted',               to: 'interview_needed',            requiredPermission: 'application.review',  emailTrigger: 'application_interview_scheduled', push: { title: 'Mülakat Daveti', body: 'Mesleğin Gelecekleri için mülakat aşamasındasınız!' } },
  { from: 'shortlisted',               to: 'rejected',                    requiredPermission: 'application.reject',  emailTrigger: 'application_rejected', push: { title: 'Başvuru Sonucu', body: 'Başvurunuza ilişkin bilgilendirme e-postanıza gönderildi.' } },
  { from: 'interview_needed',          to: 'interview_completed',         requiredPermission: 'application.review' },
  { from: 'interview_completed',       to: 'accepted',                    requiredPermission: 'application.approve', emailTrigger: 'application_approved', push: { title: 'Kabul Edildiniz! 🎉', body: 'Mesleğin Gelecekleri programına kabul edildiniz!' } },
  { from: 'interview_completed',       to: 'waitlisted',                  requiredPermission: 'application.review',  push: { title: 'Yedek Listede', body: 'Şu an yedek listedesiniz, yer açıldığında bilgilendirileceksiniz.' } },
  { from: 'interview_completed',       to: 'rejected',                    requiredPermission: 'application.reject',  emailTrigger: 'application_rejected', push: { title: 'Başvuru Sonucu', body: 'Başvurunuza ilişkin bilgilendirme e-postanıza gönderildi.' } },
  { from: 'waitlisted',                to: 'accepted',                    requiredPermission: 'application.approve', emailTrigger: 'application_approved', push: { title: 'Kabul Edildiniz! 🎉', body: 'Yedek listeden programa alındınız!' } },
  { from: 'accepted',                  to: 'waiting_student_verification', requiredPermission: 'application.approve', push: { title: 'Öğrenci Belgesi', body: 'Kayıt için öğrenci belgenizi sisteme yüklemeniz gerekiyor.' } },
  { from: 'waiting_student_verification', to: 'active_program_member',   requiredPermission: 'application.approve', push: { title: 'Program Üyeliği Aktif', body: 'Mesleğin Gelecekleri programı üyeliğiniz aktif oldu!' } },
  { from: 'active_program_member',     to: 'program_completed',           requiredPermission: 'application.approve', push: { title: 'Program Tamamlandı', body: 'Mesleğin Gelecekleri programını başarıyla tamamladınız.' } },
];

// ─── Haritailesi Genç ──────────────────────────────────────────────────────────
// Ödeme adımı yok — basit onay akışı

const GENC_TRANSITIONS: StateTransition[] = [
  { from: 'submitted',  to: 'under_review', requiredPermission: 'application.review' },
  { from: 'under_review', to: 'approved',   requiredPermission: 'application.approve', emailTrigger: 'application_approved',   push: { title: 'Başvurunuz Onaylandı 🎉', body: 'Haritailesi Genç üyeliğiniz onaylandı! Hesabınızı oluşturmak için e-postanızı kontrol edin.' } },
  { from: 'under_review', to: 'rejected',   requiredPermission: 'application.reject',  emailTrigger: 'application_rejected',   push: { title: 'Başvuru Sonucu', body: 'Başvurunuza ilişkin bilgilendirme e-postanıza gönderildi.' } },
  { from: 'approved',   to: 'active',       requiredPermission: 'application.approve' },
  { from: 'active',     to: 'passive',      requiredPermission: 'user.manage',         emailTrigger: 'membership_paused',      push: { title: 'Üyelik Pasif', body: 'Üyeliğiniz geçici olarak pasif duruma alındı.' } },
  { from: 'passive',    to: 'active',       requiredPermission: 'user.manage',         emailTrigger: 'membership_reactivated', push: { title: 'Üyelik Aktif', body: 'Üyeliğiniz yeniden aktif edildi.' } },
];

// ─── Transition Map ────────────────────────────────────────────────────────────

const TRANSITIONS: Record<ApplicationType, StateTransition[]> = {
  individual: INDIVIDUAL_TRANSITIONS,
  corporate: CORPORATE_TRANSITIONS,
  meslegin_gelecekleri: MG_TRANSITIONS,
  haritailesi_genc: GENC_TRANSITIONS,
};

export function getTransition(
  type: ApplicationType,
  fromState: string,
  toState: string,
): StateTransition | null {
  const transitions = TRANSITIONS[type] ?? [];
  return (
    transitions.find((t) => t.from === fromState && t.to === toState) ?? null
  );
}

export function getValidNextStates(type: ApplicationType, currentState: string): string[] {
  const transitions = TRANSITIONS[type] ?? [];
  return transitions.filter((t) => t.from === currentState).map((t) => t.to);
}

// Terminal states — başvuru bu durumda kalıcı olarak sonlanır
export const TERMINAL_STATES = new Set<string>([
  'rejected',
  'program_completed',
]);

// States mapped to membership tiers for auto-upgrade
export type IndividualFinalState = Extract<IndividualApplicationState, 'active' | 'passive'>;
export type CorporateFinalState = Extract<CorporateApplicationState, 'active' | 'passive'>;
export type MgFinalState = Extract<MesleginGelecekleriState, 'active_program_member'>;
export type GencFinalState = Extract<HaritailesiGencState, 'active' | 'passive'>;

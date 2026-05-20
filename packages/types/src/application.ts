// ─── Individual Application ────────────────────────────────────────────────────

export type IndividualApplicationState =
  | 'submitted'
  | 'under_review'
  | 'interview_needed'
  | 'interview_scheduled'
  | 'approved'
  | 'waiting_payment'
  | 'waiting_verification'
  | 'active'
  | 'passive'
  | 'rejected';

// ─── Corporate Application ─────────────────────────────────────────────────────

export type CorporateApplicationState =
  | 'submitted'
  | 'under_review'
  | 'interview_needed'
  | 'approved'
  | 'waiting_payment'
  | 'waiting_verification'
  | 'verified'
  | 'active'
  | 'rejected'
  | 'passive';

// ─── Mesleğin Gelecekleri Application ─────────────────────────────────────────

export type MesleginGelecekleriState =
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'interview_needed'
  | 'interview_completed'
  | 'accepted'
  | 'waitlisted'
  | 'rejected'
  | 'waiting_student_verification'
  | 'active_program_member'
  | 'program_completed';

// ─── Haritailesi Genç Application ─────────────────────────────────────────────
// Ödeme adımı yok — submitted → under_review → approved → active

export type HaritailesiGencState =
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'active'
  | 'rejected'
  | 'passive';

// ─── Application Type ──────────────────────────────────────────────────────────

export type ApplicationType = 'individual' | 'corporate' | 'meslegin_gelecekleri' | 'haritailesi_genc';

export interface ApplicationBase {
  id: string;
  type: ApplicationType;
  applicant_email: string;
  form_data: Record<string, unknown>;
  state: string;
  created_at: string;
  updated_at: string;
}

export interface IndividualApplication extends ApplicationBase {
  type: 'individual';
  state: IndividualApplicationState;
}

export interface CorporateApplication extends ApplicationBase {
  type: 'corporate';
  state: CorporateApplicationState;
}

export interface MesleginGelecekleriApplication extends ApplicationBase {
  type: 'meslegin_gelecekleri';
  state: MesleginGelecekleriState;
}

export interface HaritailesiGencApplication extends ApplicationBase {
  type: 'haritailesi_genc';
  state: HaritailesiGencState;
}

export type Application =
  | IndividualApplication
  | CorporateApplication
  | MesleginGelecekleriApplication
  | HaritailesiGencApplication;

// ─── Membership Tiers (exclusive, hierarchical) ───────────────────────────────

export type MembershipTier =
  | 'visitor'
  | 'registered_user'
  | 'haritailesi_genc'
  | 'new_graduate_member'
  | 'individual_member'
  | 'corporate_member';

// ─── Functional Roles (additive) ──────────────────────────────────────────────

export type FunctionalRole =
  | 'mentor'
  | 'moderator'
  | 'editor'
  | 'meslegin_gelecekleri_participant'
  | 'corporate_rep'
  | 'admin'
  | 'super_admin';

// ─── User Status ───────────────────────────────────────────────────────────────

export type UserStatus = 'pending' | 'active' | 'passive' | 'suspended' | 'deleted';

// ─── Verification Status ───────────────────────────────────────────────────────

export type VerificationStatus =
  | 'unverified'
  | 'verification_requested'
  | 'verification_submitted'
  | 'verified'
  | 'verification_rejected';

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  membership_tier: MembershipTier;
  functional_roles: FunctionalRole[];
  status: UserStatus;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  profession: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  portfolio_url: string | null;
  skill_tags: string[];
}

// ─── Follow ───────────────────────────────────────────────────────────────────

export interface UserFollow {
  id: string;
  follower_id: string;
  followee_id: string;
  created_at: string;
}

// ─── Badge ────────────────────────────────────────────────────────────────────

export type BadgeType =
  | 'founding_member'
  | 'mentor_star'
  | 'connector'
  | 'contributor'
  | 'verified';

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  awarded_at: string;
  awarded_by: string | null;
}

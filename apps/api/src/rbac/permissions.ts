import type { MembershipTier, FunctionalRole } from '@haritailesi/types';

// ─── Permission Definition ─────────────────────────────────────────────────────
// Format: 'resource.action'

export type Permission =
  // Feed
  | 'feed.read'
  | 'feed.post.create'
  | 'feed.post.delete_own'
  | 'feed.post.delete_any'
  | 'feed.post.pin'
  | 'feed.comment.create'
  | 'feed.comment.delete_own'
  | 'feed.comment.delete_any'
  | 'feed.react'
  // Applications
  | 'application.submit'
  | 'application.review'
  | 'application.approve'
  | 'application.reject'
  // Users
  | 'user.profile.read'
  | 'user.profile.update_own'
  | 'user.manage'
  | 'user.roles.manage'
  | 'user.delete'
  // Verification
  | 'verification.submit'
  | 'verification.review'
  // Mentorship
  | 'mentor.request'
  | 'mentor.manage'
  | 'mentor.accept'
  // Content
  | 'content.read'
  | 'content.create'
  | 'content.publish'
  | 'content.delete_any'
  // Admin
  | 'admin.dashboard.read'
  | 'admin.settings.manage'
  | 'audit.read';

// ─── Tier Permissions ─────────────────────────────────────────────────────────
// Membership tier'ına göre temel izinler. Functional roller bunun üstüne eklenir.

const TIER_PERMISSIONS: Record<MembershipTier, Permission[]> = {
  visitor: [],
  registered_user: ['application.submit', 'user.profile.read'],
  haritailesi_genc: [
    'application.submit',
    'user.profile.read',
    'user.profile.update_own',
    'verification.submit',
    'mentor.request',
    'content.read',
  ],
  new_graduate_member: [
    'application.submit',
    'user.profile.read',
    'user.profile.update_own',
    'verification.submit',
    'mentor.request',
    'content.read',
    'feed.read',
    'feed.post.create',
    'feed.post.delete_own',
    'feed.comment.create',
    'feed.comment.delete_own',
    'feed.react',
  ],
  individual_member: [
    'application.submit',
    'user.profile.read',
    'user.profile.update_own',
    'verification.submit',
    'mentor.request',
    'mentor.accept',
    'content.read',
    'content.create',
    'feed.read',
    'feed.post.create',
    'feed.post.delete_own',
    'feed.comment.create',
    'feed.comment.delete_own',
    'feed.react',
  ],
  corporate_member: [
    'user.profile.read',
    'user.profile.update_own',
    'verification.submit',
    'content.read',
  ],
};

// ─── Functional Role Permissions ──────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<FunctionalRole, Permission[]> = {
  mentor: ['mentor.accept', 'mentor.manage'],
  moderator: [
    'feed.post.delete_any',
    'feed.comment.delete_any',
    'feed.post.pin',
    'user.manage',
  ],
  editor: ['content.create', 'content.publish', 'content.delete_any'],
  meslegin_gelecekleri_participant: [],
  corporate_rep: [],
  admin: [
    'feed.post.delete_any',
    'feed.comment.delete_any',
    'feed.post.pin',
    'application.review',
    'application.approve',
    'application.reject',
    'user.manage',
    'user.roles.manage',
    'verification.review',
    'content.publish',
    'content.delete_any',
    'mentor.manage',
    'admin.dashboard.read',
    'audit.read',
  ],
  super_admin: [
    'feed.post.delete_any',
    'feed.comment.delete_any',
    'feed.post.pin',
    'application.review',
    'application.approve',
    'application.reject',
    'user.manage',
    'user.roles.manage',
    'user.delete',
    'verification.review',
    'content.publish',
    'content.delete_any',
    'mentor.manage',
    'admin.dashboard.read',
    'admin.settings.manage',
    'audit.read',
  ],
};

// ─── Permission Checker ────────────────────────────────────────────────────────

export function can(
  user: { membershipTier: MembershipTier; functionalRoles: FunctionalRole[] },
  permission: Permission,
): boolean {
  const tierPerms = TIER_PERMISSIONS[user.membershipTier] ?? [];
  if (tierPerms.includes(permission)) return true;

  for (const role of user.functionalRoles) {
    const rolePerms = ROLE_PERMISSIONS[role] ?? [];
    if (rolePerms.includes(permission)) return true;
  }

  return false;
}

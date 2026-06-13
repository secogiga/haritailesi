import type { MembershipTier, FunctionalRole } from '@haritailesi/types';
import { Perm, ROLE_PERMISSIONS, getUserPermissions, hasPermission } from '@haritailesi/permissions';

// Re-export everything the rest of the API needs
export { Perm, ROLE_PERMISSIONS, getUserPermissions, hasPermission };
export type { Permission } from '@haritailesi/permissions';

import type { Permission } from '@haritailesi/permissions';

// ─── Tier Permissions (API-only — not shared with frontend) ───────────────────

const TIER_PERMISSIONS: Record<MembershipTier, Permission[]> = {
  visitor: [],
  registered_user: [Perm.APPLICATION_SUBMIT, Perm.USER_PROFILE_READ],
  haritailesi_genc: [
    Perm.APPLICATION_SUBMIT, Perm.USER_PROFILE_READ, Perm.USER_PROFILE_UPDATE_OWN,
    Perm.VERIFICATION_SUBMIT, Perm.MENTOR_REQUEST, Perm.CONTENT_READ,
  ],
  new_graduate_member: [
    Perm.APPLICATION_SUBMIT, Perm.USER_PROFILE_READ, Perm.USER_PROFILE_UPDATE_OWN,
    Perm.VERIFICATION_SUBMIT, Perm.MENTOR_REQUEST, Perm.CONTENT_READ,
    Perm.FEED_READ, Perm.FEED_POST_CREATE, Perm.FEED_POST_DELETE_OWN,
    Perm.FEED_COMMENT_CREATE, Perm.FEED_COMMENT_DELETE_OWN, Perm.FEED_REACT,
  ],
  individual_member: [
    Perm.APPLICATION_SUBMIT, Perm.USER_PROFILE_READ, Perm.USER_PROFILE_UPDATE_OWN,
    Perm.VERIFICATION_SUBMIT, Perm.MENTOR_REQUEST, Perm.MENTOR_ACCEPT,
    Perm.CONTENT_READ, Perm.CONTENT_CREATE,
    Perm.FEED_READ, Perm.FEED_POST_CREATE, Perm.FEED_POST_DELETE_OWN,
    Perm.FEED_COMMENT_CREATE, Perm.FEED_COMMENT_DELETE_OWN, Perm.FEED_REACT,
  ],
  corporate_member: [
    Perm.USER_PROFILE_READ, Perm.USER_PROFILE_UPDATE_OWN,
    Perm.VERIFICATION_SUBMIT, Perm.CONTENT_READ,
  ],
};

// ─── Permission Checker ────────────────────────────────────────────────────────
// Checks membership tier permissions first, then functional role permissions.
// resource param reserved for future resource-aware (ABAC) checks.

export function can(
  user: { membershipTier: MembershipTier; functionalRoles: FunctionalRole[] },
  permission: Permission,
  _resource?: unknown,
): boolean {
  const tierPerms = TIER_PERMISSIONS[user.membershipTier] ?? [];
  if (tierPerms.includes(permission)) return true;
  return hasPermission(user.functionalRoles, permission);
}

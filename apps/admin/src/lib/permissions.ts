// Single source of truth — all permission logic lives in @haritailesi/permissions.
export { Perm, ROLE_PERMISSIONS, getUserPermissions, hasPermission, PERMISSION_LABEL } from '@haritailesi/permissions';
export type { Permission } from '@haritailesi/permissions';

// AdminPermission is an alias for Permission — kept for backwards compatibility
// with existing component code. Prefer importing Permission directly.
export type { Permission as AdminPermission } from '@haritailesi/permissions';

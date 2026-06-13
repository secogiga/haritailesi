import type { FunctionalRole } from '@haritailesi/types';

// ─── Permission Constants ──────────────────────────────────────────────────────
// Single source of truth for both API and admin UI.
// Format: 'domain.action' — import Perm.X constants instead of string literals.

export const Perm = {
  // ── Feed ──────────────────────────────────────────────────────────────────────
  FEED_READ:                'feed.read',
  FEED_POST_CREATE:         'feed.post.create',
  FEED_POST_DELETE_OWN:     'feed.post.delete_own',
  FEED_POST_DELETE_ANY:     'feed.post.delete_any',
  FEED_POST_PIN:            'feed.post.pin',
  FEED_COMMENT_CREATE:      'feed.comment.create',
  FEED_COMMENT_DELETE_OWN:  'feed.comment.delete_own',
  FEED_COMMENT_DELETE_ANY:  'feed.comment.delete_any',
  FEED_REACT:               'feed.react',
  // ── Application ───────────────────────────────────────────────────────────────
  APPLICATION_SUBMIT:       'application.submit',
  APPLICATION_VIEW:         'application.view',
  APPLICATION_REVIEW:       'application.review',
  APPLICATION_APPROVE:      'application.approve',
  APPLICATION_REJECT:       'application.reject',
  APPLICATION_NOTES_VIEW:   'application.notes.view',
  APPLICATION_NOTES_EDIT:   'application.notes.edit',
  APPLICATION_DELETE:       'application.delete',
  // ── Interview ─────────────────────────────────────────────────────────────────
  INTERVIEW_SCHEDULE:       'interview.schedule',
  // ── Payment ───────────────────────────────────────────────────────────────────
  PAYMENT_VIEW:             'payment.view',
  PAYMENT_REQUEST:          'payment.request',
  PAYMENT_REMIND:           'payment.remind',
  PAYMENT_VERIFY:           'payment.verify',
  PAYMENT_WAIVE:            'payment.waive',
  PAYMENT_FAIL:             'payment.fail',
  PAYMENT_REVOKE_WAIVER:    'payment.revoke_waiver',
  PAYMENT_EXTEND_DUE_DATE:  'payment.extend_due_date',
  // ── Donation ──────────────────────────────────────────────────────────────────
  DONATION_VIEW:            'donation.view',
  DONATION_CREATE:          'donation.create',
  DONATION_UPDATE:          'donation.update',
  // ── Member ────────────────────────────────────────────────────────────────────
  MEMBER_VIEW:              'member.view',
  MEMBER_EDIT:              'member.edit',
  MEMBER_ACTIVATE:          'member.activate',
  // ── User management ───────────────────────────────────────────────────────────
  USER_PROFILE_READ:        'user.profile.read',
  USER_PROFILE_UPDATE_OWN:  'user.profile.update_own',
  USER_MANAGE:              'user.manage',
  USER_ROLES_MANAGE:        'user.roles.manage',
  USER_DELETE:              'user.delete',
  // ── Verification ──────────────────────────────────────────────────────────────
  VERIFICATION_SUBMIT:      'verification.submit',
  VERIFICATION_REVIEW:      'verification.review',
  // ── Mentorship ────────────────────────────────────────────────────────────────
  MENTOR_REQUEST:           'mentor.request',
  MENTOR_MANAGE:            'mentor.manage',
  MENTOR_ACCEPT:            'mentor.accept',
  // ── Content ───────────────────────────────────────────────────────────────────
  CONTENT_READ:             'content.read',
  CONTENT_CREATE:           'content.create',
  CONTENT_PUBLISH:          'content.publish',
  CONTENT_DELETE_ANY:       'content.delete_any',
  // ── Admin ─────────────────────────────────────────────────────────────────────
  ADMIN_DASHBOARD_READ:     'admin.dashboard.read',
  ADMIN_SETTINGS_MANAGE:    'admin.settings.manage',
  AUDIT_READ:               'audit.read',
  NEWSLETTER_READ:          'admin.newsletter.read',
  NEWSLETTER_WRITE:         'admin.newsletter.write',
  // ── Partner ───────────────────────────────────────────────────────────────────
  PARTNER_MANAGE:           'partner.manage',
} as const;

export type Permission = typeof Perm[keyof typeof Perm];

// ─── Permission Groups (composition) ─────────────────────────────────────────
// Compose roles from these groups — never copy-paste permission lists.

const APPLICATION_ADMIN_PERMS: Permission[] = [
  Perm.APPLICATION_VIEW, Perm.APPLICATION_REVIEW, Perm.APPLICATION_APPROVE,
  Perm.APPLICATION_REJECT, Perm.APPLICATION_NOTES_VIEW, Perm.APPLICATION_NOTES_EDIT,
  Perm.INTERVIEW_SCHEDULE,
  Perm.PAYMENT_VIEW, Perm.PAYMENT_REQUEST, Perm.PAYMENT_REMIND,
  Perm.MEMBER_VIEW, Perm.DONATION_VIEW,
];

const FINANCE_PERMS: Permission[] = [
  Perm.APPLICATION_VIEW, Perm.APPLICATION_NOTES_VIEW,
  Perm.PAYMENT_VIEW, Perm.PAYMENT_REMIND, Perm.PAYMENT_VERIFY,
  Perm.PAYMENT_WAIVE, Perm.PAYMENT_FAIL, Perm.PAYMENT_REVOKE_WAIVER,
  Perm.PAYMENT_EXTEND_DUE_DATE,
  Perm.DONATION_VIEW, Perm.DONATION_CREATE, Perm.DONATION_UPDATE,
  Perm.MEMBER_VIEW,
];

const VIEWER_PERMS: Permission[] = [
  Perm.APPLICATION_VIEW,
  Perm.MEMBER_VIEW,
];

const ADMIN_PERMS: Permission[] = [
  ...APPLICATION_ADMIN_PERMS,
  Perm.FEED_POST_DELETE_ANY, Perm.FEED_COMMENT_DELETE_ANY, Perm.FEED_POST_PIN,
  Perm.USER_MANAGE, Perm.USER_ROLES_MANAGE,
  Perm.VERIFICATION_REVIEW,
  Perm.CONTENT_PUBLISH, Perm.CONTENT_DELETE_ANY,
  Perm.MENTOR_MANAGE,
  Perm.ADMIN_DASHBOARD_READ, Perm.AUDIT_READ,
  Perm.NEWSLETTER_READ, Perm.NEWSLETTER_WRITE,
];

const SUPER_ADMIN_PERMS: Permission[] = [
  ...ADMIN_PERMS,
  ...FINANCE_PERMS,
  Perm.MEMBER_ACTIVATE, Perm.MEMBER_EDIT,
  Perm.USER_DELETE, Perm.APPLICATION_DELETE,
  Perm.ADMIN_SETTINGS_MANAGE,
];

// ─── Role → Permissions Map ────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<FunctionalRole, Permission[]> = {
  mentor:                          [Perm.MENTOR_ACCEPT, Perm.MENTOR_MANAGE],
  moderator:                       [Perm.FEED_POST_DELETE_ANY, Perm.FEED_COMMENT_DELETE_ANY, Perm.FEED_POST_PIN, Perm.USER_MANAGE],
  editor:                          [Perm.CONTENT_CREATE, Perm.CONTENT_PUBLISH, Perm.CONTENT_DELETE_ANY],
  meslegin_gelecekleri_participant: [],
  corporate_rep:                   [],
  partner:                         [Perm.PARTNER_MANAGE],
  viewer:                          [...VIEWER_PERMS],
  finance:                         [...FINANCE_PERMS],
  admin:                           [...ADMIN_PERMS],
  super_admin:                     [...SUPER_ADMIN_PERMS],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getUserPermissions(roles: readonly (FunctionalRole | string)[]): Set<Permission> {
  const perms = new Set<Permission>();
  for (const role of roles) {
    for (const p of ROLE_PERMISSIONS[role as FunctionalRole] ?? []) {
      perms.add(p);
    }
  }
  return perms;
}

export function hasPermission(
  roles: readonly (FunctionalRole | string)[],
  permission: Permission,
): boolean {
  return getUserPermissions(roles).has(permission);
}

// ─── UI Labels ────────────────────────────────────────────────────────────────

export const PERMISSION_LABEL: Record<Permission, string> = {
  'feed.read':                  'Feed görüntüleme',
  'feed.post.create':           'Gönderi oluşturma',
  'feed.post.delete_own':       'Kendi gönderisini silme',
  'feed.post.delete_any':       'Herhangi gönderiyi silme',
  'feed.post.pin':              'Gönderi sabitleme',
  'feed.comment.create':        'Yorum oluşturma',
  'feed.comment.delete_own':    'Kendi yorumunu silme',
  'feed.comment.delete_any':    'Herhangi yorumu silme',
  'feed.react':                 'Tepki verme',
  'application.submit':         'Başvuru gönderme',
  'application.view':           'Başvuru görüntüleme',
  'application.review':         'Başvuru inceleme',
  'application.approve':        'Başvuru onaylama',
  'application.reject':         'Başvuru reddetme',
  'application.notes.view':     'Not görüntüleme',
  'application.notes.edit':     'Not düzenleme',
  'application.delete':         'Başvuru silme',
  'interview.schedule':         'Görüşme planlama',
  'payment.view':               'Ödeme görüntüleme',
  'payment.request':            'Ödeme talebi oluşturma',
  'payment.remind':             'Ödeme hatırlatması gönderme',
  'payment.verify':             'Ödeme doğrulama',
  'payment.waive':              'Ödeme muafiyeti',
  'payment.fail':               'Ödemeyi başarısız işaretleme',
  'payment.revoke_waiver':      'Ödeme muafiyetini iptal etme',
  'payment.extend_due_date':    'Ödeme süre uzatma',
  'donation.view':              'Bağış görüntüleme',
  'donation.create':            'Bağış oluşturma',
  'donation.update':            'Bağış güncelleme',
  'member.view':                'Üye görüntüleme',
  'member.edit':                'Üye düzenleme',
  'member.activate':            'Üye aktivasyonu',
  'user.profile.read':          'Profil görüntüleme',
  'user.profile.update_own':    'Kendi profilini güncelleme',
  'user.manage':                'Kullanıcı yönetimi',
  'user.roles.manage':          'Rol yönetimi',
  'user.delete':                'Kullanıcı silme',
  'verification.submit':        'Doğrulama başvurusu',
  'verification.review':        'Doğrulama inceleme',
  'mentor.request':             'Mentorluk talebi',
  'mentor.manage':              'Mentör yönetimi',
  'mentor.accept':              'Mentörlük kabulü',
  'content.read':               'İçerik görüntüleme',
  'content.create':             'İçerik oluşturma',
  'content.publish':            'İçerik yayınlama',
  'content.delete_any':         'İçerik silme',
  'admin.dashboard.read':       'Dashboard erişimi',
  'admin.settings.manage':      'Sistem ayarları',
  'audit.read':                 'Audit log erişimi',
  'admin.newsletter.read':      'Bülten görüntüleme',
  'admin.newsletter.write':     'Bülten oluşturma ve gönderme',
  'partner.manage':             'Partner firma ticket yönetimi',
};

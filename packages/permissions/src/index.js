"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSION_LABEL = exports.ROLE_PERMISSIONS = exports.Perm = void 0;
exports.getUserPermissions = getUserPermissions;
exports.hasPermission = hasPermission;
// ─── Permission Constants ──────────────────────────────────────────────────────
// Single source of truth for both API and admin UI.
// Format: 'domain.action' — import Perm.X constants instead of string literals.
exports.Perm = {
    // ── Feed ──────────────────────────────────────────────────────────────────────
    FEED_READ: 'feed.read',
    FEED_POST_CREATE: 'feed.post.create',
    FEED_POST_DELETE_OWN: 'feed.post.delete_own',
    FEED_POST_DELETE_ANY: 'feed.post.delete_any',
    FEED_POST_PIN: 'feed.post.pin',
    FEED_COMMENT_CREATE: 'feed.comment.create',
    FEED_COMMENT_DELETE_OWN: 'feed.comment.delete_own',
    FEED_COMMENT_DELETE_ANY: 'feed.comment.delete_any',
    FEED_REACT: 'feed.react',
    // ── Application ───────────────────────────────────────────────────────────────
    APPLICATION_SUBMIT: 'application.submit',
    APPLICATION_VIEW: 'application.view',
    APPLICATION_REVIEW: 'application.review',
    APPLICATION_APPROVE: 'application.approve',
    APPLICATION_REJECT: 'application.reject',
    APPLICATION_NOTES_VIEW: 'application.notes.view',
    APPLICATION_NOTES_EDIT: 'application.notes.edit',
    APPLICATION_DELETE: 'application.delete',
    // ── Interview ─────────────────────────────────────────────────────────────────
    INTERVIEW_SCHEDULE: 'interview.schedule',
    // ── Payment ───────────────────────────────────────────────────────────────────
    PAYMENT_VIEW: 'payment.view',
    PAYMENT_REQUEST: 'payment.request',
    PAYMENT_REMIND: 'payment.remind',
    PAYMENT_VERIFY: 'payment.verify',
    PAYMENT_WAIVE: 'payment.waive',
    PAYMENT_FAIL: 'payment.fail',
    PAYMENT_REVOKE_WAIVER: 'payment.revoke_waiver',
    PAYMENT_EXTEND_DUE_DATE: 'payment.extend_due_date',
    // ── Donation ──────────────────────────────────────────────────────────────────
    DONATION_VIEW: 'donation.view',
    DONATION_CREATE: 'donation.create',
    DONATION_UPDATE: 'donation.update',
    // ── Member ────────────────────────────────────────────────────────────────────
    MEMBER_VIEW: 'member.view',
    MEMBER_EDIT: 'member.edit',
    MEMBER_ACTIVATE: 'member.activate',
    // ── User management ───────────────────────────────────────────────────────────
    USER_PROFILE_READ: 'user.profile.read',
    USER_PROFILE_UPDATE_OWN: 'user.profile.update_own',
    USER_MANAGE: 'user.manage',
    USER_ROLES_MANAGE: 'user.roles.manage',
    USER_DELETE: 'user.delete',
    // ── Verification ──────────────────────────────────────────────────────────────
    VERIFICATION_SUBMIT: 'verification.submit',
    VERIFICATION_REVIEW: 'verification.review',
    // ── Mentorship ────────────────────────────────────────────────────────────────
    MENTOR_REQUEST: 'mentor.request',
    MENTOR_MANAGE: 'mentor.manage',
    MENTOR_ACCEPT: 'mentor.accept',
    // ── Content ───────────────────────────────────────────────────────────────────
    CONTENT_READ: 'content.read',
    CONTENT_CREATE: 'content.create',
    CONTENT_PUBLISH: 'content.publish',
    CONTENT_DELETE_ANY: 'content.delete_any',
    // ── Admin ─────────────────────────────────────────────────────────────────────
    ADMIN_DASHBOARD_READ: 'admin.dashboard.read',
    ADMIN_SETTINGS_MANAGE: 'admin.settings.manage',
    AUDIT_READ: 'audit.read',
    NEWSLETTER_READ: 'admin.newsletter.read',
    NEWSLETTER_WRITE: 'admin.newsletter.write',
    // ── Partner ───────────────────────────────────────────────────────────────────
    PARTNER_MANAGE: 'partner.manage',
};
// ─── Permission Groups (composition) ─────────────────────────────────────────
// Compose roles from these groups — never copy-paste permission lists.
var APPLICATION_ADMIN_PERMS = [
    exports.Perm.APPLICATION_VIEW, exports.Perm.APPLICATION_REVIEW, exports.Perm.APPLICATION_APPROVE,
    exports.Perm.APPLICATION_REJECT, exports.Perm.APPLICATION_NOTES_VIEW, exports.Perm.APPLICATION_NOTES_EDIT,
    exports.Perm.INTERVIEW_SCHEDULE,
    exports.Perm.PAYMENT_VIEW, exports.Perm.PAYMENT_REQUEST, exports.Perm.PAYMENT_REMIND,
    exports.Perm.MEMBER_VIEW, exports.Perm.DONATION_VIEW,
];
var FINANCE_PERMS = [
    exports.Perm.APPLICATION_VIEW, exports.Perm.APPLICATION_NOTES_VIEW,
    exports.Perm.PAYMENT_VIEW, exports.Perm.PAYMENT_REMIND, exports.Perm.PAYMENT_VERIFY,
    exports.Perm.PAYMENT_WAIVE, exports.Perm.PAYMENT_FAIL, exports.Perm.PAYMENT_REVOKE_WAIVER,
    exports.Perm.PAYMENT_EXTEND_DUE_DATE,
    exports.Perm.DONATION_VIEW, exports.Perm.DONATION_CREATE, exports.Perm.DONATION_UPDATE,
    exports.Perm.MEMBER_VIEW,
];
var VIEWER_PERMS = [
    exports.Perm.APPLICATION_VIEW,
    exports.Perm.MEMBER_VIEW,
];
var ADMIN_PERMS = __spreadArray(__spreadArray([], APPLICATION_ADMIN_PERMS, true), [
    exports.Perm.FEED_POST_DELETE_ANY, exports.Perm.FEED_COMMENT_DELETE_ANY, exports.Perm.FEED_POST_PIN,
    exports.Perm.USER_MANAGE, exports.Perm.USER_ROLES_MANAGE,
    exports.Perm.VERIFICATION_REVIEW,
    exports.Perm.CONTENT_PUBLISH, exports.Perm.CONTENT_DELETE_ANY,
    exports.Perm.MENTOR_MANAGE,
    exports.Perm.ADMIN_DASHBOARD_READ, exports.Perm.AUDIT_READ,
    exports.Perm.NEWSLETTER_READ, exports.Perm.NEWSLETTER_WRITE,
], false);
var SUPER_ADMIN_PERMS = __spreadArray(__spreadArray(__spreadArray([], ADMIN_PERMS, true), FINANCE_PERMS, true), [
    exports.Perm.MEMBER_ACTIVATE, exports.Perm.MEMBER_EDIT,
    exports.Perm.USER_DELETE, exports.Perm.APPLICATION_DELETE,
    exports.Perm.ADMIN_SETTINGS_MANAGE,
], false);
// ─── Role → Permissions Map ────────────────────────────────────────────────────
exports.ROLE_PERMISSIONS = {
    mentor: [exports.Perm.MENTOR_ACCEPT, exports.Perm.MENTOR_MANAGE],
    moderator: [exports.Perm.FEED_POST_DELETE_ANY, exports.Perm.FEED_COMMENT_DELETE_ANY, exports.Perm.FEED_POST_PIN, exports.Perm.USER_MANAGE],
    editor: [exports.Perm.CONTENT_CREATE, exports.Perm.CONTENT_PUBLISH, exports.Perm.CONTENT_DELETE_ANY],
    meslegin_gelecekleri_participant: [],
    corporate_rep: [],
    partner: [exports.Perm.PARTNER_MANAGE],
    viewer: __spreadArray([], VIEWER_PERMS, true),
    finance: __spreadArray([], FINANCE_PERMS, true),
    admin: __spreadArray([], ADMIN_PERMS, true),
    super_admin: __spreadArray([], SUPER_ADMIN_PERMS, true),
};
// ─── Helpers ──────────────────────────────────────────────────────────────────
function getUserPermissions(roles) {
    var _a;
    var perms = new Set();
    for (var _i = 0, roles_1 = roles; _i < roles_1.length; _i++) {
        var role = roles_1[_i];
        for (var _b = 0, _c = (_a = exports.ROLE_PERMISSIONS[role]) !== null && _a !== void 0 ? _a : []; _b < _c.length; _b++) {
            var p = _c[_b];
            perms.add(p);
        }
    }
    return perms;
}
function hasPermission(roles, permission) {
    return getUserPermissions(roles).has(permission);
}
// ─── UI Labels ────────────────────────────────────────────────────────────────
exports.PERMISSION_LABEL = {
    'feed.read': 'Feed görüntüleme',
    'feed.post.create': 'Gönderi oluşturma',
    'feed.post.delete_own': 'Kendi gönderisini silme',
    'feed.post.delete_any': 'Herhangi gönderiyi silme',
    'feed.post.pin': 'Gönderi sabitleme',
    'feed.comment.create': 'Yorum oluşturma',
    'feed.comment.delete_own': 'Kendi yorumunu silme',
    'feed.comment.delete_any': 'Herhangi yorumu silme',
    'feed.react': 'Tepki verme',
    'application.submit': 'Başvuru gönderme',
    'application.view': 'Başvuru görüntüleme',
    'application.review': 'Başvuru inceleme',
    'application.approve': 'Başvuru onaylama',
    'application.reject': 'Başvuru reddetme',
    'application.notes.view': 'Not görüntüleme',
    'application.notes.edit': 'Not düzenleme',
    'application.delete': 'Başvuru silme',
    'interview.schedule': 'Görüşme planlama',
    'payment.view': 'Ödeme görüntüleme',
    'payment.request': 'Ödeme talebi oluşturma',
    'payment.remind': 'Ödeme hatırlatması gönderme',
    'payment.verify': 'Ödeme doğrulama',
    'payment.waive': 'Ödeme muafiyeti',
    'payment.fail': 'Ödemeyi başarısız işaretleme',
    'payment.revoke_waiver': 'Ödeme muafiyetini iptal etme',
    'payment.extend_due_date': 'Ödeme süre uzatma',
    'donation.view': 'Bağış görüntüleme',
    'donation.create': 'Bağış oluşturma',
    'donation.update': 'Bağış güncelleme',
    'member.view': 'Üye görüntüleme',
    'member.edit': 'Üye düzenleme',
    'member.activate': 'Üye aktivasyonu',
    'user.profile.read': 'Profil görüntüleme',
    'user.profile.update_own': 'Kendi profilini güncelleme',
    'user.manage': 'Kullanıcı yönetimi',
    'user.roles.manage': 'Rol yönetimi',
    'user.delete': 'Kullanıcı silme',
    'verification.submit': 'Doğrulama başvurusu',
    'verification.review': 'Doğrulama inceleme',
    'mentor.request': 'Mentorluk talebi',
    'mentor.manage': 'Mentör yönetimi',
    'mentor.accept': 'Mentörlük kabulü',
    'content.read': 'İçerik görüntüleme',
    'content.create': 'İçerik oluşturma',
    'content.publish': 'İçerik yayınlama',
    'content.delete_any': 'İçerik silme',
    'admin.dashboard.read': 'Dashboard erişimi',
    'admin.settings.manage': 'Sistem ayarları',
    'audit.read': 'Audit log erişimi',
    'admin.newsletter.read': 'Bülten görüntüleme',
    'admin.newsletter.write': 'Bülten oluşturma ve gönderme',
    'partner.manage': 'Partner firma ticket yönetimi',
};

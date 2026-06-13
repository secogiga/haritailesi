"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
describe('getUserPermissions', function () {
    it('returns empty set for unknown role', function () {
        var perms = (0, index_1.getUserPermissions)(['unknown_role']);
        expect(perms.size).toBe(0);
    });
    it('returns empty set for empty roles array', function () {
        var perms = (0, index_1.getUserPermissions)([]);
        expect(perms.size).toBe(0);
    });
    it('returns correct permissions for mentor role', function () {
        var perms = (0, index_1.getUserPermissions)(['mentor']);
        expect(perms.has(index_1.Perm.MENTOR_ACCEPT)).toBe(true);
        expect(perms.has(index_1.Perm.MENTOR_MANAGE)).toBe(true);
        expect(perms.has(index_1.Perm.USER_MANAGE)).toBe(false);
    });
    it('returns correct permissions for moderator role', function () {
        var perms = (0, index_1.getUserPermissions)(['moderator']);
        expect(perms.has(index_1.Perm.FEED_POST_DELETE_ANY)).toBe(true);
        expect(perms.has(index_1.Perm.FEED_COMMENT_DELETE_ANY)).toBe(true);
        expect(perms.has(index_1.Perm.FEED_POST_PIN)).toBe(true);
        expect(perms.has(index_1.Perm.USER_MANAGE)).toBe(true);
        expect(perms.has(index_1.Perm.USER_ROLES_MANAGE)).toBe(false);
    });
    it('returns empty set for meslegin_gelecekleri_participant', function () {
        var perms = (0, index_1.getUserPermissions)(['meslegin_gelecekleri_participant']);
        expect(perms.size).toBe(0);
    });
    it('returns empty set for corporate_rep', function () {
        var perms = (0, index_1.getUserPermissions)(['corporate_rep']);
        expect(perms.size).toBe(0);
    });
    it('merges permissions for multiple roles', function () {
        var perms = (0, index_1.getUserPermissions)(['mentor', 'moderator']);
        expect(perms.has(index_1.Perm.MENTOR_ACCEPT)).toBe(true);
        expect(perms.has(index_1.Perm.FEED_POST_DELETE_ANY)).toBe(true);
        expect(perms.has(index_1.Perm.USER_MANAGE)).toBe(true);
    });
    it('deduplicates permissions when roles overlap', function () {
        // admin has USER_MANAGE, moderator also has USER_MANAGE — should appear once in Set
        var perms = (0, index_1.getUserPermissions)(['admin', 'moderator']);
        var count = 0;
        perms.forEach(function (p) { if (p === index_1.Perm.USER_MANAGE)
            count++; });
        expect(count).toBe(1);
    });
});
describe('hasPermission', function () {
    it('returns true when role has permission', function () {
        expect((0, index_1.hasPermission)(['admin'], index_1.Perm.APPLICATION_VIEW)).toBe(true);
    });
    it('returns false when role does not have permission', function () {
        expect((0, index_1.hasPermission)(['viewer'], index_1.Perm.USER_ROLES_MANAGE)).toBe(false);
    });
    it('returns false for empty roles', function () {
        expect((0, index_1.hasPermission)([], index_1.Perm.FEED_READ)).toBe(false);
    });
    it('returns true if any role has permission', function () {
        expect((0, index_1.hasPermission)(['viewer', 'moderator'], index_1.Perm.FEED_POST_DELETE_ANY)).toBe(true);
    });
});
describe('viewer role', function () {
    it('can only view applications and members', function () {
        var perms = (0, index_1.getUserPermissions)(['viewer']);
        expect(perms.has(index_1.Perm.APPLICATION_VIEW)).toBe(true);
        expect(perms.has(index_1.Perm.MEMBER_VIEW)).toBe(true);
        expect(perms.has(index_1.Perm.APPLICATION_APPROVE)).toBe(false);
        expect(perms.has(index_1.Perm.USER_MANAGE)).toBe(false);
        expect(perms.has(index_1.Perm.PAYMENT_WAIVE)).toBe(false);
    });
});
describe('finance role', function () {
    it('can verify and waive payments', function () {
        var perms = (0, index_1.getUserPermissions)(['finance']);
        expect(perms.has(index_1.Perm.PAYMENT_VERIFY)).toBe(true);
        expect(perms.has(index_1.Perm.PAYMENT_WAIVE)).toBe(true);
        expect(perms.has(index_1.Perm.PAYMENT_EXTEND_DUE_DATE)).toBe(true);
    });
    it('can view but not approve applications', function () {
        var perms = (0, index_1.getUserPermissions)(['finance']);
        expect(perms.has(index_1.Perm.APPLICATION_VIEW)).toBe(true);
        expect(perms.has(index_1.Perm.APPLICATION_APPROVE)).toBe(false);
        expect(perms.has(index_1.Perm.APPLICATION_REJECT)).toBe(false);
    });
    it('cannot manage users or roles', function () {
        var perms = (0, index_1.getUserPermissions)(['finance']);
        expect(perms.has(index_1.Perm.USER_MANAGE)).toBe(false);
        expect(perms.has(index_1.Perm.USER_ROLES_MANAGE)).toBe(false);
    });
});
describe('admin role composition', function () {
    it('includes all APPLICATION_ADMIN_PERMS', function () {
        var perms = (0, index_1.getUserPermissions)(['admin']);
        expect(perms.has(index_1.Perm.APPLICATION_VIEW)).toBe(true);
        expect(perms.has(index_1.Perm.APPLICATION_REVIEW)).toBe(true);
        expect(perms.has(index_1.Perm.APPLICATION_APPROVE)).toBe(true);
        expect(perms.has(index_1.Perm.APPLICATION_REJECT)).toBe(true);
        expect(perms.has(index_1.Perm.APPLICATION_NOTES_VIEW)).toBe(true);
        expect(perms.has(index_1.Perm.APPLICATION_NOTES_EDIT)).toBe(true);
        expect(perms.has(index_1.Perm.INTERVIEW_SCHEDULE)).toBe(true);
        expect(perms.has(index_1.Perm.PAYMENT_REQUEST)).toBe(true);
    });
    it('can manage users and roles', function () {
        var perms = (0, index_1.getUserPermissions)(['admin']);
        expect(perms.has(index_1.Perm.USER_MANAGE)).toBe(true);
        expect(perms.has(index_1.Perm.USER_ROLES_MANAGE)).toBe(true);
    });
    it('cannot waive payments or delete users', function () {
        var perms = (0, index_1.getUserPermissions)(['admin']);
        expect(perms.has(index_1.Perm.PAYMENT_WAIVE)).toBe(false);
        expect(perms.has(index_1.Perm.USER_DELETE)).toBe(false);
        expect(perms.has(index_1.Perm.MEMBER_ACTIVATE)).toBe(false);
        expect(perms.has(index_1.Perm.MEMBER_EDIT)).toBe(false);
    });
});
describe('super_admin role composition', function () {
    it('includes all admin permissions', function () {
        var adminPerms = (0, index_1.getUserPermissions)(['admin']);
        var superPerms = (0, index_1.getUserPermissions)(['super_admin']);
        adminPerms.forEach(function (p) {
            expect(superPerms.has(p)).toBe(true);
        });
    });
    it('includes all finance permissions', function () {
        var financePerms = (0, index_1.getUserPermissions)(['finance']);
        var superPerms = (0, index_1.getUserPermissions)(['super_admin']);
        financePerms.forEach(function (p) {
            expect(superPerms.has(p)).toBe(true);
        });
    });
    it('can delete users, edit members, and manage settings', function () {
        var perms = (0, index_1.getUserPermissions)(['super_admin']);
        expect(perms.has(index_1.Perm.USER_DELETE)).toBe(true);
        expect(perms.has(index_1.Perm.MEMBER_ACTIVATE)).toBe(true);
        expect(perms.has(index_1.Perm.MEMBER_EDIT)).toBe(true);
        expect(perms.has(index_1.Perm.ADMIN_SETTINGS_MANAGE)).toBe(true);
    });
});
describe('ROLE_PERMISSIONS coverage', function () {
    it('defines permissions for all expected roles', function () {
        var expectedRoles = [
            'mentor', 'moderator', 'editor', 'meslegin_gelecekleri_participant',
            'corporate_rep', 'viewer', 'finance', 'admin', 'super_admin',
        ];
        expectedRoles.forEach(function (role) {
            expect(index_1.ROLE_PERMISSIONS).toHaveProperty(role);
        });
    });
    it('all permission values are valid Perm constants', function () {
        var validPerms = new Set(Object.values(index_1.Perm));
        Object.entries(index_1.ROLE_PERMISSIONS).forEach(function (_a) {
            var role = _a[0], perms = _a[1];
            perms.forEach(function (p) {
                expect(validPerms.has(p)).toBe(true);
            });
        });
    });
});
// ─── Yeni ödeme izinleri ──────────────────────────────────────────────────────
describe('payment permission matrix', function () {
    it('admin has payment.view and payment.remind', function () {
        var perms = (0, index_1.getUserPermissions)(['admin']);
        expect(perms.has(index_1.Perm.PAYMENT_VIEW)).toBe(true);
        expect(perms.has(index_1.Perm.PAYMENT_REMIND)).toBe(true);
    });
    it('admin does NOT have payment.fail or payment.revoke_waiver (finance-only)', function () {
        var perms = (0, index_1.getUserPermissions)(['admin']);
        expect(perms.has(index_1.Perm.PAYMENT_FAIL)).toBe(false);
        expect(perms.has(index_1.Perm.PAYMENT_REVOKE_WAIVER)).toBe(false);
    });
    it('finance has all new payment permissions', function () {
        var perms = (0, index_1.getUserPermissions)(['finance']);
        expect(perms.has(index_1.Perm.PAYMENT_VIEW)).toBe(true);
        expect(perms.has(index_1.Perm.PAYMENT_REMIND)).toBe(true);
        expect(perms.has(index_1.Perm.PAYMENT_FAIL)).toBe(true);
        expect(perms.has(index_1.Perm.PAYMENT_REVOKE_WAIVER)).toBe(true);
        expect(perms.has(index_1.Perm.PAYMENT_EXTEND_DUE_DATE)).toBe(true);
    });
    it('viewer has no payment permissions', function () {
        var perms = (0, index_1.getUserPermissions)(['viewer']);
        expect(perms.has(index_1.Perm.PAYMENT_VIEW)).toBe(false);
        expect(perms.has(index_1.Perm.PAYMENT_REMIND)).toBe(false);
        expect(perms.has(index_1.Perm.PAYMENT_FAIL)).toBe(false);
        expect(perms.has(index_1.Perm.PAYMENT_REVOKE_WAIVER)).toBe(false);
    });
    it('super_admin inherits all payment permissions from finance', function () {
        var financePerms = (0, index_1.getUserPermissions)(['finance']);
        var superPerms = (0, index_1.getUserPermissions)(['super_admin']);
        financePerms.forEach(function (p) {
            if (p.startsWith('payment.')) {
                expect(superPerms.has(p)).toBe(true);
            }
        });
    });
    it('moderator has no payment permissions', function () {
        var perms = (0, index_1.getUserPermissions)(['moderator']);
        expect(perms.has(index_1.Perm.PAYMENT_VIEW)).toBe(false);
        expect(perms.has(index_1.Perm.PAYMENT_REMIND)).toBe(false);
    });
});
// ─── Yeni donation izinleri ───────────────────────────────────────────────────
describe('donation permission matrix', function () {
    it('finance can view, create, and update donations', function () {
        var perms = (0, index_1.getUserPermissions)(['finance']);
        expect(perms.has(index_1.Perm.DONATION_VIEW)).toBe(true);
        expect(perms.has(index_1.Perm.DONATION_CREATE)).toBe(true);
        expect(perms.has(index_1.Perm.DONATION_UPDATE)).toBe(true);
    });
    it('admin can only view donations (not create or update)', function () {
        var perms = (0, index_1.getUserPermissions)(['admin']);
        expect(perms.has(index_1.Perm.DONATION_VIEW)).toBe(true);
        expect(perms.has(index_1.Perm.DONATION_CREATE)).toBe(false);
        expect(perms.has(index_1.Perm.DONATION_UPDATE)).toBe(false);
    });
    it('viewer cannot manage donations', function () {
        var perms = (0, index_1.getUserPermissions)(['viewer']);
        expect(perms.has(index_1.Perm.DONATION_VIEW)).toBe(false);
        expect(perms.has(index_1.Perm.DONATION_UPDATE)).toBe(false);
    });
});
// ─── Enum / type uyumu ────────────────────────────────────────────────────────
describe('enum type compatibility', function () {
    it('Perm.PAYMENT_VIEW evaluates to expected string', function () {
        expect(index_1.Perm.PAYMENT_VIEW).toBe('payment.view');
    });
    it('Perm.PAYMENT_REMIND evaluates to expected string', function () {
        expect(index_1.Perm.PAYMENT_REMIND).toBe('payment.remind');
    });
    it('Perm.PAYMENT_FAIL evaluates to expected string', function () {
        expect(index_1.Perm.PAYMENT_FAIL).toBe('payment.fail');
    });
    it('Perm.PAYMENT_REVOKE_WAIVER evaluates to expected string', function () {
        expect(index_1.Perm.PAYMENT_REVOKE_WAIVER).toBe('payment.revoke_waiver');
    });
});

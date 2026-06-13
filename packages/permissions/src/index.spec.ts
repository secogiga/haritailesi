import { Perm, ROLE_PERMISSIONS, getUserPermissions, hasPermission } from './index';

describe('getUserPermissions', () => {
  it('returns empty set for unknown role', () => {
    const perms = getUserPermissions(['unknown_role']);
    expect(perms.size).toBe(0);
  });

  it('returns empty set for empty roles array', () => {
    const perms = getUserPermissions([]);
    expect(perms.size).toBe(0);
  });

  it('returns correct permissions for mentor role', () => {
    const perms = getUserPermissions(['mentor']);
    expect(perms.has(Perm.MENTOR_ACCEPT)).toBe(true);
    expect(perms.has(Perm.MENTOR_MANAGE)).toBe(true);
    expect(perms.has(Perm.USER_MANAGE)).toBe(false);
  });

  it('returns correct permissions for moderator role', () => {
    const perms = getUserPermissions(['moderator']);
    expect(perms.has(Perm.FEED_POST_DELETE_ANY)).toBe(true);
    expect(perms.has(Perm.FEED_COMMENT_DELETE_ANY)).toBe(true);
    expect(perms.has(Perm.FEED_POST_PIN)).toBe(true);
    expect(perms.has(Perm.USER_MANAGE)).toBe(true);
    expect(perms.has(Perm.USER_ROLES_MANAGE)).toBe(false);
  });

  it('returns empty set for meslegin_gelecekleri_participant', () => {
    const perms = getUserPermissions(['meslegin_gelecekleri_participant']);
    expect(perms.size).toBe(0);
  });

  it('returns empty set for corporate_rep', () => {
    const perms = getUserPermissions(['corporate_rep']);
    expect(perms.size).toBe(0);
  });

  it('merges permissions for multiple roles', () => {
    const perms = getUserPermissions(['mentor', 'moderator']);
    expect(perms.has(Perm.MENTOR_ACCEPT)).toBe(true);
    expect(perms.has(Perm.FEED_POST_DELETE_ANY)).toBe(true);
    expect(perms.has(Perm.USER_MANAGE)).toBe(true);
  });

  it('deduplicates permissions when roles overlap', () => {
    // admin has USER_MANAGE, moderator also has USER_MANAGE — should appear once in Set
    const perms = getUserPermissions(['admin', 'moderator']);
    let count = 0;
    perms.forEach((p) => { if (p === Perm.USER_MANAGE) count++; });
    expect(count).toBe(1);
  });
});

describe('hasPermission', () => {
  it('returns true when role has permission', () => {
    expect(hasPermission(['admin'], Perm.APPLICATION_VIEW)).toBe(true);
  });

  it('returns false when role does not have permission', () => {
    expect(hasPermission(['viewer'], Perm.USER_ROLES_MANAGE)).toBe(false);
  });

  it('returns false for empty roles', () => {
    expect(hasPermission([], Perm.FEED_READ)).toBe(false);
  });

  it('returns true if any role has permission', () => {
    expect(hasPermission(['viewer', 'moderator'], Perm.FEED_POST_DELETE_ANY)).toBe(true);
  });
});

describe('viewer role', () => {
  it('can only view applications and members', () => {
    const perms = getUserPermissions(['viewer']);
    expect(perms.has(Perm.APPLICATION_VIEW)).toBe(true);
    expect(perms.has(Perm.MEMBER_VIEW)).toBe(true);
    expect(perms.has(Perm.APPLICATION_APPROVE)).toBe(false);
    expect(perms.has(Perm.USER_MANAGE)).toBe(false);
    expect(perms.has(Perm.PAYMENT_WAIVE)).toBe(false);
  });
});

describe('finance role', () => {
  it('can verify and waive payments', () => {
    const perms = getUserPermissions(['finance']);
    expect(perms.has(Perm.PAYMENT_VERIFY)).toBe(true);
    expect(perms.has(Perm.PAYMENT_WAIVE)).toBe(true);
    expect(perms.has(Perm.PAYMENT_EXTEND_DUE_DATE)).toBe(true);
  });

  it('can view but not approve applications', () => {
    const perms = getUserPermissions(['finance']);
    expect(perms.has(Perm.APPLICATION_VIEW)).toBe(true);
    expect(perms.has(Perm.APPLICATION_APPROVE)).toBe(false);
    expect(perms.has(Perm.APPLICATION_REJECT)).toBe(false);
  });

  it('cannot manage users or roles', () => {
    const perms = getUserPermissions(['finance']);
    expect(perms.has(Perm.USER_MANAGE)).toBe(false);
    expect(perms.has(Perm.USER_ROLES_MANAGE)).toBe(false);
  });
});

describe('admin role composition', () => {
  it('includes all APPLICATION_ADMIN_PERMS', () => {
    const perms = getUserPermissions(['admin']);
    expect(perms.has(Perm.APPLICATION_VIEW)).toBe(true);
    expect(perms.has(Perm.APPLICATION_REVIEW)).toBe(true);
    expect(perms.has(Perm.APPLICATION_APPROVE)).toBe(true);
    expect(perms.has(Perm.APPLICATION_REJECT)).toBe(true);
    expect(perms.has(Perm.APPLICATION_NOTES_VIEW)).toBe(true);
    expect(perms.has(Perm.APPLICATION_NOTES_EDIT)).toBe(true);
    expect(perms.has(Perm.INTERVIEW_SCHEDULE)).toBe(true);
    expect(perms.has(Perm.PAYMENT_REQUEST)).toBe(true);
  });

  it('can manage users and roles', () => {
    const perms = getUserPermissions(['admin']);
    expect(perms.has(Perm.USER_MANAGE)).toBe(true);
    expect(perms.has(Perm.USER_ROLES_MANAGE)).toBe(true);
  });

  it('cannot waive payments or delete users', () => {
    const perms = getUserPermissions(['admin']);
    expect(perms.has(Perm.PAYMENT_WAIVE)).toBe(false);
    expect(perms.has(Perm.USER_DELETE)).toBe(false);
    expect(perms.has(Perm.MEMBER_ACTIVATE)).toBe(false);
    expect(perms.has(Perm.MEMBER_EDIT)).toBe(false);
  });
});

describe('super_admin role composition', () => {
  it('includes all admin permissions', () => {
    const adminPerms = getUserPermissions(['admin']);
    const superPerms = getUserPermissions(['super_admin']);
    adminPerms.forEach((p) => {
      expect(superPerms.has(p)).toBe(true);
    });
  });

  it('includes all finance permissions', () => {
    const financePerms = getUserPermissions(['finance']);
    const superPerms = getUserPermissions(['super_admin']);
    financePerms.forEach((p) => {
      expect(superPerms.has(p)).toBe(true);
    });
  });

  it('can delete users, edit members, and manage settings', () => {
    const perms = getUserPermissions(['super_admin']);
    expect(perms.has(Perm.USER_DELETE)).toBe(true);
    expect(perms.has(Perm.MEMBER_ACTIVATE)).toBe(true);
    expect(perms.has(Perm.MEMBER_EDIT)).toBe(true);
    expect(perms.has(Perm.ADMIN_SETTINGS_MANAGE)).toBe(true);
  });
});

describe('ROLE_PERMISSIONS coverage', () => {
  it('defines permissions for all expected roles', () => {
    const expectedRoles = [
      'mentor', 'moderator', 'editor', 'meslegin_gelecekleri_participant',
      'corporate_rep', 'viewer', 'finance', 'admin', 'super_admin',
    ];
    expectedRoles.forEach((role) => {
      expect(ROLE_PERMISSIONS).toHaveProperty(role);
    });
  });

  it('all permission values are valid Perm constants', () => {
    const validPerms = new Set(Object.values(Perm));
    Object.entries(ROLE_PERMISSIONS).forEach(([role, perms]) => {
      perms.forEach((p) => {
        expect(validPerms.has(p)).toBe(true);
      });
    });
  });
});

// ─── Yeni ödeme izinleri ──────────────────────────────────────────────────────

describe('payment permission matrix', () => {
  it('admin has payment.view and payment.remind', () => {
    const perms = getUserPermissions(['admin']);
    expect(perms.has(Perm.PAYMENT_VIEW)).toBe(true);
    expect(perms.has(Perm.PAYMENT_REMIND)).toBe(true);
  });

  it('admin does NOT have payment.fail or payment.revoke_waiver (finance-only)', () => {
    const perms = getUserPermissions(['admin']);
    expect(perms.has(Perm.PAYMENT_FAIL)).toBe(false);
    expect(perms.has(Perm.PAYMENT_REVOKE_WAIVER)).toBe(false);
  });

  it('finance has all new payment permissions', () => {
    const perms = getUserPermissions(['finance']);
    expect(perms.has(Perm.PAYMENT_VIEW)).toBe(true);
    expect(perms.has(Perm.PAYMENT_REMIND)).toBe(true);
    expect(perms.has(Perm.PAYMENT_FAIL)).toBe(true);
    expect(perms.has(Perm.PAYMENT_REVOKE_WAIVER)).toBe(true);
    expect(perms.has(Perm.PAYMENT_EXTEND_DUE_DATE)).toBe(true);
  });

  it('viewer has no payment permissions', () => {
    const perms = getUserPermissions(['viewer']);
    expect(perms.has(Perm.PAYMENT_VIEW)).toBe(false);
    expect(perms.has(Perm.PAYMENT_REMIND)).toBe(false);
    expect(perms.has(Perm.PAYMENT_FAIL)).toBe(false);
    expect(perms.has(Perm.PAYMENT_REVOKE_WAIVER)).toBe(false);
  });

  it('super_admin inherits all payment permissions from finance', () => {
    const financePerms = getUserPermissions(['finance']);
    const superPerms = getUserPermissions(['super_admin']);
    financePerms.forEach((p) => {
      if (p.startsWith('payment.')) {
        expect(superPerms.has(p)).toBe(true);
      }
    });
  });

  it('moderator has no payment permissions', () => {
    const perms = getUserPermissions(['moderator']);
    expect(perms.has(Perm.PAYMENT_VIEW)).toBe(false);
    expect(perms.has(Perm.PAYMENT_REMIND)).toBe(false);
  });
});

// ─── Yeni donation izinleri ───────────────────────────────────────────────────

describe('donation permission matrix', () => {
  it('finance can view, create, and update donations', () => {
    const perms = getUserPermissions(['finance']);
    expect(perms.has(Perm.DONATION_VIEW)).toBe(true);
    expect(perms.has(Perm.DONATION_CREATE)).toBe(true);
    expect(perms.has(Perm.DONATION_UPDATE)).toBe(true);
  });

  it('admin can only view donations (not create or update)', () => {
    const perms = getUserPermissions(['admin']);
    expect(perms.has(Perm.DONATION_VIEW)).toBe(true);
    expect(perms.has(Perm.DONATION_CREATE)).toBe(false);
    expect(perms.has(Perm.DONATION_UPDATE)).toBe(false);
  });

  it('viewer cannot manage donations', () => {
    const perms = getUserPermissions(['viewer']);
    expect(perms.has(Perm.DONATION_VIEW)).toBe(false);
    expect(perms.has(Perm.DONATION_UPDATE)).toBe(false);
  });
});

// ─── Enum / type uyumu ────────────────────────────────────────────────────────

describe('enum type compatibility', () => {
  it('Perm.PAYMENT_VIEW evaluates to expected string', () => {
    expect(Perm.PAYMENT_VIEW).toBe('payment.view');
  });

  it('Perm.PAYMENT_REMIND evaluates to expected string', () => {
    expect(Perm.PAYMENT_REMIND).toBe('payment.remind');
  });

  it('Perm.PAYMENT_FAIL evaluates to expected string', () => {
    expect(Perm.PAYMENT_FAIL).toBe('payment.fail');
  });

  it('Perm.PAYMENT_REVOKE_WAIVER evaluates to expected string', () => {
    expect(Perm.PAYMENT_REVOKE_WAIVER).toBe('payment.revoke_waiver');
  });
});

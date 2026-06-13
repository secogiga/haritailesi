import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';

const mockDb = {
  query: {
    users: { findFirst: jest.fn() },
    userProfiles: { findFirst: jest.fn() },
    userBadges: { findMany: jest.fn() },
  },
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockResolvedValue([]),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  onConflictDoNothing: jest.fn().mockResolvedValue([]),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([{ id: 'user-1' }]),
  execute: jest.fn().mockResolvedValue([]),
};

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  setex: jest.fn().mockResolvedValue('OK'),
};

const mockEmailService = {
  sendLevelUp: jest.fn().mockResolvedValue(undefined),
};

function makeService(): UsersService {
  return new UsersService(mockDb as any, mockRedis as any, mockEmailService as any);
}

beforeEach(() => jest.clearAllMocks());

// ── getMe ─────────────────────────────────────────────────────────────────────

describe('UsersService.getMe', () => {
  it('throws NotFoundException when user does not exist', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(null);

    const service = makeService();
    await expect(service.getMe('nonexistent-id')).rejects.toThrow(NotFoundException);
  });

  it('returns user with badges and empty completedActionIds when none exist', async () => {
    mockDb.query.users.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      membershipTier: 'registered_user',
      status: 'active',
      verificationStatus: 'unverified',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      profile: { displayName: 'Test User' },
      functionalRoles: [{ role: 'content_moderator' }],
    });
    mockDb.query.userBadges.findMany.mockResolvedValue([
      { badgeType: 'founding_member' },
    ]);
    mockDb.where.mockResolvedValue([]); // no level actions

    const service = makeService();
    const result = await service.getMe('user-1');

    expect(result.functionalRoles).toEqual(['content_moderator']);
    expect(result.badges).toEqual(['founding_member']);
    expect(result.completedActionIds).toEqual([]);
  });

  it('returns completedActionIds from level actions table', async () => {
    mockDb.query.users.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      membershipTier: 'registered_user',
      status: 'active',
      verificationStatus: 'unverified',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      profile: { displayName: 'Test User' },
      functionalRoles: [],
    });
    mockDb.query.userBadges.findMany.mockResolvedValue([]);
    mockDb.where.mockResolvedValue([
      { actionId: 'v-etkinlikler' },
      { actionId: 'v-mentorluk' },
      { actionId: 'p-mentor' },
    ]);

    const service = makeService();
    const result = await service.getMe('user-1');

    expect(result.completedActionIds).toEqual(['v-etkinlikler', 'v-mentorluk', 'p-mentor']);
  });
});

// ── follow ────────────────────────────────────────────────────────────────────

describe('UsersService.follow', () => {
  it('throws BadRequestException when user tries to follow themselves', async () => {
    const service = makeService();
    await expect(service.follow('user-1', 'user-1')).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException when followee not found or not active', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(null);

    const service = makeService();
    await expect(service.follow('user-1', 'ghost-user')).rejects.toThrow(NotFoundException);
  });

  it('returns following:true on successful follow', async () => {
    mockDb.query.users.findFirst.mockResolvedValue({ id: 'user-2', status: 'active' });

    const service = makeService();
    const result = await service.follow('user-1', 'user-2');

    expect(result).toEqual({ following: true });
    expect(mockDb.insert).toHaveBeenCalled();
  });
});

// ── unfollow ──────────────────────────────────────────────────────────────────

describe('UsersService.unfollow', () => {
  it('returns following:false and does not throw even when not following', async () => {
    mockDb.where.mockResolvedValue([]);

    const service = makeService();
    const result = await service.unfollow('user-1', 'user-2');

    expect(result).toEqual({ following: false });
  });
});

// ── resolveMembershipTier (via createFromApplication) ─────────────────────────

describe('UsersService membership tier resolution', () => {
  beforeEach(() => {
    mockDb.returning.mockResolvedValue([{ id: 'user-new' }]);
  });

  async function getTier(appType: string, formData: Record<string, unknown>) {
    const service = makeService();
    // Access private method via type cast for isolated unit testing
    return (service as any).resolveMembershipTier(appType, formData);
  }

  it('returns corporate_member for corporate application type', async () => {
    expect(await getTier('corporate', {})).toBe('corporate_member');
  });

  it('returns haritailesi_genc for ogrenci membershipType', async () => {
    expect(await getTier('individual', { membershipType: 'ogrenci' })).toBe('haritailesi_genc');
  });

  it('returns new_graduate_member for yeni_mezun membershipType', async () => {
    expect(await getTier('individual', { membershipType: 'yeni_mezun' })).toBe('new_graduate_member');
  });

  it('returns individual_member as fallback for standard applications', async () => {
    expect(await getTier('individual', {})).toBe('individual_member');
    expect(await getTier('individual', { membershipType: 'standart' })).toBe('individual_member');
  });
});

// ── extractDisplayName (private helper) ───────────────────────────────────────

describe('UsersService.extractDisplayName', () => {
  function extractDisplayName(formData: Record<string, unknown>) {
    return (new UsersService(mockDb as any, mockRedis as any, mockEmailService as any) as any).extractDisplayName(formData);
  }

  it('uses adSoyad field when present', () => {
    expect(extractDisplayName({ adSoyad: 'Ahmet Yılmaz' })).toBe('Ahmet Yılmaz');
  });

  it('falls back to ad_soyad field', () => {
    expect(extractDisplayName({ ad_soyad: 'Mehmet Kaya' })).toBe('Mehmet Kaya');
  });

  it('falls back to displayName field', () => {
    expect(extractDisplayName({ displayName: 'Ali Can' })).toBe('Ali Can');
  });

  it('returns default when no name fields present', () => {
    expect(extractDisplayName({})).toBe('Üye');
  });

  it('trims whitespace from name', () => {
    expect(extractDisplayName({ adSoyad: '  Ahmet Yılmaz  ' })).toBe('Ahmet Yılmaz');
  });
});

// ── recordLevelAction ─────────────────────────────────────────────────────────

describe('UsersService.recordLevelAction', () => {
  it('inserts action and returns updated completedActionIds', async () => {
    mockDb.where.mockResolvedValue([
      { actionId: 'v-etkinlikler' },
      { actionId: 'v-mentorluk' },
    ]);

    const service = makeService();
    const result = await service.recordLevelAction('user-1', 'v-mentorluk');

    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.onConflictDoNothing).toHaveBeenCalled();
    expect(result).toEqual(['v-etkinlikler', 'v-mentorluk']);
  });

  it('is idempotent — conflict is ignored, list still returned', async () => {
    mockDb.where.mockResolvedValue([{ actionId: 'v-etkinlikler' }]);

    const service = makeService();
    const result = await service.recordLevelAction('user-1', 'v-etkinlikler');

    expect(mockDb.onConflictDoNothing).toHaveBeenCalled();
    expect(result).toContain('v-etkinlikler');
  });
});

// ── syncLevelActions ──────────────────────────────────────────────────────────

describe('UsersService.syncLevelActions', () => {
  it('returns current list when actionIds is empty (no insert)', async () => {
    mockDb.where.mockResolvedValue([{ actionId: 'v-etkinlikler' }]);

    const service = makeService();
    const result = await service.syncLevelActions('user-1', []);

    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(result).toEqual(['v-etkinlikler']);
  });

  it('bulk inserts up to 200 actions and returns merged list', async () => {
    mockDb.where.mockResolvedValue([
      { actionId: 'v-etkinlikler' },
      { actionId: 'p-mentor' },
    ]);

    const service = makeService();
    const result = await service.syncLevelActions('user-1', ['v-etkinlikler', 'p-mentor']);

    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.onConflictDoNothing).toHaveBeenCalled();
    expect(result).toEqual(['v-etkinlikler', 'p-mentor']);
  });

  it('caps at 200 action IDs', async () => {
    const manyIds = Array.from({ length: 300 }, (_, i) => `v-action-${i}`);
    mockDb.where.mockResolvedValue([]);

    const service = makeService();
    await service.syncLevelActions('user-1', manyIds);

    // values() call receives sliced array of max 200
    const valuesCall = mockDb.values.mock.calls[0][0] as Array<unknown>;
    expect(valuesCall.length).toBeLessThanOrEqual(200);
  });
});

// ── Level-up e-posta bildirimi ────────────────────────────────────────────────

describe('UsersService — level-up e-posta bildirimi', () => {
  const testUser = {
    id: 'user-1',
    email: 'test@example.com',
    profile: { displayName: 'Test User' },
  };

  it('recordLevelAction: 3. p- aksiyonunda katilimci kademesine geçince e-posta gönderilir', async () => {
    // before: 2 p- → izleyici | after: 3 p- → katilimci
    mockDb.where
      .mockResolvedValueOnce([{ actionId: 'p-etkinlik' }, { actionId: 'p-anket' }])
      .mockResolvedValueOnce([{ actionId: 'p-etkinlik' }, { actionId: 'p-anket' }, { actionId: 'p-mentor' }]);
    mockDb.query.users.findFirst.mockResolvedValue(testUser);

    const service = makeService();
    await service.recordLevelAction('user-1', 'p-mentor');
    // void notifyLevelUp'ın mikro-görev zincirini tamamlamasına izin ver
    await Promise.resolve();
    await Promise.resolve();

    expect(mockEmailService.sendLevelUp).toHaveBeenCalledWith(
      'test@example.com',
      'Test User',
      'katilimci',
    );
  });

  it('recordLevelAction: aynı kademede kalınca e-posta gönderilmez', async () => {
    mockDb.where.mockResolvedValue([{ actionId: 'v-etkinlikler' }]);

    const service = makeService();
    await service.recordLevelAction('user-1', 'v-mentorluk');
    await Promise.resolve();
    await Promise.resolve();

    expect(mockEmailService.sendLevelUp).not.toHaveBeenCalled();
  });

  it('syncLevelActions: bulk sync ile etki_yaratan kademesine geçince e-posta gönderilir', async () => {
    // before: boş → izleyici | after: 1 d- → etki_yaratan
    mockDb.where
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ actionId: 'd-mentor-seans' }]);
    mockDb.query.users.findFirst.mockResolvedValue(testUser);

    const service = makeService();
    await service.syncLevelActions('user-1', ['d-mentor-seans']);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockEmailService.sendLevelUp).toHaveBeenCalledWith(
      'test@example.com',
      'Test User',
      'etki_yaratan',
    );
  });

  it('notifyLevelUp: kullanıcı bulunamazsa e-posta gönderilmez (graceful)', async () => {
    mockDb.where
      .mockResolvedValueOnce([{ actionId: 'p-etkinlik' }, { actionId: 'p-anket' }])
      .mockResolvedValueOnce([{ actionId: 'p-etkinlik' }, { actionId: 'p-anket' }, { actionId: 'p-mentor' }]);
    mockDb.query.users.findFirst.mockResolvedValue(null); // kullanıcı yok

    const service = makeService();
    await service.recordLevelAction('user-1', 'p-mentor');
    await Promise.resolve();
    await Promise.resolve();

    expect(mockEmailService.sendLevelUp).not.toHaveBeenCalled();
  });
});

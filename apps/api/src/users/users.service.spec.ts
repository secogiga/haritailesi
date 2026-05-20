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
  where: jest.fn().mockReturnThis(),
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

function makeService(): UsersService {
  return new UsersService(mockDb as any, mockRedis as any);
}

beforeEach(() => jest.clearAllMocks());

// ── getMe ─────────────────────────────────────────────────────────────────────

describe('UsersService.getMe', () => {
  it('throws NotFoundException when user does not exist', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(null);

    const service = makeService();
    await expect(service.getMe('nonexistent-id')).rejects.toThrow(NotFoundException);
  });

  it('returns user with badges when found', async () => {
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

    const service = makeService();
    const result = await service.getMe('user-1');

    expect(result.functionalRoles).toEqual(['content_moderator']);
    expect(result.badges).toEqual(['founding_member']);
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
    return (new UsersService(mockDb as any, mockRedis as any) as any).extractDisplayName(formData);
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

import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MemberProfileService } from './member-profile.service';
import { DomainEvent } from '../applications/events/domain-events';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-uuid',
  email: 'user@example.com',
  membershipTier: 'individual_member' as const,
  status: 'active',
  deletedAt: null,
  ...overrides,
});

const makeActor = () => ({
  id: 'actor-uuid',
  email: 'admin@example.com',
  roles: ['admin'],
});

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockDb = {
  query: {
    users: { findFirst: jest.fn() },
    userFunctionalRoles: { findFirst: jest.fn() },
    userProfiles: { findFirst: jest.fn() },
    membershipSubscriptions: { findFirst: jest.fn() },
  },
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockResolvedValue([]),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockResolvedValue([]),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
};

const mockEventEmitter = { emit: jest.fn() };
const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

function makeService(): MemberProfileService {
  return new MemberProfileService(
    mockDb as any,
    mockEventEmitter as any,
    mockAudit as any,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── activateMember ───────────────────────────────────────────────────────────

describe('MemberProfileService.activateMember', () => {
  it('throws NotFoundException when user not found', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(null);
    const service = makeService();
    await expect(
      service.activateMember('nonexistent', makeActor() as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('no-ops when user is already active', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(makeUser({ status: 'active' }));
    const service = makeService();
    await service.activateMember('user-uuid', makeActor() as any);
    expect(mockDb.update).not.toHaveBeenCalled();
    expect(mockEventEmitter.emit).not.toHaveBeenCalled();
  });

  it('updates status to active', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(makeUser({ status: 'passive' }));
    mockDb.query.userProfiles.findFirst.mockResolvedValue({ displayName: 'Test Kullanıcı' });
    const service = makeService();
    await service.activateMember('user-uuid', makeActor() as any);
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
  });

  it('emits MEMBER_ACTIVATED domain event', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(makeUser({ status: 'passive' }));
    mockDb.query.userProfiles.findFirst.mockResolvedValue({ displayName: 'Test' });
    const service = makeService();
    await service.activateMember('user-uuid', makeActor() as any);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      DomainEvent.MEMBER_ACTIVATED,
      expect.objectContaining({
        userId: 'user-uuid',
        email: 'user@example.com',
        actorId: 'actor-uuid',
      }),
    );
  });

  it('logs audit on activation', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(makeUser({ status: 'passive' }));
    mockDb.query.userProfiles.findFirst.mockResolvedValue(null);
    const service = makeService();
    await service.activateMember('user-uuid', makeActor() as any);
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'member.activated',
        entityType: 'user',
        entityId: 'user-uuid',
      }),
    );
  });
});

// ─── deactivateMember ─────────────────────────────────────────────────────────

describe('MemberProfileService.deactivateMember', () => {
  it('throws NotFoundException when user not found', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(null);
    const service = makeService();
    await expect(
      service.deactivateMember('nonexistent', makeActor() as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('no-ops when user is already passive', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(makeUser({ status: 'passive' }));
    const service = makeService();
    await service.deactivateMember('user-uuid', makeActor() as any);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('emits MEMBER_DEACTIVATED domain event', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(makeUser({ status: 'active' }));
    mockDb.query.userProfiles.findFirst.mockResolvedValue({ displayName: 'Test' });
    const service = makeService();
    await service.deactivateMember('user-uuid', makeActor() as any);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      DomainEvent.MEMBER_DEACTIVATED,
      expect.objectContaining({ userId: 'user-uuid' }),
    );
  });
});

// ─── assignRole ───────────────────────────────────────────────────────────────

describe('MemberProfileService.assignRole', () => {
  it('throws NotFoundException when user not found', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(null);
    const service = makeService();
    await expect(
      service.assignRole('nonexistent', 'mentor', makeActor() as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns already_active when role is already assigned', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(makeUser());
    mockDb.query.userFunctionalRoles.findFirst.mockResolvedValue({
      id: 'role-uuid',
      isActive: true,
    });
    const service = makeService();
    const result = await service.assignRole('user-uuid', 'mentor', makeActor() as any);
    expect(result.action).toBe('already_active');
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('re-activates a previously revoked role', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(makeUser());
    mockDb.query.userFunctionalRoles.findFirst.mockResolvedValue({
      id: 'role-uuid',
      isActive: false,
    });
    mockDb.query.userProfiles.findFirst.mockResolvedValue({ displayName: 'Test' });
    const service = makeService();
    const result = await service.assignRole('user-uuid', 'mentor', makeActor() as any);
    expect(result.action).toBe('assigned');
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('inserts new role when no existing record found', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(makeUser());
    mockDb.query.userFunctionalRoles.findFirst.mockResolvedValue(null);
    mockDb.query.userProfiles.findFirst.mockResolvedValue({ displayName: 'Test' });
    const service = makeService();
    const result = await service.assignRole('user-uuid', 'mentor', makeActor() as any);
    expect(result.action).toBe('assigned');
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('emits MEMBER_ROLE_ASSIGNED event on success', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(makeUser());
    mockDb.query.userFunctionalRoles.findFirst.mockResolvedValue(null);
    mockDb.query.userProfiles.findFirst.mockResolvedValue({ displayName: 'Test' });
    const service = makeService();
    await service.assignRole('user-uuid', 'moderator', makeActor() as any);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      DomainEvent.MEMBER_ROLE_ASSIGNED,
      expect.objectContaining({ userId: 'user-uuid', role: 'moderator' }),
    );
  });
});

// ─── removeRole ───────────────────────────────────────────────────────────────

describe('MemberProfileService.removeRole', () => {
  it('throws NotFoundException when active role not found', async () => {
    mockDb.query.userFunctionalRoles.findFirst.mockResolvedValue(null);
    const service = makeService();
    await expect(
      service.removeRole('user-uuid', 'mentor', makeActor() as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('sets isActive to false on removal', async () => {
    mockDb.query.userFunctionalRoles.findFirst.mockResolvedValue({ id: 'role-uuid', isActive: true });
    mockDb.query.users.findFirst.mockResolvedValue(makeUser());
    mockDb.query.userProfiles.findFirst.mockResolvedValue({ displayName: 'Test' });
    const service = makeService();
    const result = await service.removeRole('user-uuid', 'mentor', makeActor() as any);
    expect(result.action).toBe('removed');
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
  });

  it('emits MEMBER_ROLE_REMOVED event', async () => {
    mockDb.query.userFunctionalRoles.findFirst.mockResolvedValue({ id: 'role-uuid', isActive: true });
    mockDb.query.users.findFirst.mockResolvedValue(makeUser());
    mockDb.query.userProfiles.findFirst.mockResolvedValue({ displayName: 'Test' });
    const service = makeService();
    await service.removeRole('user-uuid', 'mentor', makeActor() as any);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      DomainEvent.MEMBER_ROLE_REMOVED,
      expect.objectContaining({ userId: 'user-uuid', role: 'mentor' }),
    );
  });
});

// ─── updateTier ───────────────────────────────────────────────────────────────

describe('MemberProfileService.updateTier', () => {
  it('throws NotFoundException when user not found', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(null);
    const service = makeService();
    await expect(
      service.updateTier('nonexistent', 'haritailesi_genc', makeActor() as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when tier is same', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(makeUser({ membershipTier: 'individual_member' }));
    const service = makeService();
    await expect(
      service.updateTier('user-uuid', 'individual_member', makeActor() as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('emits MEMBER_TIER_CHANGED event on success', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(makeUser({ membershipTier: 'individual_member' }));
    mockDb.query.userProfiles.findFirst.mockResolvedValue({ displayName: 'Test' });
    const service = makeService();
    await service.updateTier('user-uuid', 'haritailesi_genc', makeActor() as any);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      DomainEvent.MEMBER_TIER_CHANGED,
      expect.objectContaining({
        userId: 'user-uuid',
        fromTier: 'individual_member',
        toTier: 'haritailesi_genc',
      }),
    );
  });

  it('logs audit with fromTier and toTier', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(makeUser({ membershipTier: 'haritailesi_genc' }));
    mockDb.query.userProfiles.findFirst.mockResolvedValue(null);
    const service = makeService();
    await service.updateTier('user-uuid', 'new_graduate_member', makeActor() as any);
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'member.tier_changed',
        afterState: expect.objectContaining({ fromTier: 'haritailesi_genc', toTier: 'new_graduate_member' }),
      }),
    );
  });
});

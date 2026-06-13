import { BadRequestException } from '@nestjs/common';
import { UsersController } from './users.controller';

const mockUsersService = {
  getMe: jest.fn().mockResolvedValue({ id: 'u1' }),
  getMyStats: jest.fn().mockResolvedValue({ postCount: 5 }),
  getSuggestedMembers: jest.fn().mockResolvedValue([]),
  updateProfile: jest.fn().mockResolvedValue({ id: 'u1' }),
  listMembers: jest.fn().mockResolvedValue([]),
  getPublicProfile: jest.fn().mockResolvedValue({ id: 'u2' }),
  follow: jest.fn().mockResolvedValue({ ok: true }),
  unfollow: jest.fn().mockResolvedValue({ ok: true }),
  getFollowers: jest.fn().mockResolvedValue([]),
  getFollowing: jest.fn().mockResolvedValue([]),
  recordLevelAction: jest.fn().mockResolvedValue(['v-etkinlikler']),
  syncLevelActions: jest.fn().mockResolvedValue(['v-etkinlikler', 'p-mentor']),
};

const mockStorageService = {
  upload: jest.fn().mockResolvedValue({ url: 'https://cdn/avatar.jpg' }),
};

const mockRedis = {
  set: jest.fn().mockResolvedValue('OK'),
};

function makeController() {
  return new UsersController(mockUsersService as any, mockStorageService as any, mockRedis as any, {} as any);
}

const fakeUser = { id: 'u1', email: 'a@b.com', functionalRoles: [], permissions: [] } as any;

beforeEach(() => jest.clearAllMocks());

describe('UsersController.getMe', () => {
  it('passes userId to service', async () => {
    const ctrl = makeController();
    await ctrl.getMe(fakeUser);
    expect(mockUsersService.getMe).toHaveBeenCalledWith('u1');
  });
});

describe('UsersController.getMyStats', () => {
  it('delegates to service', async () => {
    const ctrl = makeController();
    await ctrl.getMyStats(fakeUser);
    expect(mockUsersService.getMyStats).toHaveBeenCalledWith('u1');
  });
});

describe('UsersController.getSuggestedMembers', () => {
  it('delegates to service', async () => {
    const ctrl = makeController();
    await ctrl.getSuggestedMembers(fakeUser);
    expect(mockUsersService.getSuggestedMembers).toHaveBeenCalledWith('u1');
  });
});

describe('UsersController.updateProfile', () => {
  it('passes userId and dto', async () => {
    const ctrl = makeController();
    const dto = { displayName: 'Ali' } as any;
    await ctrl.updateProfile(fakeUser, dto);
    expect(mockUsersService.updateProfile).toHaveBeenCalledWith('u1', dto);
  });
});

describe('UsersController.uploadAvatar', () => {
  it('throws BadRequestException when no file', async () => {
    const ctrl = makeController();
    await expect(ctrl.uploadAvatar(fakeUser, undefined as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException for disallowed mime', async () => {
    const ctrl = makeController();
    const file = { mimetype: 'image/tiff', buffer: Buffer.from('x'), originalname: 'x.tiff' } as any;
    await expect(ctrl.uploadAvatar(fakeUser, file)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uploads and updates profile for valid file', async () => {
    const ctrl = makeController();
    const file = { mimetype: 'image/jpeg', buffer: Buffer.from('x'), originalname: 'avatar.jpg' } as any;
    const result = await ctrl.uploadAvatar(fakeUser, file);
    expect(mockStorageService.upload).toHaveBeenCalled();
    expect(mockUsersService.updateProfile).toHaveBeenCalledWith('u1', { avatarUrl: 'https://cdn/avatar.jpg' });
    expect(result).toEqual({ avatarUrl: 'https://cdn/avatar.jpg' });
  });
});

describe('UsersController.getMember', () => {
  it('passes both id and viewerId', async () => {
    const ctrl = makeController();
    await ctrl.getMember(fakeUser, 'u2');
    expect(mockUsersService.getPublicProfile).toHaveBeenCalledWith('u2', 'u1');
  });
});

describe('UsersController.follow / unfollow', () => {
  it('follow calls service with follower and followee', async () => {
    const ctrl = makeController();
    await ctrl.follow(fakeUser, 'u2');
    expect(mockUsersService.follow).toHaveBeenCalledWith('u1', 'u2');
  });

  it('unfollow calls service with follower and followee', async () => {
    const ctrl = makeController();
    await ctrl.unfollow(fakeUser, 'u2');
    expect(mockUsersService.unfollow).toHaveBeenCalledWith('u1', 'u2');
  });
});

describe('UsersController.listMembers', () => {
  it('passes optional search query', async () => {
    const ctrl = makeController();
    await ctrl.listMembers('istanbul');
    expect(mockUsersService.listMembers).toHaveBeenCalledWith('istanbul');
  });

  it('works without query', async () => {
    const ctrl = makeController();
    await ctrl.listMembers();
    expect(mockUsersService.listMembers).toHaveBeenCalledWith(undefined);
  });
});

// ── recordAction ──────────────────────────────────────────────────────────────

describe('UsersController.recordAction', () => {
  it('calls recordLevelAction and returns completedActionIds', async () => {
    const ctrl = makeController();
    const result = await ctrl.recordAction(fakeUser, { actionId: 'v-etkinlikler' });

    expect(mockUsersService.recordLevelAction).toHaveBeenCalledWith('u1', 'v-etkinlikler');
    expect(result).toEqual({ completedActionIds: ['v-etkinlikler'] });
  });

  it('returns empty array when actionId is missing', async () => {
    const ctrl = makeController();
    const result = await ctrl.recordAction(fakeUser, { actionId: '' });

    expect(mockUsersService.recordLevelAction).not.toHaveBeenCalled();
    expect(result).toEqual({ completedActionIds: [] });
  });

  it('returns empty array when actionId is not a string', async () => {
    const ctrl = makeController();
    const result = await ctrl.recordAction(fakeUser, { actionId: 123 as any });

    expect(mockUsersService.recordLevelAction).not.toHaveBeenCalled();
    expect(result).toEqual({ completedActionIds: [] });
  });
});

// ── syncActions ───────────────────────────────────────────────────────────────

describe('UsersController.syncActions', () => {
  it('calls syncLevelActions with filtered string ids', async () => {
    const ctrl = makeController();
    const result = await ctrl.syncActions(fakeUser, { actionIds: ['v-etkinlikler', 'p-mentor'] });

    expect(mockUsersService.syncLevelActions).toHaveBeenCalledWith('u1', ['v-etkinlikler', 'p-mentor']);
    expect(result).toEqual({ completedActionIds: ['v-etkinlikler', 'p-mentor'] });
  });

  it('passes empty array when actionIds is not an array', async () => {
    const ctrl = makeController();
    await ctrl.syncActions(fakeUser, { actionIds: 'not-an-array' as any });

    expect(mockUsersService.syncLevelActions).toHaveBeenCalledWith('u1', []);
  });

  it('filters out non-string values from actionIds', async () => {
    const ctrl = makeController();
    await ctrl.syncActions(fakeUser, { actionIds: ['v-etkinlikler', 42, null, 'p-mentor'] as any });

    expect(mockUsersService.syncLevelActions).toHaveBeenCalledWith('u1', ['v-etkinlikler', 'p-mentor']);
  });

  it('filters out invalid (not whitelisted) action IDs', async () => {
    const ctrl = makeController();
    await ctrl.syncActions(fakeUser, { actionIds: ['v-etkinlikler', 'x-fake', '__proto__', 'p-mentor'] });

    expect(mockUsersService.syncLevelActions).toHaveBeenCalledWith('u1', ['v-etkinlikler', 'p-mentor']);
  });

  it('passes empty array when all IDs are invalid', async () => {
    const ctrl = makeController();
    await ctrl.syncActions(fakeUser, { actionIds: ['x-fake', 'y-bogus', ''] });

    expect(mockUsersService.syncLevelActions).toHaveBeenCalledWith('u1', []);
  });
});

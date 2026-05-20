import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PostsService, REACTION_TYPES } from './posts.service';

const mockDb = {
  query: {
    posts: { findFirst: jest.fn() },
    postReactions: { findFirst: jest.fn() },
    postBookmarks: { findFirst: jest.fn() },
    userProfiles: { findFirst: jest.fn() },
    pollOptions: { findFirst: jest.fn() },
    pollVotes: { findFirst: jest.fn() },
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
  execute: jest.fn().mockResolvedValue([]),
  returning: jest.fn().mockResolvedValue([{ id: 'post-1', authorId: 'user-1' }]),
};

const mockNotifications = {
  createNotification: jest.fn().mockResolvedValue(undefined),
};

const mockStorage = {
  getSignedUrl: jest.fn().mockResolvedValue('https://storage/img.jpg'),
  deleteObject: jest.fn().mockResolvedValue(undefined),
};

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  setex: jest.fn().mockResolvedValue('OK'),
};

function makeService(): PostsService {
  return new PostsService(mockDb as any, mockNotifications as any, mockStorage as any, mockRedis as any);
}

beforeEach(() => jest.clearAllMocks());

// ── REACTION_TYPES ────────────────────────────────────────────────────────────

describe('REACTION_TYPES', () => {
  it('contains exactly the four expected types', () => {
    expect(REACTION_TYPES).toEqual(['like', 'celebrate', 'support', 'insightful']);
  });
});

// ── react ─────────────────────────────────────────────────────────────────────

describe('PostsService.react', () => {
  it('throws BadRequestException for unknown reaction type', async () => {
    const service = makeService();
    await expect(
      service.react('user-1', 'post-1', 'angry' as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('inserts new reaction and returns reacted:true', async () => {
    mockDb.query.postReactions.findFirst.mockResolvedValue(null);

    const service = makeService();
    const result = await service.react('user-1', 'post-1', 'like');

    expect(result).toEqual({ reacted: true, type: 'like' });
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('removes reaction when same type toggled (toggle-off)', async () => {
    mockDb.query.postReactions.findFirst.mockResolvedValue({
      id: 'reaction-1',
      type: 'like',
    });

    const service = makeService();
    const result = await service.react('user-1', 'post-1', 'like');

    expect(result).toEqual({ reacted: false, type: null });
    expect(mockDb.delete).toHaveBeenCalled();
  });

  it('changes reaction type when different type submitted', async () => {
    mockDb.query.postReactions.findFirst.mockResolvedValue({
      id: 'reaction-1',
      type: 'like',
    });

    const service = makeService();
    const result = await service.react('user-1', 'post-1', 'celebrate');

    expect(result).toEqual({ reacted: true, type: 'celebrate' });
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('accepts all valid reaction types without throwing', async () => {
    mockDb.query.postReactions.findFirst.mockResolvedValue(null);
    const service = makeService();

    for (const type of REACTION_TYPES) {
      await expect(
        service.react('user-1', 'post-1', type),
      ).resolves.toEqual({ reacted: true, type });
    }
  });
});

// ── deletePost ────────────────────────────────────────────────────────────────

describe('PostsService.deletePost', () => {
  it('throws NotFoundException when post does not exist', async () => {
    mockDb.query.posts.findFirst.mockResolvedValue(null);

    const service = makeService();
    await expect(
      service.deletePost('user-1', 'nonexistent', false),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException when user is not the author', async () => {
    mockDb.query.posts.findFirst.mockResolvedValue({
      id: 'post-1',
      authorId: 'other-user',
      imageKey: null,
    });

    const service = makeService();
    await expect(
      service.deletePost('user-1', 'post-1', false),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows deletion by post author', async () => {
    mockDb.query.posts.findFirst.mockResolvedValue({
      id: 'post-1',
      authorId: 'user-1',
      imageKey: null,
    });

    const service = makeService();
    const result = await service.deletePost('user-1', 'post-1', false);
    expect(result).toMatchObject({ id: 'post-1' });
  });

  it('allows admin to delete any post', async () => {
    mockDb.query.posts.findFirst.mockResolvedValue({
      id: 'post-1',
      authorId: 'other-user',
      imageKey: null,
    });

    const service = makeService();
    const result = await service.deletePost('admin-1', 'post-1', true);
    expect(result).toMatchObject({ id: 'post-1' });
  });
});

import { BadRequestException } from '@nestjs/common';
import { PostsController } from './posts.controller';

const mockPostsService = {
  listPosts: jest.fn().mockResolvedValue({ data: [], next_cursor: null, has_more: false }),
  getPost: jest.fn().mockResolvedValue({ id: 'p1' }),
  createPost: jest.fn().mockResolvedValue({ id: 'p1' }),
  updatePost: jest.fn().mockResolvedValue({ id: 'p1' }),
  deletePost: jest.fn().mockResolvedValue({ ok: true }),
  pinPost: jest.fn().mockResolvedValue({ id: 'p1' }),
  toggleBookmark: jest.fn().mockResolvedValue({ bookmarked: true }),
  react: jest.fn().mockResolvedValue({ reactionCount: 1 }),
  listComments: jest.fn().mockResolvedValue([]),
  addComment: jest.fn().mockResolvedValue({ id: 'c1' }),
  deleteComment: jest.fn().mockResolvedValue({ ok: true }),
  voteOnPoll: jest.fn().mockResolvedValue({ ok: true }),
  getMyBookmarks: jest.fn().mockResolvedValue([]),
  uploadPostImage: jest.fn().mockResolvedValue({ imageUrl: 'https://x/img.jpg' }),
};

function makeController() {
  return new PostsController(mockPostsService as any);
}

const fakeUser = { id: 'u1', email: 'a@b.com', functionalRoles: [], permissions: [] } as any;

beforeEach(() => jest.clearAllMocks());

describe('PostsController.listPosts', () => {
  it('passes viewerId and query params to service', async () => {
    const ctrl = makeController();
    await ctrl.listPosts(fakeUser, undefined, undefined, undefined, undefined, undefined, undefined, 'following', 'hot');
    expect(mockPostsService.listPosts).toHaveBeenCalledWith(
      expect.objectContaining({ viewerId: 'u1', followingOnly: true, sort: 'hot' }),
    );
  });

  it('clamps limit to 50', async () => {
    const ctrl = makeController();
    await ctrl.listPosts(fakeUser, undefined, undefined, undefined, undefined, '999', undefined, undefined, undefined);
    expect(mockPostsService.listPosts).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 }),
    );
  });
});

describe('PostsController.getPost', () => {
  it('delegates to service with id and viewerId', async () => {
    const ctrl = makeController();
    await ctrl.getPost(fakeUser, 'p1');
    expect(mockPostsService.getPost).toHaveBeenCalledWith('p1', 'u1');
  });
});

describe('PostsController.createPost', () => {
  it('passes userId and dto to service', async () => {
    const ctrl = makeController();
    const dto = { type: 'general', category: 'cbs', body: 'hello' } as any;
    await ctrl.createPost(fakeUser, dto);
    expect(mockPostsService.createPost).toHaveBeenCalledWith('u1', dto);
  });
});

describe('PostsController.deletePost', () => {
  it('passes canDeleteAny=false for regular users', async () => {
    const ctrl = makeController();
    await ctrl.deletePost(fakeUser, 'p1');
    expect(mockPostsService.deletePost).toHaveBeenCalledWith('u1', 'p1', false);
  });

  it('passes canDeleteAny=true for moderators', async () => {
    const ctrl = makeController();
    const modUser = { ...fakeUser, functionalRoles: ['moderator'] };
    await ctrl.deletePost(modUser, 'p1');
    expect(mockPostsService.deletePost).toHaveBeenCalledWith('u1', 'p1', true);
  });
});

describe('PostsController.react', () => {
  it('delegates to service', async () => {
    const ctrl = makeController();
    const dto = { type: 'like' as const };
    await ctrl.react(fakeUser, 'p1', dto);
    expect(mockPostsService.react).toHaveBeenCalledWith('u1', 'p1', 'like');
  });
});

describe('PostsController.addComment', () => {
  it('passes parentId when provided', async () => {
    const ctrl = makeController();
    const dto = { body: 'nice', parentId: 'c-parent' };
    await ctrl.addComment(fakeUser, 'p1', dto);
    expect(mockPostsService.addComment).toHaveBeenCalledWith('u1', 'p1', 'nice', 'c-parent');
  });

  it('passes undefined parentId when absent', async () => {
    const ctrl = makeController();
    const dto = { body: 'nice' };
    await ctrl.addComment(fakeUser, 'p1', dto);
    expect(mockPostsService.addComment).toHaveBeenCalledWith('u1', 'p1', 'nice', undefined);
  });
});

describe('PostsController.uploadImage', () => {
  it('throws BadRequestException when no file provided', async () => {
    const ctrl = makeController();
    await expect(ctrl.uploadImage(fakeUser, 'p1', undefined as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException for invalid mime type', async () => {
    const ctrl = makeController();
    const file = { mimetype: 'image/gif', buffer: Buffer.from('x') } as any;
    await expect(ctrl.uploadImage(fakeUser, 'p1', file)).rejects.toBeInstanceOf(BadRequestException);
  });
});

import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

// Hoist bcrypt mock so it's available before imports resolve
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

const mockDb = {
  query: {
    users: { findFirst: jest.fn() },
    refreshTokens: { findFirst: jest.fn() },
    setupTokens: { findFirst: jest.fn() },
    passwordResetTokens: { findFirst: jest.fn() },
  },
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([{ id: 'user-1', email: 'test@example.com' }]),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockResolvedValue([]),
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

const mockConfig = {
  get: jest.fn().mockImplementation((key: string, def?: string) => def ?? null),
};

const mockEmail = {
  send: jest.fn().mockResolvedValue(undefined),
};

function makeService(): AuthService {
  return new AuthService(
    mockDb as any,
    mockJwt as any,
    mockConfig as any,
    mockEmail as any,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  // Restore default returning value
  mockDb.returning.mockResolvedValue([{ id: 'user-1', email: 'test@example.com' }]);
});

// ── login ────────────────────────────────────────────────────────────────────

describe('AuthService.login', () => {
  const activeUser = {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'hashed_password',
    membershipTier: 'registered_user',
    status: 'active',
    functionalRoles: [],
  };

  it('throws UnauthorizedException when user not found', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(null);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const service = makeService();
    await expect(
      service.login({ email: 'missing@example.com', password: 'any' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException on wrong password', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(activeUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const service = makeService();
    await expect(
      service.login({ email: 'user@example.com', password: 'wrongpass' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when account is suspended', async () => {
    mockDb.query.users.findFirst.mockResolvedValue({ ...activeUser, status: 'suspended' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const service = makeService();
    await expect(
      service.login({ email: 'user@example.com', password: 'correct' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('returns token pair on valid credentials', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(activeUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const service = makeService();
    const result = await service.login({ email: 'USER@EXAMPLE.COM', password: 'correct' });

    expect(result).toHaveProperty('accessToken', 'mock.jwt.token');
    expect(result).toHaveProperty('refreshToken');
  });
});

// ── changePassword ────────────────────────────────────────────────────────────

describe('AuthService.changePassword', () => {
  it('throws BadRequestException when current password is wrong', async () => {
    mockDb.query.users.findFirst.mockResolvedValue({
      id: 'user-1',
      passwordHash: 'stored_hash',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const service = makeService();
    await expect(
      service.changePassword('user-1', { currentPassword: 'wrong', newPassword: 'NewPass1' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates password hash when current password is correct', async () => {
    mockDb.query.users.findFirst.mockResolvedValue({
      id: 'user-1',
      passwordHash: 'stored_hash',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const service = makeService();
    await service.changePassword('user-1', { currentPassword: 'correct', newPassword: 'NewPass1' });

    expect(bcrypt.hash).toHaveBeenCalledWith('NewPass1', 12);
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: 'hashed_password' }),
    );
  });
});

// ── forgotPassword ────────────────────────────────────────────────────────────

describe('AuthService.forgotPassword', () => {
  it('returns silently when email not found (no enumeration)', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(null);

    const service = makeService();
    // Should NOT throw
    await expect(
      service.forgotPassword({ email: 'ghost@example.com' }),
    ).resolves.toBeUndefined();

    expect(mockEmail.send).not.toHaveBeenCalled();
  });

  it('sends reset email when user exists', async () => {
    mockDb.query.users.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      profile: { displayName: 'Test User' },
    });

    const service = makeService();
    await service.forgotPassword({ email: 'user@example.com' });

    expect(mockEmail.send).toHaveBeenCalledWith(
      'user@example.com',
      'forgot_password',
      expect.objectContaining({ displayName: 'Test User', resetUrl: expect.stringContaining('sifre-sifirla') }),
    );
  });
});

import { AuthController } from './auth.controller';

const mockAuthService = {
  register: jest.fn().mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' }),
  login: jest.fn().mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' }),
  refresh: jest.fn().mockResolvedValue({ accessToken: 'at2', refreshToken: 'rt2' }),
  logout: jest.fn().mockResolvedValue(undefined),
  logoutAll: jest.fn().mockResolvedValue(undefined),
  setupPassword: jest.fn().mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' }),
  forgotPassword: jest.fn().mockResolvedValue(undefined),
  resetPassword: jest.fn().mockResolvedValue(undefined),
  changePassword: jest.fn().mockResolvedValue(undefined),
};

const mockConfig = { get: jest.fn().mockReturnValue(undefined) };

// Fake Response that records cookie calls
function fakeRes() {
  return { cookie: jest.fn(), clearCookie: jest.fn() } as any;
}

function makeController() {
  return new AuthController(mockAuthService as any, mockConfig as any);
}

const fakeUser = { id: 'u1', email: 'a@b.com', functionalRoles: [], permissions: [] } as any;
const fakeReq  = { ip: '127.0.0.1', headers: { 'user-agent': 'jest' }, cookies: {} } as any;

beforeEach(() => jest.clearAllMocks());

describe('AuthController.register', () => {
  it('delegates to authService.register and sets cookies', async () => {
    const ctrl = makeController();
    const res  = fakeRes();
    const dto  = { email: 'a@b.com', password: 'pass123!', displayName: 'Test' } as any;
    await ctrl.register(dto, res);
    expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    expect(res.cookie).toHaveBeenCalledTimes(2);
  });
});

describe('AuthController.login', () => {
  it('passes ip and user-agent to authService.login', async () => {
    const ctrl = makeController();
    const res  = fakeRes();
    const dto  = { email: 'a@b.com', password: 'pass123!' } as any;
    await ctrl.login(dto, fakeReq, res);
    expect(mockAuthService.login).toHaveBeenCalledWith(dto, '127.0.0.1', 'jest');
  });

  it('sets cookies and returns token pair', async () => {
    const ctrl   = makeController();
    const res    = fakeRes();
    const result = await ctrl.login({ email: 'a@b.com', password: 'p' } as any, fakeReq, res);
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(res.cookie).toHaveBeenCalledTimes(2);
  });
});

describe('AuthController.refresh', () => {
  it('delegates with userId and refreshToken, sets cookies', async () => {
    const ctrl = makeController();
    const res  = fakeRes();
    const user = { ...fakeUser, refreshToken: 'rt-old' };
    await ctrl.refresh(user, {} as any, fakeReq, res);
    expect(mockAuthService.refresh).toHaveBeenCalledWith('u1', 'rt-old');
    expect(res.cookie).toHaveBeenCalledTimes(2);
  });
});

describe('AuthController.logout', () => {
  it('passes userId and body refreshToken, clears cookies', async () => {
    const ctrl = makeController();
    const res  = fakeRes();
    const dto  = { refreshToken: 'rt' } as any;
    await ctrl.logout(fakeUser, dto, fakeReq, res);
    expect(mockAuthService.logout).toHaveBeenCalledWith('u1', 'rt');
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
  });

  it('falls back to cookie when no body refreshToken', async () => {
    const ctrl    = makeController();
    const res     = fakeRes();
    const reqWithCookie = { ...fakeReq, cookies: { hi_refresh: 'cookie-rt' } } as any;
    await ctrl.logout(fakeUser, {} as any, reqWithCookie, res);
    expect(mockAuthService.logout).toHaveBeenCalledWith('u1', 'cookie-rt');
  });
});

describe('AuthController.forgotPassword', () => {
  it('delegates to service', async () => {
    const ctrl = makeController();
    const dto  = { email: 'a@b.com' } as any;
    await ctrl.forgotPassword(dto);
    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(dto);
  });
});

describe('AuthController.changePassword', () => {
  it('passes userId to service', async () => {
    const ctrl = makeController();
    const dto  = { currentPassword: 'old', newPassword: 'new' } as any;
    await ctrl.changePassword(fakeUser, dto);
    expect(mockAuthService.changePassword).toHaveBeenCalledWith('u1', dto);
  });
});

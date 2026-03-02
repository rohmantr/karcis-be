import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { CookieHelper } from '../../../common/helpers/cookie.helper';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;
  let cookieHelper: CookieHelper;

  const mockAuthService = {
    register: jest
      .fn()
      .mockResolvedValue({ id: '1', email: 'test@test.com', name: 'Test' }),
    login: jest
      .fn()
      .mockResolvedValue({ accessToken: 'token', refreshToken: 'rt-token' }),
    refreshToken: jest
      .fn()
      .mockResolvedValue({ accessToken: 'newtoken', refreshToken: 'new-rt' }),
    logout: jest.fn().mockResolvedValue({ message: 'Logout successful' }),
  };

  const mockCookieHelper = {
    setAuthCookies: jest.fn(),
    clearAuthCookies: jest.fn(),
  };

  const mockReply = {
    setCookie: jest.fn(),
    clearCookie: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: CookieHelper, useValue: mockCookieHelper },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    cookieHelper = module.get<CookieHelper>(CookieHelper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register a user', async () => {
    const dto = {
      name: 'Test',
      email: 'test@test.com',
      password: 'Password1!',
    };
    expect(await controller.register(dto)).toEqual({
      id: '1',
      email: 'test@test.com',
      name: 'Test',
    });
    expect(service.register).toHaveBeenCalledWith(dto);
  });

  it('should login, set cookies, and return accessToken', async () => {
    const dto = { email: 'test@test.com', password: 'Password1!' };
    const mockReq = {
      headers: { 'user-agent': 'Mozilla/5.0' },
      ip: '127.0.0.1',
    };

    const result = await controller.login(
      dto,
      mockReq as never,
      mockReply as never,
    );

    expect(result).toEqual({ accessToken: 'token' });
    expect(service.login).toHaveBeenCalledWith(
      dto,
      'Mozilla/5.0',
      '127.0.0.1',
    );
    expect(cookieHelper.setAuthCookies).toHaveBeenCalledWith(mockReply, {
      accessToken: 'token',
      refreshToken: 'rt-token',
    });
  });

  it('should extract x-forwarded-for IP on login', async () => {
    const dto = { email: 'test@test.com', password: 'Password1!' };
    const mockReq = {
      headers: {
        'user-agent': 'Mozilla/5.0',
        'x-forwarded-for': '203.0.113.50, 70.41.3.18',
      },
      ip: '127.0.0.1',
    };
    await controller.login(dto, mockReq as never, mockReply as never);
    expect(service.login).toHaveBeenCalledWith(
      dto,
      'Mozilla/5.0',
      '203.0.113.50',
    );
  });

  it('should refresh token from cookie and set new cookies', async () => {
    const dto = {};
    const mockReq = {
      headers: { 'user-agent': 'Mozilla/5.0' },
      ip: '127.0.0.1',
      cookies: { refresh_token: 'cookie-rt' },
    };

    const result = await controller.refreshToken(
      dto,
      mockReq as never,
      mockReply as never,
    );

    expect(result).toEqual({ accessToken: 'newtoken' });
    expect(service.refreshToken).toHaveBeenCalledWith(
      { refreshToken: 'cookie-rt' },
      'Mozilla/5.0',
      '127.0.0.1',
    );
    expect(cookieHelper.setAuthCookies).toHaveBeenCalledWith(mockReply, {
      accessToken: 'newtoken',
      refreshToken: 'new-rt',
    });
  });

  it('should refresh token from body when no cookie', async () => {
    const dto = { refreshToken: 'body-rt' };
    const mockReq = {
      headers: { 'user-agent': 'Mozilla/5.0' },
      ip: '127.0.0.1',
      cookies: {},
    };

    await controller.refreshToken(dto, mockReq as never, mockReply as never);

    expect(service.refreshToken).toHaveBeenCalledWith(
      { refreshToken: 'body-rt' },
      'Mozilla/5.0',
      '127.0.0.1',
    );
  });

  it('should logout, clear cookies, and pass refresh token from cookie', async () => {
    const user = { id: '1' } as never;
    const mockReq = {
      cookies: { refresh_token: 'cookie-rt' },
    };

    const result = await controller.logout(
      user,
      mockReq as never,
      mockReply as never,
    );

    expect(result).toEqual({ message: 'Logout successful' });
    expect(service.logout).toHaveBeenCalledWith('1', 'cookie-rt');
    expect(cookieHelper.clearAuthCookies).toHaveBeenCalledWith(mockReply);
  });

  it('should logout without cookie refresh token', async () => {
    const user = { id: '1' } as never;
    const mockReq = { cookies: {} };

    await controller.logout(user, mockReq as never, mockReply as never);

    expect(service.logout).toHaveBeenCalledWith('1', undefined);
    expect(cookieHelper.clearAuthCookies).toHaveBeenCalledWith(mockReply);
  });
});

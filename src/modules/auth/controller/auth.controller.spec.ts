import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest
      .fn()
      .mockResolvedValue({ id: '1', email: 'test@test.com', name: 'Test' }),
    login: jest
      .fn()
      .mockResolvedValue({ accessToken: 'token', refreshToken: 'token' }),
    refreshToken: jest
      .fn()
      .mockResolvedValue({ accessToken: 'newtoken', refreshToken: 'newtoken' }),
    logout: jest.fn().mockResolvedValue({ message: 'Logout successful' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
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

  it('should login a user with device info', async () => {
    const dto = { email: 'test@test.com', password: 'Password1!' };
    const mockReq = {
      headers: { 'user-agent': 'Mozilla/5.0' },
      ip: '127.0.0.1',
    };
    expect(await controller.login(dto, mockReq as never)).toEqual({
      accessToken: 'token',
      refreshToken: 'token',
    });
    expect(service.login).toHaveBeenCalledWith(dto, 'Mozilla/5.0', '127.0.0.1');
  });

  it('should extract x-forwarded-for IP', async () => {
    const dto = { email: 'test@test.com', password: 'Password1!' };
    const mockReq = {
      headers: {
        'user-agent': 'Mozilla/5.0',
        'x-forwarded-for': '203.0.113.50, 70.41.3.18',
      },
      ip: '127.0.0.1',
    };
    await controller.login(dto, mockReq as never);
    expect(service.login).toHaveBeenCalledWith(
      dto,
      'Mozilla/5.0',
      '203.0.113.50',
    );
  });

  it('should refresh token with device info', async () => {
    const dto = { refreshToken: 'token' };
    const mockReq = {
      headers: { 'user-agent': 'Mozilla/5.0' },
      ip: '127.0.0.1',
    };
    expect(await controller.refreshToken(dto, mockReq as never)).toEqual({
      accessToken: 'newtoken',
      refreshToken: 'newtoken',
    });
    expect(service.refreshToken).toHaveBeenCalledWith(
      dto,
      'Mozilla/5.0',
      '127.0.0.1',
    );
  });

  it('should logout a user', async () => {
    const user = { id: '1' } as never;
    expect(await controller.logout(user)).toEqual({
      message: 'Logout successful',
    });
    expect(service.logout).toHaveBeenCalledWith('1');
  });
});

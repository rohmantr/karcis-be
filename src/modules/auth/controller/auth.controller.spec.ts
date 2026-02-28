import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn().mockResolvedValue({ id: '1', email: 'test@test.com' }),
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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register a user', async () => {
    const dto = { email: 'test@test.com', password: 'password' } as any;
    expect(await controller.register(dto)).toEqual({
      id: '1',
      email: 'test@test.com',
    });
    expect(service.register).toHaveBeenCalledWith(dto);
  });

  it('should login a user', async () => {
    const dto = { email: 'test@test.com', password: 'password' } as any;
    expect(await controller.login(dto)).toEqual({
      accessToken: 'token',
      refreshToken: 'token',
    });
    expect(service.login).toHaveBeenCalledWith(dto);
  });

  it('should refresh token', async () => {
    const dto = { refreshToken: 'token' } as any;
    expect(await controller.refreshToken(dto)).toEqual({
      accessToken: 'newtoken',
      refreshToken: 'newtoken',
    });
    expect(service.refreshToken).toHaveBeenCalledWith(dto);
  });

  it('should logout a user', async () => {
    const user = { id: '1' } as any;
    expect(await controller.logout(user)).toEqual({
      message: 'Logout successful',
    });
    expect(service.logout).toHaveBeenCalledWith('1');
  });
});

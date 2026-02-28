import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserRepository } from '../../users/repositories/user.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Record<string, jest.Mock>;
  let jwtService: Record<string, jest.Mock>;

  const mockUser = {
    id: 'test-id',
    email: 'test@example.com',
    password: 'hashed-password',
    refreshToken: 'old-refresh-token',
    refreshTokenExpiresAt: new Date(Date.now() + 100000),
  } as User;

  beforeEach(async () => {
    userRepository = {
      findByEmail: jest.fn(),
      findOne: jest.fn(),
      create: jest
        .fn()
        .mockImplementation((dto) => ({ ...dto, id: 'test-id' })),
      getEntityManager: jest.fn().mockReturnValue({
        persistAndFlush: jest.fn(),
        flush: jest.fn(),
      }),
    };

    jwtService = {
      sign: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'UserRepository', useValue: userRepository },
        { provide: JwtService, useValue: jwtService },
        { 
          provide: ConfigService, 
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'JWT_ACCESS_SECRET') return 'access-secret';
              if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
              if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
              if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw ConflictException if user already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully register a new user', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.register({
        email: 'new@example.com',
        password: 'password123',
      });

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          password: 'hashed-password',
        }),
      );
      expect(
        userRepository.getEntityManager().persistAndFlush,
      ).toHaveBeenCalled();
      expect(result).toEqual({ id: 'test-id', email: 'new@example.com' });
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on successful login', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(
        userRepository.getEntityManager().persistAndFlush,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ refreshToken: 'hashed-refresh-token' }),
      );
    });
  });

  describe('refreshToken', () => {
    it('should throw UnauthorizedException if token verification fails', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(
        service.refreshToken({ refreshToken: 'invalid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'test-id',
        email: 'test@example.com',
      });
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.refreshToken({ refreshToken: 'valid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return new tokens on successful refresh', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'test-id',
        email: 'test@example.com',
      });
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-refresh-token');
      jwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshToken({
        refreshToken: 'valid-token',
      });

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(
        userRepository.getEntityManager().persistAndFlush,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ refreshToken: 'new-hashed-refresh-token' }),
      );
    });
  });

  describe('logout', () => {
    it('should clear refresh token on logout', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.logout('test-id');

      expect(mockUser.refreshToken).toBeUndefined();
      expect(mockUser.refreshTokenExpiresAt).toBeUndefined();
      expect(userRepository.getEntityManager().flush).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Logout successful' });
    });

    it('should return success even if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.logout('test-id');

      expect(result).toEqual({ message: 'Logout successful' });
    });
  });
});

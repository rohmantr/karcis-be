import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { UserRole } from '../../../common/entities/enums';
import { EntityManager } from '@mikro-orm/postgresql';
import { TokenHelper } from '../../../common/helpers/token.helper';
import { PasswordHelper } from '../../../common/helpers/password.helper';

jest.mock('@mikro-orm/core', () => {
  const actual = jest.requireActual('@mikro-orm/core');
  return {
    ...actual,
    CreateRequestContext:
      () => (_target: unknown, _key: string, descriptor: PropertyDescriptor) =>
        descriptor,
  };
});

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: Record<string, jest.Mock>;
  let refreshRepo: Record<string, jest.Mock>;
  let mockEm: Record<string, jest.Mock>;
  let tokenHelper: Record<string, jest.Mock>;
  let passwordHelper: Record<string, jest.Mock>;

  const activeUser = {
    id: 'u-1',
    name: 'Active User',
    email: 'active@test.com',
    passwordHash: 'hashed',
    role: UserRole.USER,
    isActive: true,
  } as User;

  const inactiveUser = {
    ...activeUser,
    id: 'u-2',
    isActive: false,
  } as unknown as User;

  beforeEach(async () => {
    userRepo = {
      findByEmail: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'u-1' })),
    };

    refreshRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'rt-1' })),
      findValidByTokenHash: jest.fn(),
      revokeAllByUserId: jest.fn().mockResolvedValue(1),
      revokeByTokenHash: jest.fn(),
    };

    mockEm = {
      getRepository: jest.fn((entity) => {
        if (entity === User) return userRepo;
        if (entity === RefreshToken) return refreshRepo;
        return {};
      }),
      persistAndFlush: jest.fn(),
    };

    tokenHelper = {
      generateTokenPair: jest.fn().mockReturnValue({
        accessToken: 'at',
        refreshToken: 'rt',
      }),
      verifyRefreshToken: jest.fn(),
      hashToken: jest.fn().mockReturnValue('hashed-token'),
      getRefreshTokenExpiry: jest.fn().mockReturnValue(new Date('2026-03-08')),
    };

    passwordHelper = {
      hash: jest.fn().mockResolvedValue('hashed-pw'),
      compare: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: EntityManager, useValue: mockEm },
        { provide: TokenHelper, useValue: tokenHelper },
        { provide: PasswordHelper, useValue: passwordHelper },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── register ────────────────────────────────────────────

  describe('register', () => {
    it('rejects duplicate email', async () => {
      userRepo.findByEmail.mockResolvedValue(activeUser);

      await expect(
        service.register({
          name: 'X',
          email: 'active@test.com',
          password: 'Abc123!@',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates user with hashed password via PasswordHelper', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      const result = await service.register({
        name: 'New',
        email: 'new@test.com',
        phone: '08123',
        password: 'Abc123!@',
      });

      expect(passwordHelper.hash).toHaveBeenCalledWith('Abc123!@');
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New',
          passwordHash: 'hashed-pw',
          role: UserRole.USER,
        }),
      );
      expect(mockEm.persistAndFlush).toHaveBeenCalled();
      expect(result).toEqual({ id: 'u-1', email: 'new@test.com', name: 'New' });
    });
  });

  // ── login ───────────────────────────────────────────────

  describe('login', () => {
    it('rejects unknown email', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'x@x.com', password: 'pw' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects inactive user', async () => {
      userRepo.findByEmail.mockResolvedValue(inactiveUser);

      await expect(
        service.login({ email: 'x@x.com', password: 'pw' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects wrong password', async () => {
      userRepo.findByEmail.mockResolvedValue(activeUser);
      passwordHelper.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'x@x.com', password: 'bad' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns tokens and persists refresh token record', async () => {
      userRepo.findByEmail.mockResolvedValue(activeUser);
      passwordHelper.compare.mockResolvedValue(true);

      const result = await service.login(
        { email: 'active@test.com', password: 'pw' },
        'UA',
        '1.2.3.4',
      );

      expect(result).toEqual({ accessToken: 'at', refreshToken: 'rt' });
      expect(tokenHelper.generateTokenPair).toHaveBeenCalledWith(activeUser);
      expect(tokenHelper.hashToken).toHaveBeenCalledWith('rt');
      expect(refreshRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: activeUser,
          tokenHash: 'hashed-token',
          deviceInfo: 'UA',
          ipAddress: '1.2.3.4',
        }),
      );
      expect(mockEm.persistAndFlush).toHaveBeenCalled();
    });
  });

  // ── refreshToken ────────────────────────────────────────

  describe('refreshToken', () => {
    it('rejects invalid JWT', async () => {
      tokenHelper.verifyRefreshToken.mockRejectedValue(new Error('bad'));

      await expect(
        service.refreshToken({ refreshToken: 'bad-jwt' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects when refreshToken is missing', async () => {
      await expect(
        service.refreshToken({}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('revokes all sessions on token reuse', async () => {
      tokenHelper.verifyRefreshToken.mockResolvedValue({ sub: 'u-1' });
      refreshRepo.findValidByTokenHash.mockResolvedValue(null);

      await expect(
        service.refreshToken({ refreshToken: 'reused' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(refreshRepo.revokeAllByUserId).toHaveBeenCalledWith('u-1');
    });

    it('rejects inactive user during refresh', async () => {
      tokenHelper.verifyRefreshToken.mockResolvedValue({ sub: 'u-2' });
      refreshRepo.findValidByTokenHash.mockResolvedValue({
        id: 'rt-old',
        user: inactiveUser,
      });

      await expect(
        service.refreshToken({ refreshToken: 'valid-jwt' }),
      ).rejects.toThrow(ForbiddenException);
      expect(refreshRepo.revokeAllByUserId).toHaveBeenCalledWith('u-2');
    });

    it('rotates tokens and revokes old hash', async () => {
      tokenHelper.verifyRefreshToken.mockResolvedValue({ sub: 'u-1' });
      refreshRepo.findValidByTokenHash.mockResolvedValue({
        id: 'rt-old',
        user: activeUser,
      });

      const result = await service.refreshToken({ refreshToken: 'old-jwt' });

      expect(result).toEqual({ accessToken: 'at', refreshToken: 'rt' });
      expect(refreshRepo.revokeByTokenHash).toHaveBeenCalled();
      expect(refreshRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ user: activeUser }),
      );
      expect(mockEm.persistAndFlush).toHaveBeenCalled();
    });
  });

  // ── logout ──────────────────────────────────────────────

  describe('logout', () => {
    it('revokes specific token when provided', async () => {
      const result = await service.logout('u-1', 'some-token');

      expect(tokenHelper.hashToken).toHaveBeenCalledWith('some-token');
      expect(refreshRepo.revokeByTokenHash).toHaveBeenCalledWith(
        'hashed-token',
      );
      expect(result).toEqual({ message: 'Logout successful' });
    });

    it('revokes all sessions when no token provided', async () => {
      const result = await service.logout('u-1');

      expect(refreshRepo.revokeAllByUserId).toHaveBeenCalledWith('u-1');
      expect(result).toEqual({ message: 'Logout successful' });
    });
  });

  // ── revokeAllSessions ───────────────────────────────────

  describe('revokeAllSessions', () => {
    it('revokes all refresh tokens for user', async () => {
      refreshRepo.revokeAllByUserId.mockResolvedValue(3);

      const result = await service.revokeAllSessions('u-1');

      expect(refreshRepo.revokeAllByUserId).toHaveBeenCalledWith('u-1');
      expect(result).toBe(3);
    });
  });
});

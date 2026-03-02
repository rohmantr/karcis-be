import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CreateRequestContext } from '@mikro-orm/core';
import { User } from '../../users/entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { UserRole } from '../../../common/entities/enums';
import { UserRepository } from '../../users/repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { TokenHelper } from '../../../common/helpers/token.helper';
import { PasswordHelper } from '../../../common/helpers/password.helper';

@Injectable()
export class AuthService {
  constructor(
    private readonly em: EntityManager,
    private readonly tokenHelper: TokenHelper,
    private readonly passwordHelper: PasswordHelper,
  ) { }

  private get userRepository(): UserRepository {
    return this.em.getRepository(User);
  }

  private get refreshTokenRepository(): RefreshTokenRepository {
    return this.em.getRepository(RefreshToken);
  }

  @CreateRequestContext()
  async register(registerDto: RegisterDto) {
    const { name, email, phone, password } = registerDto;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await this.passwordHelper.hash(password);
    const user = this.userRepository.create({
      name,
      email,
      phone,
      passwordHash,
      role: UserRole.USER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.em.persistAndFlush(user);

    return { id: user.id, email: user.email, name: user.name };
  }

  @CreateRequestContext()
  async login(loginDto: LoginDto, deviceInfo?: string, ipAddress?: string) {
    const user = await this.validateCredentials(loginDto);
    const tokens = this.tokenHelper.generateTokenPair(user);

    await this.persistRefreshToken(
      user,
      tokens.refreshToken,
      deviceInfo,
      ipAddress,
    );

    return tokens;
  }

  @CreateRequestContext()
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
    deviceInfo?: string,
    ipAddress?: string,
  ) {
    const { refreshToken } = refreshTokenDto;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      const payload = await this.tokenHelper.verifyRefreshToken(refreshToken);
      const tokenHash = this.tokenHelper.hashToken(refreshToken);

      const storedToken =
        await this.refreshTokenRepository.findValidByTokenHash(tokenHash);
      if (!storedToken) {
        await this.refreshTokenRepository.revokeAllByUserId(payload.sub);
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = storedToken.user;
      if (!user.isActive) {
        await this.refreshTokenRepository.revokeAllByUserId(user.id);
        throw new ForbiddenException('Account is deactivated');
      }

      const tokens = this.tokenHelper.generateTokenPair(user);
      const newRefreshToken = await this.persistRefreshToken(
        user,
        tokens.refreshToken,
        deviceInfo,
        ipAddress,
      );

      await this.refreshTokenRepository.revokeByTokenHash(
        tokenHash,
        newRefreshToken.id,
      );

      return tokens;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @CreateRequestContext()
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.refreshTokenRepository.revokeByTokenHash(
        this.tokenHelper.hashToken(refreshToken),
      );
    } else {
      await this.refreshTokenRepository.revokeAllByUserId(userId);
    }
    return { message: 'Logout successful' };
  }

  @CreateRequestContext()
  async revokeAllSessions(userId: string): Promise<number> {
    return this.refreshTokenRepository.revokeAllByUserId(userId);
  }

  private async validateCredentials(loginDto: LoginDto): Promise<User> {
    const { email, password } = loginDto;
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    const isValid = await this.passwordHelper.compare(
      password,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private async persistRefreshToken(
    user: User,
    rawToken: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<RefreshToken> {
    const entity = this.refreshTokenRepository.create({
      user,
      tokenHash: this.tokenHelper.hashToken(rawToken),
      expiresAt: this.tokenHelper.getRefreshTokenExpiry(),
      createdAt: new Date(),
      deviceInfo,
      ipAddress,
    });
    await this.em.persistAndFlush(entity);
    return entity;
  }
}

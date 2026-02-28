import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from 'src/modules/users/repositories/user.repository';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
    });
    await this.userRepository.getEntityManager().persistAndFlush(user);
    return {
      id: user.id,
      email: user.email,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(user.id, user.email);

    user.refreshToken = tokens.refreshToken;
    user.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.userRepository.getEntityManager().persistAndFlush(user);
    return tokens;
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
      }>(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });

      const user = await this.userRepository.findOne({
        id: payload.sub,
        refreshToken: refreshToken,
      });
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = this.generateTokens(user.id, user.email);

      user.refreshToken = tokens.refreshToken;
      user.refreshTokenExpiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      );
      await this.userRepository.getEntityManager().persistAndFlush(user);
      return tokens;
    } catch (_error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    const user = await this.userRepository.findOne({ id: userId });
    if (user) {
      user.refreshToken = null;
      user.refreshTokenExpiresAt = null;
      await this.userRepository.getEntityManager().flush();
    }
    return {
      message: 'Logout successful',
    };
  }

  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
      secret: process.env.JWT_ACCESS_SECRET,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      secret: process.env.JWT_REFRESH_SECRET,
    });

    return { accessToken, refreshToken };
  }
}

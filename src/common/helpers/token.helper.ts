import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { User } from '../../modules/users/entities/user.entity';
import { TokenPair, RefreshTokenPayload } from '../interfaces/auth.interface';

export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class TokenHelper {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    generateTokenPair(user: Pick<User, 'id' | 'email' | 'role'>): TokenPair {
        const payload = { sub: user.id, email: user.email, role: user.role };

        return {
            accessToken: this.sign(payload, 'JWT_ACCESS_SECRET', 'JWT_ACCESS_EXPIRES_IN'),
            refreshToken: this.sign(payload, 'JWT_REFRESH_SECRET', 'JWT_REFRESH_EXPIRES_IN'),
        };
    }

    async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
        return this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        });
    }

    hashToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    getRefreshTokenExpiry(): Date {
        return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    }

    private sign(
        payload: Record<string, unknown>,
        secretKey: string,
        expiresKey: string,
    ): string {
        return this.jwtService.sign(
            { ...payload, jti: randomUUID() },
            {
                expiresIn: this.configService.get(expiresKey),
                secret: this.configService.get(secretKey),
            } as JwtSignOptions,
        );
    }
}

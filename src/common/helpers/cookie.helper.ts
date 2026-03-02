import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply } from 'fastify';
import { TokenPair } from '../interfaces/auth.interface';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/v1/auth/refresh-token';

@Injectable()
export class CookieHelper {
    constructor(private readonly configService: ConfigService) { }

    setAuthCookies(reply: FastifyReply, tokens: TokenPair): void {
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        const accessMaxAge = this.parseDurationToMs(
            this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
        );
        const refreshMaxAge = this.parseDurationToMs(
            this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
        );

        reply.setCookie(ACCESS_COOKIE, tokens.accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/api',
            maxAge: Math.floor(accessMaxAge / 1000),
        });

        reply.setCookie(REFRESH_COOKIE, tokens.refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'strict',
            path: REFRESH_COOKIE_PATH,
            maxAge: Math.floor(refreshMaxAge / 1000),
        });
    }

    clearAuthCookies(reply: FastifyReply): void {
        reply.clearCookie(ACCESS_COOKIE, { path: '/api' });
        reply.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
    }

    parseDurationToMs(duration: string): number {
        const match = duration.match(/^(\d+)([smhd])$/);
        if (!match) return 15 * 60 * 1000;

        const value = parseInt(match[1], 10);
        const unit = match[2];
        const multipliers: Record<string, number> = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
        };
        return value * (multipliers[unit] ?? 60 * 1000);
    }
}

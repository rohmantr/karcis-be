import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CookieHelper } from './cookie.helper';

describe('CookieHelper', () => {
    let helper: CookieHelper;
    let configService: Record<string, jest.Mock>;

    beforeEach(async () => {
        configService = {
            get: jest.fn((key: string, defaultValue?: string) => {
                const map: Record<string, string> = {
                    NODE_ENV: 'development',
                    JWT_ACCESS_EXPIRES_IN: '15m',
                    JWT_REFRESH_EXPIRES_IN: '7d',
                };
                return map[key] ?? defaultValue;
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CookieHelper,
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        helper = module.get(CookieHelper);
    });

    describe('setAuthCookies', () => {
        it('sets both access and refresh cookies', () => {
            const reply = { setCookie: jest.fn() } as never;
            const tokens = { accessToken: 'at-123', refreshToken: 'rt-456' };

            helper.setAuthCookies(reply, tokens);

            expect((reply as Record<string, jest.Mock>).setCookie).toHaveBeenCalledTimes(2);
            expect((reply as Record<string, jest.Mock>).setCookie).toHaveBeenCalledWith(
                'access_token',
                'at-123',
                expect.objectContaining({
                    httpOnly: true,
                    secure: false,
                    sameSite: 'lax',
                    path: '/api',
                }),
            );
            expect((reply as Record<string, jest.Mock>).setCookie).toHaveBeenCalledWith(
                'refresh_token',
                'rt-456',
                expect.objectContaining({
                    httpOnly: true,
                    secure: false,
                    sameSite: 'strict',
                    path: '/api/v1/auth/refresh-token',
                }),
            );
        });

        it('sets secure flag in production', () => {
            configService.get.mockImplementation((key: string) => {
                const map: Record<string, string> = {
                    NODE_ENV: 'production',
                    JWT_ACCESS_EXPIRES_IN: '15m',
                    JWT_REFRESH_EXPIRES_IN: '7d',
                };
                return map[key];
            });

            const reply = { setCookie: jest.fn() } as never;
            helper.setAuthCookies(reply, {
                accessToken: 'at',
                refreshToken: 'rt',
            });

            expect((reply as Record<string, jest.Mock>).setCookie).toHaveBeenCalledWith(
                'access_token',
                'at',
                expect.objectContaining({ secure: true }),
            );
        });
    });

    describe('clearAuthCookies', () => {
        it('clears both cookies', () => {
            const reply = { clearCookie: jest.fn() } as never;

            helper.clearAuthCookies(reply);

            expect((reply as Record<string, jest.Mock>).clearCookie).toHaveBeenCalledTimes(2);
            expect((reply as Record<string, jest.Mock>).clearCookie).toHaveBeenCalledWith(
                'access_token',
                { path: '/api' },
            );
            expect((reply as Record<string, jest.Mock>).clearCookie).toHaveBeenCalledWith(
                'refresh_token',
                { path: '/api/v1/auth/refresh-token' },
            );
        });
    });

    describe('parseDurationToMs', () => {
        it.each([
            ['15m', 15 * 60 * 1000],
            ['7d', 7 * 24 * 60 * 60 * 1000],
            ['30s', 30 * 1000],
            ['2h', 2 * 60 * 60 * 1000],
        ])('parses %s to %d ms', (input, expected) => {
            expect(helper.parseDurationToMs(input)).toBe(expected);
        });

        it('throws error for invalid format', () => {
            expect(() => helper.parseDurationToMs('invalid')).toThrow(
                'Invalid duration format',
            );
        });
    });
});

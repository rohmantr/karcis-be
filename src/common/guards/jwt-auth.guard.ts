import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = never>(
    err: unknown,
    user: unknown,
    _info: unknown,
    _context: unknown,
    _status?: unknown,
  ): TUser {
    if (err || !user) {
      throw err instanceof Error
        ? err
        : new UnauthorizedException(
            'Authentication token is missing or invalid',
          );
    }
    return user as TUser;
  }
}

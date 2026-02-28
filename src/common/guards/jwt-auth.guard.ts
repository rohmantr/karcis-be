import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(
    err,
    user,
    info,
  ) {
    if (err || !user) {
      throw err instanceof Error
        ? err
        : new UnauthorizedException(
            'Authentication token is missing or invalid',
          );
    }
    return user;
  }
}

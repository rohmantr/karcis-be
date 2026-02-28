import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../../user/repositories/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly userRepository: UserRepository
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_ACCESS_SECRET,
        })
    }

    async validate(payload: { sub: string; email: string }) {
        const user = await this.userRepository.findOne({
            id: payload.sub,
            email: payload.email,
        })
        if (!user) {
            throw new UnauthorizedException()
        }
        return user
    }
}
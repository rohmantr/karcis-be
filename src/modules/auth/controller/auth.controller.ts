import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto, RegisterSchema } from '../dtos/register.dto';
import { LoginDto, LoginSchema } from '../dtos/login.dto';
import { RefreshTokenDto, RefreshTokenSchema } from '../dtos/refresh-token.dto';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) {}

    @Post('register')
    async register(@Body(new ZodValidationPipe(RegisterSchema)) registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    async login(@Body(new ZodValidationPipe(LoginSchema)) loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('refresh-token')
    async refreshToken(@Body(new ZodValidationPipe(RefreshTokenSchema)) refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshToken(refreshTokenDto);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    async logout(@CurrentUser() user: User) {
        return this.authService.logout(user.id);
    }
}

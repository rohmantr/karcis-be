import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import * as Fastify from 'fastify';
import { AuthService } from '../services/auth.service';
import { RegisterDto, RegisterSchema } from '../dto/register.dto';
import { LoginDto, LoginSchema } from '../dto/login.dto';
import { RefreshTokenDto, RefreshTokenSchema } from '../dto/refresh-token.dto';
import { User } from '../../users/entities/user.entity';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CookieHelper } from '../../../common/helpers/cookie.helper';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieHelper: CookieHelper,
  ) { }

  @ApiOperation({ summary: 'Register a new user' })
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @Post('register')
  register(@Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login with email and password' })
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto,
    @Req() req: Fastify.FastifyRequest,
    @Res({ passthrough: true }) reply: Fastify.FastifyReply,
  ) {
    const { deviceInfo, ipAddress } = this.extractRequestMeta(req);
    const tokens = await this.authService.login(dto, deviceInfo, ipAddress);
    this.cookieHelper.setAuthCookies(reply, tokens);
    return { accessToken: tokens.accessToken };
  }

  @ApiOperation({ summary: 'Rotate refresh token' })
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refreshToken(
    @Body(new ZodValidationPipe(RefreshTokenSchema)) dto: RefreshTokenDto,
    @Req() req: Fastify.FastifyRequest,
    @Res({ passthrough: true }) reply: Fastify.FastifyReply,
  ) {
    const cookieToken = req.cookies?.['refresh_token'];
    const refreshToken = cookieToken || dto.refreshToken;

    const { deviceInfo, ipAddress } = this.extractRequestMeta(req);
    const tokens = await this.authService.refreshToken(
      { refreshToken },
      deviceInfo,
      ipAddress,
    );
    this.cookieHelper.setAuthCookies(reply, tokens);
    return { accessToken: tokens.accessToken };
  }

  @ApiOperation({ summary: 'Logout current session' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: User,
    @Req() req: Fastify.FastifyRequest,
    @Res({ passthrough: true }) reply: Fastify.FastifyReply,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    const result = await this.authService.logout(user.id, refreshToken);
    this.cookieHelper.clearAuthCookies(reply);
    return result;
  }

  private extractRequestMeta(req: Fastify.FastifyRequest) {
    const deviceInfo = req.headers['user-agent'];
    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress =
      (typeof forwarded === 'string'
        ? forwarded.split(',')[0]?.trim()
        : undefined) ?? req.ip;
    return { deviceInfo, ipAddress };
  }
}

import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthService } from './services/auth.service';
import { AuthController } from './controller/auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { RefreshToken } from './entities/refresh-token.entity';
import { TokenHelper } from '../../common/helpers/token.helper';
import { PasswordHelper } from '../../common/helpers/password.helper';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    UsersModule,
    MikroOrmModule.forFeature([RefreshToken]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenHelper, PasswordHelper],
  exports: [TokenHelper, PasswordHelper],
})
export class AuthModule {}

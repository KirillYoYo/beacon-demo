import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { UsersService } from '@src/users/users.service';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {
  constructor(private readonly usersService: UsersService) {
    this.usersService.findAll().then((users) => {
      console.log(
        'users',
        users.map((user) => user.email),
      );
    });
  }
}

/**
 * Client->>AuthController: POST /auth/login
 * AuthController->>LocalAuthGuard: Проверка логина
 * LocalAuthGuard->>LocalStrategy: Валидация username/password
 * LocalStrategy->>AuthService: validateUser()
 * AuthService->>LocalStrategy: user / null
 * LocalStrategy->>AuthController: user → req.user
 * AuthController->>AuthService: login(req.user)
 * AuthService->>JwtService: sign(payload)
 * JwtService-->>AuthService: access_token
 * AuthService-->>Client: { access_token }
 *
 * */

import {
    Controller,
    Post,
    Request,
    UseGuards,
    Body,
    UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { UsersService } from '../users/users.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private usersService: UsersService,
    ) {}

    @Post('register')
    @UseInterceptors(AnyFilesInterceptor())
    async register(@Body() body: any) {
        // создаём пользователя, но возвращаем без passwordHash
        const user = await this.usersService.create(body.email, body.password);
        const { passwordHash, ...result } = user;
        return result;
    }

    @Post('login')
    @UseGuards(LocalAuthGuard)   // <-- ВАЖНО! Без этого req.user = undefined
    async login(@Request() req) {
        // req.user уже заполнен Guard'ом (результат validateUser)
        return this.authService.login(req.user);
    }

    @Post('refresh')
    async refresh(@Body() body: { refresh_token: string }) {
        return this.authService.refresh(body.refresh_token);
    }

    @Post('logout')
    async logout(@Request() req) {
        // req.user должен быть заполнен JWT-стратегией (если используете)
        // если нет — передавайте userId из тела запроса
        return this.authService.logout(req.user.sub);
    }

    @Post('logout-by-token')
    async logoutByToken(@Body() body: { refresh_token: string }) {
        return this.authService.logoutByToken(body.refresh_token);
    }
}
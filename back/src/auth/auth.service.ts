import {Injectable, UnauthorizedException} from '@nestjs/common';
import {UsersService} from '../users/users.service';
import * as bcrypt from 'bcrypt';
import {JwtService} from '@nestjs/jwt';
import {ConfigService} from '@nestjs/config';
import {PrismaService} from "../../prisma/prisma.service";

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private readonly configService: ConfigService,
        private prisma: PrismaService,
    ) {
    }

    async validateUser(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) return null;
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) return null;
        const { passwordHash, ...result } = user;
        return result;
    }

    async login(user: any) {
        // user — уже без passwordHash (из validateUser)
        const tokens = await this.generateTokens(user);
        // Сохраняем refresh-токен в БД
        await this.saveRefreshToken(user.id, tokens.refresh_token);
        return tokens;
    }

    async generateTokens(user: { id: string; email: string }) {
        const payload = { sub: user.id, email: user.email };
        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
            expiresIn: '15m',
        });
        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });
        return { access_token: accessToken, refresh_token: refreshToken };
    }

    async saveRefreshToken(userId: string, token: string) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 дней
        await this.prisma.refreshToken.create({
            data: {
                token,
                userId,
                expiresAt,
            },
        });
    }

    async refresh(refreshToken: string) {
        // 1. Проверяем, существует ли токен в БД и не истёк ли
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!storedToken) {
            throw new UnauthorizedException('Invalid refresh token');
        }
        if (new Date() > storedToken.expiresAt) {
            // Удаляем просроченный токен
            await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
            throw new UnauthorizedException('Refresh token expired');
        }

        // 2. Проверяем подпись refresh-токена (валидность JWT)
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });
            // 3. Удаляем старый refresh-токен
            await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
            // 4. Генерируем новую пару токенов
            const user = storedToken.user;
            const { passwordHash, ...userWithoutPassword } = user;
            const newTokens = await this.generateTokens(userWithoutPassword);
            // 5. Сохраняем новый refresh-токен
            await this.saveRefreshToken(user.id, newTokens.refresh_token);
            return newTokens;
        } catch (e) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async logout(userId: string) {
        // Удаляем все refresh-токены пользователя (или конкретный, если передать)
        await this.prisma.refreshToken.deleteMany({
            where: { userId },
        });
        return { message: 'Logged out successfully' };
    }

    // Опционально: удалить конкретный токен (если передаём его в logout)
    async logoutByToken(refreshToken: string) {
        await this.prisma.refreshToken.delete({
            where: { token: refreshToken },
        });
        return { message: 'Logged out successfully' };
    }

    async verifyRefreshToken(token: string) {
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });
            return payload;
        } catch (e) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }
}
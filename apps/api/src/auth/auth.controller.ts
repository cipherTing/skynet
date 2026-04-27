import { Controller, Post, Get, Body, ForbiddenException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtAuthUser } from './interfaces/jwt-auth-user.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ short: { ttl: 60000, limit: 3 }, medium: { ttl: 3600000, limit: 10 } })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @Throttle({ short: { ttl: 10000, limit: 5 }, medium: { ttl: 60000, limit: 15 } })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  async logout(@CurrentUser() user: JwtAuthUser) {
    if (user.authType === 'agent') {
      throw new ForbiddenException('该操作仅限用户本人执行');
    }
    await this.authService.logout(user.userId);
    return { message: '已退出登录' };
  }

  @Get('me')
  async me(@CurrentUser() user: JwtAuthUser) {
    if (user.authType === 'agent') {
      throw new ForbiddenException('该操作仅限用户本人执行');
    }
    const fullUser = await this.authService.findUserWithAgentById(user.userId);
    if (!fullUser) {
      return { user: null, agent: null };
    }
    return {
      user: {
        id: fullUser.id,
        username: fullUser.username,
        createdAt: fullUser.createdAt?.toISOString?.() || fullUser.createdAt || '',
      },
      agent: fullUser.agent
        ? {
            id: fullUser.agent.id,
            name: fullUser.agent.name,
            description: fullUser.agent.description,
            favoritesPublic: fullUser.agent.favoritesPublic !== false,
            ownerOperationEnabled: fullUser.agent.ownerOperationEnabled === true,
            avatarSeed: fullUser.agent.avatarSeed,
            createdAt: fullUser.agent.createdAt?.toISOString?.() || fullUser.agent.createdAt || '',
          }
        : null,
    };
  }
}

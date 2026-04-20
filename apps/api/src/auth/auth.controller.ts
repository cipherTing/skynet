import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

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

  @Get('me')
  async me(@CurrentUser() user: { userId: string; username: string }) {
    const fullUser = await this.authService.validateUser({
      sub: user.userId,
      username: user.username,
    });
    return {
      user: {
        id: fullUser.id,
        username: fullUser.username,
        createdAt: fullUser.createdAt.toISOString(),
      },
      agent: fullUser.agent
        ? {
            id: fullUser.agent.id,
            name: fullUser.agent.name,
            description: fullUser.agent.description,
            avatarSeed: fullUser.agent.avatarSeed,
            reputation: fullUser.agent.reputation,
            createdAt: fullUser.agent.createdAt.toISOString(),
          }
        : null,
    };
  }
}

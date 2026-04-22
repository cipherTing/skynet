import {
  Controller,
  Patch,
  Post,
  Get,
  Body,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtAuthUser } from '@/auth/interfaces/jwt-auth-user.interface';
import { PrismaService } from '@/prisma/prisma.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {}

  private async getAgent(userId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { userId },
    });
    if (!agent) {
      throw new UnauthorizedException('当前用户未关联 Agent');
    }
    return agent;
  }

  private ensureUserOnly(user: JwtAuthUser) {
    if (user.authType === 'agent') {
      throw new ForbiddenException('该操作仅限用户本人执行');
    }
  }

  @Patch('me/agent')
  async updateAgent(
    @CurrentUser() user: JwtAuthUser,
    @Body() dto: UpdateAgentDto,
  ) {
    this.ensureUserOnly(user);
    const agent = await this.getAgent(user.userId);
    return this.userService.updateAgent(agent.id, dto);
  }

  @Post('me/agent/regenerate-key')
  async regenerateKey(@CurrentUser() user: JwtAuthUser) {
    this.ensureUserOnly(user);
    const agent = await this.getAgent(user.userId);
    return this.userService.regenerateKey(agent.id);
  }

  @Get('me/agent/key-info')
  async getKeyInfo(@CurrentUser() user: JwtAuthUser) {
    this.ensureUserOnly(user);
    const agent = await this.getAgent(user.userId);
    return this.userService.getKeyInfo(agent.id);
  }
}

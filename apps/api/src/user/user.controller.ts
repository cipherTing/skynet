import {
  Controller,
  Patch,
  Post,
  Get,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
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

  @Patch('me/agent')
  async updateAgent(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateAgentDto,
  ) {
    const agent = await this.getAgent(user.userId);
    return this.userService.updateAgent(agent.id, dto);
  }

  @Post('me/agent/regenerate-key')
  async regenerateKey(@CurrentUser() user: { userId: string }) {
    const agent = await this.getAgent(user.userId);
    return this.userService.regenerateKey(agent.id);
  }

  @Get('me/agent/key-info')
  async getKeyInfo(@CurrentUser() user: { userId: string }) {
    const agent = await this.getAgent(user.userId);
    return this.userService.getKeyInfo(agent.id);
  }
}

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
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from './user.service';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtAuthUser } from '@/auth/interfaces/jwt-auth-user.interface';
import { Agent } from '@/database/schemas/agent.schema';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @InjectModel(Agent.name) private readonly agentModel: Model<Agent>,
  ) {}

  private async getAgent(userId: string) {
    const agent = await this.agentModel.findOne({ userId });
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

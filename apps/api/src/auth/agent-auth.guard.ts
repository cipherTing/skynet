import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Request } from 'express';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Agent } from '@/database/schemas/agent.schema';
import { User } from '@/database/schemas/user.schema';
import type { JwtAuthUser } from './interfaces/jwt-auth-user.interface';

type AgentAuthRequest = Request & { user?: JwtAuthUser };

@Injectable()
export class AgentAuthGuard implements CanActivate {
  constructor(
    @InjectModel(Agent.name) private readonly agentModel: Model<Agent>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AgentAuthRequest>();
    const authHeader = request.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token.startsWith('sk_live_')) {
      return false;
    }

    const prefix = token.slice(0, 10);
    const agent = await this.agentModel
      .findOne({ secretKeyPrefix: prefix, secretKeyHash: { $ne: null } })
      ;

    if (!agent || !agent.secretKeyHash) {
      return false;
    }

    if (!(await bcrypt.compare(token, agent.secretKeyHash))) {
      return false;
    }

    const user = await this.userModel.findById(agent.userId);
    if (!user || user.deletedAt) {
      return false;
    }
    if (user.suspendedAt) {
      return false;
    }

    const authUser: JwtAuthUser = {
      userId: user.id,
      username: user.username,
      dbTokenVersion: 0,
      payloadTokenVersion: 0,
      authType: 'agent',
    };
    request.user = authUser;

    return true;
  }
}

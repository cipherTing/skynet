import * as crypto from 'crypto';
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Agent } from '@/database/schemas/agent.schema';
import { UpdateAgentDto } from './dto/update-agent.dto';

const BASE62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function toBase62(buffer: Buffer): string {
  let result = '';
  for (const byte of buffer) {
    result += BASE62_CHARS[byte % 62];
  }
  return result;
}

@Injectable()
export class UserService {
  constructor(
    @InjectModel(Agent.name) private readonly agentModel: Model<Agent>,
  ) {}

  async updateAgent(agentId: string, dto: UpdateAgentDto) {
    if (dto.name) {
      const existing = await this.agentModel.findOne({
        name: dto.name,
        _id: { $ne: agentId },
      });
      if (existing) {
        throw new ConflictException('Agent 名称已被占用');
      }
    }

    const agent = await this.agentModel.findByIdAndUpdate(
      agentId,
      {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.favoritesPublic !== undefined && { favoritesPublic: dto.favoritesPublic }),
        ...(dto.ownerOperationEnabled !== undefined && {
          ownerOperationEnabled: dto.ownerOperationEnabled,
        }),
      },
      { new: true },
    );

    if (!agent) {
      throw new NotFoundException('Agent 不存在');
    }

    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      favoritesPublic: agent.favoritesPublic !== false,
      ownerOperationEnabled: agent.ownerOperationEnabled === true,
      avatarSeed: agent.avatarSeed,
      createdAt: agent.createdAt.toISOString(),
    };
  }

  async regenerateKey(agentId: string) {
    const agent = await this.agentModel.findById(agentId);
    if (!agent) {
      throw new NotFoundException('Agent 不存在');
    }

    const rawKey = crypto.randomBytes(32);
    const encoded = toBase62(rawKey);
    const secretKey = `sk_live_${encoded}`;

    const prefix = secretKey.slice(0, 10);
    const lastFour = secretKey.slice(-4);
    const hash = await bcrypt.hash(secretKey, 12);

    await this.agentModel.findByIdAndUpdate(agentId, {
      secretKeyHash: hash,
      secretKeyPrefix: prefix,
      secretKeyLastFour: lastFour,
      secretKeyCreatedAt: new Date(),
    });

    return { secretKey };
  }

  async getKeyInfo(agentId: string) {
    const agent = await this.agentModel.findById(agentId).select('secretKeyPrefix secretKeyLastFour secretKeyCreatedAt');

    if (!agent) {
      throw new NotFoundException('Agent 不存在');
    }

    if (!agent.secretKeyPrefix) {
      return null;
    }

    return {
      prefix: agent.secretKeyPrefix,
      lastFour: agent.secretKeyLastFour,
      createdAt: agent.secretKeyCreatedAt?.toISOString() ?? null,
    };
  }
}

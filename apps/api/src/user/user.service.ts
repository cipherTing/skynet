import * as crypto from 'crypto';
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
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
  constructor(private readonly prisma: PrismaService) {}

  async updateAgent(agentId: string, dto: UpdateAgentDto) {
    if (dto.name) {
      const existing = await this.prisma.agent.findFirst({
        where: { name: dto.name, id: { not: agentId } },
      });
      if (existing) {
        throw new ConflictException('Agent 名称已被占用');
      }
    }

    const agent = await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });

    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      avatarSeed: agent.avatarSeed,
      reputation: agent.reputation,
      createdAt: agent.createdAt.toISOString(),
    };
  }

  async regenerateKey(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });
    if (!agent) {
      throw new NotFoundException('Agent 不存在');
    }

    const rawKey = crypto.randomBytes(32);
    const encoded = toBase62(rawKey);
    const secretKey = `sk_live_${encoded}`;

    const prefix = secretKey.slice(0, 10);
    const lastFour = secretKey.slice(-4);
    const hash = await bcrypt.hash(secretKey, 12);

    await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        secretKeyHash: hash,
        secretKeyPrefix: prefix,
        secretKeyLastFour: lastFour,
        secretKeyCreatedAt: new Date(),
      },
    });

    // Return the plain key only once
    return { secretKey };
  }

  async getKeyInfo(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        secretKeyPrefix: true,
        secretKeyLastFour: true,
        secretKeyCreatedAt: true,
      },
    });

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

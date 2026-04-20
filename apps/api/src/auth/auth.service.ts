import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUser) {
      throw new ConflictException('用户名已被占用');
    }

    const existingAgent = await this.prisma.agent.findUnique({
      where: { name: dto.agentName },
    });
    if (existingAgent) {
      throw new ConflictException('Agent 名称已被占用');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          username: dto.username,
          passwordHash,
          agent: {
            create: {
              name: dto.agentName,
              description: dto.agentDescription || '',
            },
          },
        },
        include: { agent: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('用户名或 Agent 名称已被占用');
      }
      throw error;
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt.toISOString(),
      },
      agent: {
        id: user.agent!.id,
        name: user.agent!.name,
        description: user.agent!.description,
        avatarSeed: user.agent!.avatarSeed,
        reputation: user.agent!.reputation,
        createdAt: user.agent!.createdAt.toISOString(),
      },
      token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username, deletedAt: null },
      include: { agent: true },
    });

    if (!user) {
      // Constant-time comparison to prevent username enumeration via timing
      await bcrypt.compare(dto.password, '$2b$12$000000000000000000000uGdrFhdg0cMNpMTknGjRZ3PluYUnPOra');
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt.toISOString(),
      },
      agent: user.agent
        ? {
            id: user.agent.id,
            name: user.agent.name,
            description: user.agent.description,
            avatarSeed: user.agent.avatarSeed,
            reputation: user.agent.reputation,
            createdAt: user.agent.createdAt.toISOString(),
          }
        : null,
      token,
    };
  }

  async validateUser(payload: { sub: string; username: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
      include: { agent: true },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return user;
  }

  private generateToken(user: { id: string; username: string }) {
    return this.jwtService.sign({
      sub: user.id,
      username: user.username,
    });
  }
}

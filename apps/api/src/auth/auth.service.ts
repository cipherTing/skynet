import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@/database/schemas/user.schema';
import { Agent } from '@/database/schemas/agent.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

function isDuplicateKeyError(error: unknown): error is { code: 11000 } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Agent.name) private readonly agentModel: Model<Agent>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.userModel.findOne({ username: dto.username });
    if (existingUser) {
      throw new ConflictException('用户名已被占用');
    }

    const existingAgent = await this.agentModel.findOne({ name: dto.agentName });
    if (existingAgent) {
      throw new ConflictException('Agent 名称已被占用');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create user first
    const user = await this.userModel.create({
      username: dto.username,
      passwordHash,
    });

    try {
      // Then create agent linked to user
      const agent = await this.agentModel.create({
        name: dto.agentName,
        description: dto.agentDescription || '',
        userId: user.id,
      });

      const token = this.generateToken(user);

      return {
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt.toISOString(),
        },
        agent: {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          avatarSeed: agent.avatarSeed,
          createdAt: agent.createdAt.toISOString(),
        },
        token,
      };
    } catch (error) {
      // Compensation: rollback user creation if agent creation fails
      await this.userModel.findByIdAndUpdate(user.id, { deletedAt: new Date() });
      if (isDuplicateKeyError(error)) {
        throw new ConflictException('用户名或 Agent 名称已被占用');
      }
      throw error;
    }
  }

  async logout(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ username: dto.username });

    if (!user) {
      // Constant-time comparison to prevent username enumeration via timing
      await bcrypt.compare(
        dto.password,
        '$2b$12$000000000000000000000uGdrFhdg0cMNpMTknGjRZ3PluYUnPOra',
      );
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.suspendedAt) {
      throw new UnauthorizedException('该账号已被封禁');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const agent = await this.agentModel.findOne({ userId: user.id });
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt.toISOString(),
      },
      agent: agent
        ? {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            avatarSeed: agent.avatarSeed,
            createdAt: agent.createdAt.toISOString(),
          }
        : null,
      token,
    };
  }

  async findUserById(id: string) {
    return this.userModel.findById(id);
  }

  async findUserWithAgentById(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) return null;
    const agent = await this.agentModel.findOne({ userId: user.id });
    return { ...user, agent };
  }

  async validateUser(payload: { sub: string; username: string }) {
    const user = await this.findUserById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (user.suspendedAt) {
      throw new UnauthorizedException('该账号已被封禁');
    }

    return user;
  }

  private generateToken(user: { id: string; username: string; tokenVersion: number }) {
    return this.jwtService.sign({
      sub: user.id,
      username: user.username,
      tokenVersion: user.tokenVersion,
    });
  }
}

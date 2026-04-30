import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { User } from '@/database/schemas/user.schema';
import { Agent } from '@/database/schemas/agent.schema';
import { BrowserSession } from '@/database/schemas/browser-session.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const BROWSER_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function isDuplicateKeyError(error: unknown): error is { code: 11000 } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Agent.name) private readonly agentModel: Model<Agent>,
    @InjectModel(BrowserSession.name)
    private readonly browserSessionModel: Model<BrowserSession>,
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

    let agent: Agent | null = null;

    try {
      // Then create agent linked to user
      agent = await this.agentModel.create({
        name: dto.agentName,
        description: dto.agentDescription || '',
        userId: user.id,
      });

      const browserSession = await this.createBrowserSession(user.id);
      const token = this.generateToken(user, browserSession.id);

      return {
        user: this.serializeUser(user),
        agent: this.serializeAgent(agent),
        token,
        refreshToken: browserSession.refreshToken,
        refreshExpiresAt: browserSession.expiresAt,
      };
    } catch (error) {
      // 注册中途失败时，撤销本次已创建的账号与 Agent。
      if (agent) {
        await this.agentModel.findByIdAndUpdate(agent.id, { deletedAt: new Date() });
      }
      await this.userModel.findByIdAndUpdate(user.id, { deletedAt: new Date() });
      if (isDuplicateKeyError(error)) {
        throw new ConflictException('用户名或 Agent 名称已被占用');
      }
      throw error;
    }
  }

  async logout(userId: string, browserSessionId?: string) {
    if (browserSessionId) {
      await this.browserSessionModel.findOneAndUpdate(
        { _id: browserSessionId, userId },
        { revokedAt: new Date() },
      );
      return;
    }

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
    const browserSession = await this.createBrowserSession(user.id);
    const token = this.generateToken(user, browserSession.id);

    return {
      user: this.serializeUser(user),
      agent: agent ? this.serializeAgent(agent) : null,
      token,
      refreshToken: browserSession.refreshToken,
      refreshExpiresAt: browserSession.expiresAt,
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

  async refreshBrowserSession(refreshToken: string | null) {
    if (!refreshToken) {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }

    const now = new Date();
    const tokenHash = this.hashRefreshToken(refreshToken);
    const browserSession = await this.browserSessionModel.findOne({
      tokenHash,
      revokedAt: null,
    });

    if (!browserSession || browserSession.expiresAt.getTime() <= now.getTime()) {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }

    const user = await this.userModel.findById(browserSession.userId);
    if (!user || user.deletedAt) {
      await this.revokeBrowserSession(browserSession.id);
      throw new UnauthorizedException('用户不存在');
    }

    if (user.suspendedAt) {
      await this.revokeBrowserSession(browserSession.id);
      throw new UnauthorizedException('该账号已被封禁');
    }

    const refreshExpiresAt = new Date(now.getTime() + BROWSER_SESSION_TTL_MS);
    browserSession.expiresAt = refreshExpiresAt;
    await browserSession.save();

    const agent = await this.agentModel.findOne({ userId: user.id });
    const token = this.generateToken(user, browserSession.id);

    return {
      user: this.serializeUser(user),
      agent: agent ? this.serializeAgent(agent) : null,
      token,
      refreshToken,
      refreshExpiresAt,
    };
  }

  async isBrowserSessionActive(userId: string, browserSessionId?: string) {
    if (!browserSessionId) return false;

    const browserSession = await this.browserSessionModel.findOne({
      _id: browserSessionId,
      userId,
      revokedAt: null,
    });

    return Boolean(browserSession && browserSession.expiresAt.getTime() > Date.now());
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

  private async revokeBrowserSession(browserSessionId: string) {
    await this.browserSessionModel.findByIdAndUpdate(browserSessionId, {
      revokedAt: new Date(),
    });
  }

  private async createBrowserSession(userId: string) {
    const refreshToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + BROWSER_SESSION_TTL_MS);
    const browserSession = await this.browserSessionModel.create({
      userId,
      tokenHash: this.hashRefreshToken(refreshToken),
      expiresAt,
    });

    return {
      id: browserSession.id,
      refreshToken,
      expiresAt,
    };
  }

  private hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private serializeUser(user: User) {
    return {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private serializeAgent(agent: Agent) {
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

  private generateToken(
    user: { id: string; username: string; tokenVersion: number },
    browserSessionId: string,
  ) {
    return this.jwtService.sign({
      sub: user.id,
      username: user.username,
      tokenVersion: user.tokenVersion,
      browserSessionId,
    });
  }
}

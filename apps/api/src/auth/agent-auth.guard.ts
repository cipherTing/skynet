import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import type { JwtAuthUser } from './interfaces/jwt-auth-user.interface';

/**
 * Agent Secret Key 认证 Guard。
 *
 * 从 Authorization: Bearer sk_live_... 中提取 Secret Key，
 * 通过 prefix 缩小查询范围后用 bcrypt 验证，
 * 验证成功后注入和 JWT 认证一致的 request.user 格式，
 * 使 @CurrentUser() 对 Agent 同样生效。
 */
@Injectable()
export class AgentAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token.startsWith('sk_live_')) {
      return false;
    }

    // 通过 prefix 查询（UNIQUE 约束保证最多命中一条）
    const prefix = token.slice(0, 10);
    const agent = await this.prisma.agent.findUnique({
      where: { secretKeyPrefix: prefix },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            deletedAt: true,
            suspendedAt: true,
          },
        },
      },
    });

    if (!agent || !agent.secretKeyHash || agent.deletedAt) {
      return false;
    }

    if (!(await bcrypt.compare(token, agent.secretKeyHash))) {
      return false;
    }

    const user = agent.user;
    if (!user || user.deletedAt) {
      return false;
    }
    if (user.suspendedAt) {
      // 统一返回 false，不区分"密钥错误"和"密钥正确但被封号"，
      // 防止攻击者通过响应差异确认密钥有效性
      return false;
    }

    // 注入和 JWT 认证一致的 request.user，使 @CurrentUser() 无需改动
    request.user = {
      userId: user.id,
      username: user.username,
      dbTokenVersion: 0,
      payloadTokenVersion: 0,
      authType: 'agent' as const,
    } as JwtAuthUser;

    return true;
  }
}

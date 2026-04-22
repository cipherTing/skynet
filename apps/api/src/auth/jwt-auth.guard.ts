import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { JwtAuthUser } from './interfaces/jwt-auth-user.interface';
import { AgentAuthGuard } from './agent-auth.guard';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private agentAuthGuard: AgentAuthGuard,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    // Agent Secret Key 走独立认证路径
    if (token.startsWith('sk_live_')) {
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      const result = await this.agentAuthGuard.canActivate(context);
      if (!result) {
        if (isPublic) {
          request.user = null;
          return true;
        }
        throw new UnauthorizedException();
      }
      return true;
    }

    // 其余走标准 JWT 认证
    return (await super.canActivate(context)) as boolean;
  }

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 公开路由：任何认证/授权问题都降级为匿名访问
    if (isPublic) {
      if (err) {
        const isAuthError =
          err instanceof UnauthorizedException ||
          ['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'].includes(
            err?.name,
          );
        if (isAuthError) {
          return null as TUser;
        }
        throw err;
      }
      if (!user) {
        return null as TUser;
      }
      // 业务无效 token（tokenVersion 不匹配、封号）也降级为匿名
      const authUser = user as JwtAuthUser;
      if (
        authUser.dbTokenVersion !== authUser.payloadTokenVersion ||
        authUser.suspendedAt
      ) {
        return null as TUser;
      }
      return user as TUser;
    }

    if (err) throw err;
    if (!user) throw new UnauthorizedException();

    const authUser = user as JwtAuthUser;

    // 注意：Agent 认证在 canActivate 中直接返回 true，不走此处。
    // handleRequest 仅处理 JWT 认证路径。
    if (authUser.authType !== 'agent') {
      if (authUser.dbTokenVersion !== authUser.payloadTokenVersion) {
        throw new UnauthorizedException('登录已失效，请重新登录');
      }
    }

    if (authUser.suspendedAt) {
      throw new UnauthorizedException('该账号已被封禁');
    }

    return user as TUser;
  }
}

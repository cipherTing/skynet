import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtAuthUser } from '../interfaces/jwt-auth-user.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtAuthUser | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthUser } from '../interfaces/jwt-auth-user.interface';

type CurrentUserRequest = Request & { user?: JwtAuthUser };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtAuthUser | undefined => {
    const request = ctx.switchToHttp().getRequest<CurrentUserRequest>();
    return request.user;
  },
);

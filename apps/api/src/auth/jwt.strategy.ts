import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { JwtAuthUser } from './interfaces/jwt-auth-user.interface';
import { getRequiredJwtSecret } from '../config/env';

interface JwtPayload {
  sub: string;
  username: string;
  tokenVersion?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getRequiredJwtSecret(),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtAuthUser | null> {
    const user = await this.authService.findUserById(payload.sub);
    if (!user) {
      return null;
    }
    return {
      userId: user.id,
      username: user.username,
      dbTokenVersion: user.tokenVersion,
      payloadTokenVersion: payload.tokenVersion ?? 0,
      suspendedAt: user.suspendedAt ? user.suspendedAt.toISOString() : undefined,
      authType: 'jwt' as const,
    };
  }
}

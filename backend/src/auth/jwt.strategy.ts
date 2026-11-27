import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { jwtSecret } from './jwt-secret';
import { User } from '../msb-admin/msb-admin.entity';
import { isSessionAuthTimeValid } from './session-token';

/** The single 'jwt' passport strategy (used by JwtAuthGuard). Registered once, in AccessModule. */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret(),
    });
  }

  async validate(payload: {
    sub: string;
    email?: string;
    role?: string;
    tokenVersion?: number;
    authTime?: number;
  }) {
    if (!isSessionAuthTimeValid(payload.authTime)) {
      return null;
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: ['id', 'email', 'role', 'is_active', 'token_version'],
    });
    if (
      !user ||
      !user.is_active ||
      payload.tokenVersion !== user.token_version
    ) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.token_version,
      authTime: payload.authTime,
    };
  }
}

import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../msb-admin/msb-admin.entity';

/** Access tokens live 1h; refreshing extends a session up to this absolute limit. */
export const MAX_SESSION_SECONDS = 12 * 60 * 60;

export interface SessionTokenPayload {
  sub: string;
  email: string;
  role: string;
  tokenVersion: number;
  /** Unix seconds when the user last authenticated with a password. */
  authTime: number;
}

export function isSessionAuthTimeValid(
  authTime: unknown,
  nowSeconds = Math.floor(Date.now() / 1000),
): authTime is number {
  return (
    typeof authTime === 'number' &&
    Number.isSafeInteger(authTime) &&
    authTime <= nowSeconds &&
    nowSeconds - authTime < MAX_SESSION_SECONDS
  );
}

/** Signs an access token for `user`. Pass `authTime` to keep an existing session's start time. */
export function signSessionToken(
  jwtService: JwtService,
  user: Pick<User, 'id' | 'email' | 'role' | 'token_version'>,
  authTime: number = Math.floor(Date.now() / 1000),
): string {
  const payload: SessionTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.token_version,
    authTime,
  };
  return jwtService.sign(payload);
}

/**
 * Issues a fresh access token for an already-authenticated caller (JwtStrategy has
 * checked signature, expiry and token version). Refuses once the session is older
 * than MAX_SESSION_SECONDS, so a stolen token cannot be extended forever.
 */
export async function refreshSessionToken(
  jwtService: JwtService,
  userRepository: Repository<User>,
  userId: string,
  role: string,
  authTime: number | undefined,
  tokenVersion: number | undefined,
): Promise<{ token: string }> {
  if (
    !isSessionAuthTimeValid(authTime) ||
    typeof tokenVersion !== 'number' ||
    !Number.isSafeInteger(tokenVersion)
  ) {
    throw new UnauthorizedException('Session expired, please log in again');
  }
  const user = await userRepository.findOne({
    where: { id: userId, role, token_version: tokenVersion, is_active: true },
    select: ['id', 'email', 'role', 'is_active', 'token_version'],
  });
  if (!user || !user.is_active || user.token_version !== tokenVersion) {
    throw new UnauthorizedException('Session expired, please log in again');
  }
  return { token: signSessionToken(jwtService, user, authTime) };
}

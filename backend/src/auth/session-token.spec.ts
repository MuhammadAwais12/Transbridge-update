import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../msb-admin/msb-admin.entity';
import {
  MAX_SESSION_SECONDS,
  refreshSessionToken,
  signSessionToken,
} from './session-token';

describe('session tokens', () => {
  const jwtService = new JwtService({ secret: 'test-secret', signOptions: { expiresIn: '1h' } });
  const user = {
    id: 'user-1',
    email: 'a@example.com',
    role: 'account_holder',
    is_active: true,
    token_version: 3,
  } as User;
  const repo = (found: User | null) =>
    ({ findOne: jest.fn().mockResolvedValue(found) }) as unknown as Repository<User>;
  const now = () => Math.floor(Date.now() / 1000);

  it('signs the token version and auth time into the token', () => {
    const payload = jwtService.verify(signSessionToken(jwtService, user, 1234));
    expect(payload).toMatchObject({ sub: 'user-1', tokenVersion: 3, authTime: 1234 });
  });

  it('refresh keeps the original auth time', async () => {
    const authTime = now() - 60;
    const { token } = await refreshSessionToken(
      jwtService,
      repo(user),
      'user-1',
      'account_holder',
      authTime,
      user.token_version,
    );
    expect(jwtService.verify(token).authTime).toBe(authTime);
  });

  it('refuses to extend a session past the absolute limit', async () => {
    await expect(
      refreshSessionToken(
        jwtService,
        repo(user),
        'user-1',
        'account_holder',
        now() - MAX_SESSION_SECONDS,
        user.token_version,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refuses tokens without an auth time (issued before this change)', async () => {
    await expect(
      refreshSessionToken(
        jwtService,
        repo(user),
        'user-1',
        'account_holder',
        undefined,
        user.token_version,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refuses inactive users', async () => {
    await expect(
      refreshSessionToken(
        jwtService,
        repo({ ...user, is_active: false } as User),
        'user-1',
        'account_holder',
        now(),
        user.token_version,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('does not refresh when the database token version has advanced', async () => {
    const findOne = jest.fn().mockResolvedValue({ ...user, token_version: 4 });
    const userRepository = { findOne } as unknown as Repository<User>;

    await expect(
      refreshSessionToken(
        jwtService,
        userRepository,
        'user-1',
        'account_holder',
        now() - 60,
        user.token_version,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ token_version: user.token_version }),
      }),
    );
  });

  it('keeps a concurrently revoked token stale if logout races with refresh', async () => {
    const databaseUser = { ...user, token_version: user.token_version };
    const findOne = jest.fn().mockImplementation(async () => {
      const snapshot = { ...databaseUser };
      databaseUser.token_version += 1;
      return snapshot;
    });

    const { token } = await refreshSessionToken(
      jwtService,
      { findOne } as unknown as Repository<User>,
      'user-1',
      'account_holder',
      now() - 60,
      user.token_version,
    );

    expect(jwtService.verify(token).tokenVersion).toBe(user.token_version);
    expect(databaseUser.token_version).toBe(user.token_version + 1);
  });
});

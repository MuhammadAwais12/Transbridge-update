import { Repository } from 'typeorm';
import { User } from '../msb-admin/msb-admin.entity';
import { MAX_SESSION_SECONDS } from './session-token';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const originalSecret = process.env.JWT_SECRET;
  const userRepository = {
    findOne: jest.fn(),
  };
  let strategy: JwtStrategy;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    strategy = new JwtStrategy(
      userRepository as unknown as Repository<User>,
    );
  });

  beforeEach(() => {
    userRepository.findOne.mockReset();
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it('accepts a token matching the current user token version', async () => {
    const authTime = Math.floor(Date.now() / 1000);
    userRepository.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'account_holder',
      is_active: true,
      token_version: 2,
    });

    await expect(
      strategy.validate({
        sub: 'user-1',
        tokenVersion: 2,
        authTime,
      }),
    ).resolves.toEqual({
      userId: 'user-1',
      email: 'user@example.com',
      role: 'account_holder',
      tokenVersion: 2,
      authTime,
    });
  });

  it('rejects a token invalidated by a password change or logout', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'account_holder',
      is_active: true,
      token_version: 3,
    });

    await expect(
      strategy.validate({ sub: 'user-1', tokenVersion: 2 }),
    ).resolves.toBeNull();
  });

  it('rejects a still-unexpired access token after the absolute session limit', async () => {
    await expect(
      strategy.validate({
        sub: 'user-1',
        tokenVersion: 2,
        authTime: Math.floor(Date.now() / 1000) - MAX_SESSION_SECONDS,
      }),
    ).resolves.toBeNull();
    expect(userRepository.findOne).not.toHaveBeenCalled();
  });

  it('rejects tokens with missing or future authentication times', async () => {
    await expect(
      strategy.validate({ sub: 'user-1', tokenVersion: 2 }),
    ).resolves.toBeNull();
    await expect(
      strategy.validate({
        sub: 'user-1',
        tokenVersion: 2,
        authTime: Math.floor(Date.now() / 1000) + 60,
      }),
    ).resolves.toBeNull();
    expect(userRepository.findOne).not.toHaveBeenCalled();
  });
});

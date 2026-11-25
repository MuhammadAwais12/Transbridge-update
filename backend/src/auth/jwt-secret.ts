/** JWT_SECRET for signing (JwtModule) and verifying (JwtStrategy). Throws at startup if unset. */
export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }
  return secret;
}

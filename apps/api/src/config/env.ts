export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getRedisConfig(): { host: string; port: number } {
  const host = process.env.REDIS_HOST || 'redis';
  const rawPort = process.env.REDIS_PORT || '6379';
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`REDIS_PORT must be a valid TCP port, received ${rawPort}`);
  }

  return { host, port };
}

export function getRequiredJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return secret;
}

export function isSwaggerEnabled(): boolean {
  const explicitValue = process.env.SWAGGER_ENABLED;
  if (explicitValue !== undefined) return explicitValue === 'true';
  return !isProduction();
}

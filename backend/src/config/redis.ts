import Redis from 'ioredis';
import { env } from './env';

// Upstash Redis requires TLS — ioredis needs tls option set when using rediss:// scheme
const createRedisConnection = () => {
  if (env.REDIS_URL) {
    return new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
    });
  }
  // Local fallback
  return new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    maxRetriesPerRequest: null,
  });
};

export const redisConnection = createRedisConnection();

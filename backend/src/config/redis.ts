import Redis from 'ioredis';
import { env } from './env';

export const redisConnection = env.REDIS_URL 
  ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })
  : new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      maxRetriesPerRequest: null,
    });

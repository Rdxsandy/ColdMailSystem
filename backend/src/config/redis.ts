import Redis from 'ioredis';
import { env } from './env';

// Upstash Redis requires TLS — ioredis needs tls option set when using rediss:// scheme
const createRedisConnection = () => {
  const client = env.REDIS_URL
    ? new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
        // Prevent unhandled connection errors from crashing the process
        lazyConnect: false,
      })
    : new Redis({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        maxRetriesPerRequest: null,
        lazyConnect: false,
      });

  // Catch connection errors so they don't become unhandled rejections that
  // kill the Node process. The worker will log the error and BullMQ will retry.
  client.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  client.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  return client;
};

export const redisConnection = createRedisConnection();

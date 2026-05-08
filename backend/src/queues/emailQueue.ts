import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

export const emailQueueName = 'email-queue';

export const emailQueue = new Queue(emailQueueName, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});

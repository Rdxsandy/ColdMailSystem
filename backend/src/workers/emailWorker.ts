import { Worker, Job } from 'bullmq';
import { emailQueueName } from '../queues/emailQueue';
import { redisConnection } from '../config/redis';
import { env } from '../config/env';
import { sendEmail } from '../services/emailService';
import { prisma } from '../config/prisma';

const throttleLua = `
  local nextTime = tonumber(redis.call('get', KEYS[1]) or '0')
  local now = tonumber(ARGV[1])
  local minDelay = tonumber(ARGV[2])
  
  if nextTime < now then
    nextTime = now
  end
  
  local targetTime = nextTime + minDelay
  redis.call('set', KEYS[1], targetTime)
  
  return nextTime
`;

export const emailWorker = new Worker(emailQueueName, async (job: Job) => {
  const { jobId, to, subject, text, senderId, from } = job.data;
  
  // 1. Enforce global minimum delay across concurrent workers safely
  const sendTime = await redisConnection.eval(
    throttleLua, 
    1, 
    'global_next_email_time', 
    Date.now(), 
    env.MIN_DELAY_BETWEEN_EMAILS
  ) as number;
  
  const waitTime = Math.max(0, sendTime - Date.now());
  if (waitTime > 0) {
    await new Promise(r => setTimeout(r, waitTime));
  }

  // 2. Send the email via Mock SMTP
  try {
    await sendEmail(to, subject, text, from || env.ETHEREAL_USER);

    // 3. Mark as sent in Database
    await prisma.emailJob.update({
      where: { id: jobId },
      data: { status: 'sent', sentTime: new Date() }
    });

  } catch (error) {
    // Increment retry count or mark failed
    console.error(`Error sending email for job ${jobId}`, error);
    
    // Update DB to failed if it's going to fail completely
    // Let BullMQ retry it based on attempts, but log it
    throw error; // Let BullMQ handle the failure/retry
  }

}, {
  connection: redisConnection,
  concurrency: env.WORKER_CONCURRENCY,
  limiter: {
    max: env.MAX_EMAILS_PER_HOUR,
    duration: 3600000, // 1 hour
  }
});

emailWorker.on('completed', job => {
  console.log(`Job with id ${job.id} has been completed`);
});

emailWorker.on('failed', async (job, err) => {
  console.error(`Job with id ${job?.id} has failed with ${err.message}`);
  if (job && job.attemptsMade >= job.opts.attempts!) {
    // If max retries reached, mark as failed in DB
    try {
      await prisma.emailJob.update({
        where: { id: job.data.jobId },
        data: { status: 'failed' }
      });
    } catch (dbErr) {
      console.error('Failed to update DB on job failure', dbErr);
    }
  }
});

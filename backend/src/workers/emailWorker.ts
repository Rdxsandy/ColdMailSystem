import { Worker, Job } from 'bullmq';
import { emailQueueName } from '../queues/emailQueue';
import { redisConnection } from '../config/redis';
import { env } from '../config/env';
import { sendEmail } from '../services/emailService';
import { prisma } from '../config/prisma';

// ─── Lua script for atomic, distributed per-hour rate limiting ─────────────
// Uses a Redis key keyed to the current UTC hour window.
// Returns 1 if allowed (count incremented), 0 if limit exceeded.
const hourlyRateLimitLua = `
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local windowSecs = tonumber(ARGV[2])
  local current = tonumber(redis.call('get', key) or '0')
  if current < limit then
    redis.call('incr', key)
    redis.call('expire', key, windowSecs)
    return 1
  else
    return 0
  end
`;

// ─── Lua script for atomic min-delay throttle (fixed: returns targetTime) ──
// Returns the timestamp at which THIS email should be sent.
const throttleLua = `
  local nextTime = tonumber(redis.call('get', KEYS[1]) or '0')
  local now = tonumber(ARGV[1])
  local minDelay = tonumber(ARGV[2])

  if nextTime < now then
    nextTime = now
  end

  local targetTime = nextTime + minDelay
  redis.call('set', KEYS[1], targetTime)
  redis.call('expire', KEYS[1], 3600)

  return targetTime
`;

// ─── Worker ────────────────────────────────────────────────────────────────
export const emailWorker = new Worker(
  emailQueueName,
  async (job: Job) => {
    const { jobId, to, subject, text, senderId, from } = job.data;

    // 1. Idempotency guard — if already sent, skip silently
    const existingJob = await prisma.emailJob.findUnique({ where: { id: jobId } });
    if (!existingJob) {
      console.warn(`[Worker] Job ${jobId} not found in DB — skipping`);
      return;
    }
    if (existingJob.status === 'sent') {
      console.log(`[Worker] Job ${jobId} already sent — skipping duplicate`);
      return;
    }

    // 2. Per-hour rate limiting (Redis-backed, safe across workers)
    const hourWindow = Math.floor(Date.now() / 3600000); // current UTC hour
    const rateLimitKey = `rate_limit:global:${hourWindow}`;
    const allowed = await redisConnection.eval(
      hourlyRateLimitLua,
      1,
      rateLimitKey,
      env.MAX_EMAILS_PER_HOUR,
      3700 // expire after ~1 hour + buffer
    ) as number;

    if (allowed === 0) {
      // Rate limit hit — delay job into next hour window
      const nextHourMs = (hourWindow + 1) * 3600000;
      const delayMs = Math.max(0, nextHourMs - Date.now()) + 1000; // +1s buffer
      console.log(`[Worker] Hourly limit reached. Rescheduling job ${jobId} in ${Math.round(delayMs / 1000)}s`);
      await job.moveToDelayed(Date.now() + delayMs);
      return;
    }

    // 3. Enforce global min-delay between sends (atomic across concurrent workers)
    const sendTime = await redisConnection.eval(
      throttleLua,
      1,
      'global_next_email_time',
      Date.now(),
      env.MIN_DELAY_BETWEEN_EMAILS
    ) as number;

    const waitTime = Math.max(0, sendTime - Date.now());
    if (waitTime > 0) {
      console.log(`[Worker] Throttling — waiting ${waitTime}ms before sending job ${jobId}`);
      await new Promise(r => setTimeout(r, waitTime));
    }

    // 4. Send the email
    try {
      await sendEmail(to, subject, text, from || env.SMTP_USER);

      // 5. Mark as sent in DB
      await prisma.emailJob.update({
        where: { id: jobId },
        data: { status: 'sent', sentTime: new Date() },
      });

      console.log(`[Worker] Job ${jobId} completed — email sent to ${to}`);
    } catch (error) {
      console.error(`[Worker] Job ${jobId} failed to send email to ${to}:`, error);
      throw error; // Let BullMQ handle retry
    }
  },
  {
    connection: redisConnection,
    concurrency: env.WORKER_CONCURRENCY,
  }
);

// ─── Worker Event Listeners ────────────────────────────────────────────────
emailWorker.on('completed', job => {
  console.log(`[Worker] BullMQ job ${job.id} completed`);
});

emailWorker.on('failed', async (job, err) => {
  console.error(`[Worker] BullMQ job ${job?.id} failed: ${err.message}`);
  if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
    try {
      await prisma.emailJob.update({
        where: { id: job.data.jobId },
        data: { status: 'failed' },
      });
      console.log(`[Worker] Marked DB job ${job.data.jobId} as failed`);
    } catch (dbErr) {
      console.error('[Worker] Failed to update DB job status:', dbErr);
    }
  }
});

emailWorker.on('error', err => {
  console.error('[Worker] Worker error:', err.message);
});

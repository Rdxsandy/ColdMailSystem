import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { emailQueue } from '../queues/emailQueue';

export const scheduleEmails = async (req: Request, res: Response) => {
  try {
    const { emails } = req.body;
    const senderId = (req as any).userId; // Set by JWT auth middleware

    if (!senderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: 'Invalid emails payload — expected non-empty array' });
    }

    // Validate each email entry
    for (const email of emails) {
      if (!email.to || !email.subject || !email.body) {
        return res.status(400).json({ message: 'Each email must have: to, subject, body' });
      }
    }

    // Fetch sender email for the 'from' field
    const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { email: true } });
    const senderEmail = sender?.email || 'noreply@coldmailsystem.com';

    const scheduledJobs = [];

    for (const email of emails) {
      const scheduledTime = new Date(email.scheduledTime || Date.now());
      const delay = Math.max(0, scheduledTime.getTime() - Date.now());

      // Create DB record first — this is the source of truth
      const dbJob = await prisma.emailJob.create({
        data: {
          recipientEmail: email.to,
          subject: email.subject,
          body: email.body,
          scheduledTime,
          senderId,
          status: 'scheduled',
        },
      });

      // Add to BullMQ — use the DB job ID as the BullMQ job ID for idempotency.
      // If the same ID is already in the queue, BullMQ will return the existing job
      // rather than adding a duplicate.
      await emailQueue.add(
        'send-email',
        {
          jobId: dbJob.id,
          to: email.to,
          subject: email.subject,
          text: email.body,
          senderId,
          from: senderEmail,
        },
        {
          delay,
          jobId: dbJob.id, // Idempotency: same DB id = same queue job
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: false,
          removeOnFail: false,
        }
      );

      scheduledJobs.push(dbJob);
    }

    return res.status(201).json({
      message: 'Emails scheduled successfully',
      count: scheduledJobs.length,
      jobs: scheduledJobs.map(j => ({ id: j.id, recipientEmail: j.recipientEmail, scheduledTime: j.scheduledTime, status: j.status })),
    });
  } catch (error: any) {
    console.error('[EmailController] Failed to schedule emails:', error);
    return res.status(500).json({ message: 'Failed to schedule emails', error: error.message });
  }
};

export const getScheduledEmails = async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).userId;
    const emails = await prisma.emailJob.findMany({
      where: { senderId, status: { in: ['scheduled', 'queued'] } },
      orderBy: { scheduledTime: 'asc' },
    });
    return res.json(emails);
  } catch (error) {
    console.error('[EmailController] Error fetching scheduled emails:', error);
    return res.status(500).json({ message: 'Error fetching scheduled emails' });
  }
};

export const getSentEmails = async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).userId;
    const emails = await prisma.emailJob.findMany({
      where: { senderId, status: { in: ['sent', 'failed'] } },
      orderBy: { sentTime: 'desc' },
    });
    return res.json(emails);
  } catch (error) {
    console.error('[EmailController] Error fetching sent emails:', error);
    return res.status(500).json({ message: 'Error fetching sent emails' });
  }
};

export const getEmailStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const email = await prisma.emailJob.findUnique({ where: { id } });
    if (!email) return res.status(404).json({ message: 'Email job not found' });
    return res.json(email);
  } catch (error) {
    console.error('[EmailController] Error fetching email status:', error);
    return res.status(500).json({ message: 'Error fetching email status' });
  }
};

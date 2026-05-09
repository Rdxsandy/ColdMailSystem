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
      return res.status(400).json({ message: 'Invalid emails payload' });
    }

    // Fetch sender email for the 'from' field
    const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { email: true } });
    const senderEmail = sender?.email || 'noreply@coldmailsystem.com';

    const scheduledJobs = [];

    for (const email of emails) {
      const scheduledTime = new Date(email.scheduledTime || Date.now());
      
      const dbJob = await prisma.emailJob.create({
        data: {
          recipientEmail: email.to,
          subject: email.subject,
          body: email.body,
          scheduledTime: scheduledTime,
          senderId,
          status: 'scheduled'
        }
      });

      const delay = Math.max(0, scheduledTime.getTime() - Date.now());

      await emailQueue.add(
        'send-email',
        {
          jobId: dbJob.id,
          to: email.to,
          subject: email.subject,
          text: email.body,
          senderId,
          from: senderEmail
        },
        { 
          delay,
          jobId: dbJob.id
        }
      );

      scheduledJobs.push(dbJob);
    }

    res.status(201).json({ message: 'Emails scheduled successfully', count: scheduledJobs.length });
  } catch (error: any) {
    console.error('Failed to schedule emails:', error);
    res.status(500).json({ message: 'Failed to schedule emails', error: error.message });
  }
};

export const getScheduledEmails = async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).userId;
    const emails = await prisma.emailJob.findMany({
      where: { senderId, status: { in: ['scheduled', 'queued'] } },
      orderBy: { scheduledTime: 'asc' }
    });
    res.json(emails);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching scheduled emails' });
  }
};

export const getSentEmails = async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).userId;
    const emails = await prisma.emailJob.findMany({
      where: { senderId, status: { in: ['sent', 'failed'] } },
      orderBy: { sentTime: 'desc' }
    });
    res.json(emails);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sent emails' });
  }
};

export const getEmailStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const email = await prisma.emailJob.findUnique({ where: { id } });
    if (!email) return res.status(404).json({ message: 'Not found' });
    res.json(email);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching email status' });
  }
};

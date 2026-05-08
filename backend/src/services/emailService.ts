import nodemailer from 'nodemailer';
import { env } from '../config/env';

export const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: env.ETHEREAL_USER,
    pass: env.ETHEREAL_PASS
  }
});

export const sendEmail = async (to: string, subject: string, text: string) => {
  const info = await transporter.sendMail({
    from: `"ReachInbox Mock" <${env.ETHEREAL_USER}>`,
    to,
    subject,
    text,
  });
  console.log(`Email sent: ${info.messageId}`);
  return info;
};

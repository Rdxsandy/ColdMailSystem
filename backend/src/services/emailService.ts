import nodemailer from 'nodemailer';
import { env } from '../config/env';

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

export const sendEmail = async (to: string, subject: string, text: string, from: string) => {
  const info = await transporter.sendMail({
    from: `"${from}" <${from}>`,
    to,
    subject,
    text,
  });
  console.log(`Email sent: ${info.messageId}`);
  return info;
};

import nodemailer from 'nodemailer';
import { env } from '../config/env';

// Create transporter once — reuse the same connection for all sends
let _transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // Use TLS for port 465, STARTTLS for 587
      connectionTimeout: 10000, // Fail fast if the port is blocked (e.g. on Render)
      socketTimeout: 10000,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return _transporter;
};

export const sendEmail = async (to: string, subject: string, text: string, from: string) => {
  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: `"ColdMail System" <${from}>`,
    to,
    subject,
    text,
    html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${text}</pre>`,
  });

  // Ethereal captures the email — log the preview URL
  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`[SMTP] Email sent to ${to} | MessageId: ${info.messageId}`);
  if (previewUrl) {
    console.log(`[SMTP] Preview URL (Ethereal): ${previewUrl}`);
  }

  return info;
};


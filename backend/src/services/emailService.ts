import nodemailer from 'nodemailer';
import { env } from '../config/env';

// ─── SMTP Transporter ────────────────────────────────────────────────────────
// NOTE: We do NOT cache the transporter permanently so that Render env-var
// changes (redeploy) are always picked up. The overhead is negligible.

const createTransporter = () => {
  const smtpHost = env.SMTP_HOST || '';
  const smtpUser = env.SMTP_USER || '';
  const smtpPass = env.SMTP_PASS || '';
  const smtpPort = env.SMTP_PORT || 587;

  // Validate that real credentials are configured
  if (!smtpUser || !smtpPass) {
    console.error('[SMTP] WARNING: SMTP_USER or SMTP_PASS is not set! Emails will fail.');
  }

  const isGmail = smtpHost.includes('gmail') || smtpHost === '';

  if (isGmail) {
    console.log(`[SMTP] Using Gmail service for ${smtpUser}`);
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass, // Must be a Gmail App Password (not your Google login password)
      },
      connectionTimeout: 15000,
      socketTimeout: 15000,
    });
  }

  // Generic SMTP (SendGrid, Brevo, Mailgun, etc.)
  const secure = smtpPort === 465;
  console.log(`[SMTP] Using ${smtpHost}:${smtpPort} (secure=${secure}) for ${smtpUser}`);
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure,
    requireTLS: !secure, // Force STARTTLS on port 587
    connectionTimeout: 15000,
    socketTimeout: 15000,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

export const sendEmail = async (to: string, subject: string, text: string, from: string) => {
  const transporter = createTransporter();

  // Verify connection before sending (gives a clear error if credentials are wrong)
  try {
    await transporter.verify();
  } catch (verifyErr: any) {
    console.error('[SMTP] Connection verify failed:', verifyErr.message);
    throw new Error(`SMTP connection failed: ${verifyErr.message}`);
  }

  const info = await transporter.sendMail({
    from: `"ColdMail System" <${from}>`,
    to,
    subject,
    text,
    html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${text}</pre>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`[SMTP] Email sent to ${to} | MessageId: ${info.messageId}`);
  if (previewUrl) {
    console.log(`[SMTP] Preview URL (Ethereal only): ${previewUrl}`);
  }

  return info;
};

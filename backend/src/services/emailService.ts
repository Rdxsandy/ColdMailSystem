import nodemailer from 'nodemailer';
import { env } from '../config/env';

// ─── SMTP Transporter ────────────────────────────────────────────────────────
// NOTE: We do NOT cache the transporter permanently so that Render env-var
// changes (redeploy) are always picked up. The overhead is negligible.

const createTransporter = () => {
  const smtpUser = env.SMTP_USER || '';
  const smtpPass = env.SMTP_PASS || '';

  // Validate that real credentials are configured
  if (!smtpUser || !smtpPass) {
    console.error('[SMTP] WARNING: SMTP_USER or SMTP_PASS is not set! Emails will fail.');
  }

  // Determine effective host/port — default to Gmail on 587 if not set
  const smtpHost = (env.SMTP_HOST && env.SMTP_HOST !== 'smtp.ethereal.email')
    ? env.SMTP_HOST
    : 'smtp.gmail.com';
  const smtpPort = env.SMTP_PORT === 465 ? 587 : (env.SMTP_PORT || 587);
  // port 465 (SMTPS) is BLOCKED on Render free tier — always use 587 (STARTTLS)

  console.log(`[SMTP] Connecting to ${smtpHost}:${smtpPort} as ${smtpUser}`);

  // IMPORTANT: Do NOT use nodemailer's `service: 'gmail'` shorthand.
  // It resolves to an IPv6 address + port 465, both of which are blocked on Render.
  // Instead we use the explicit host with port 587 (STARTTLS) and force IPv4 (family: 4).
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false,       // false = STARTTLS (port 587); true would be SSL (port 465, blocked)
    requireTLS: true,    // Enforce STARTTLS — reject if server doesn't support it
    family: 4,           // Force IPv4 — Render free tier has unreliable IPv6 routing
    connectionTimeout: 20000,
    socketTimeout: 20000,
    greetingTimeout: 10000,
    auth: {
      user: smtpUser,
      pass: smtpPass,    // Must be a Gmail App Password, NOT your Google account password
    },
    tls: {
      rejectUnauthorized: true,
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

import { env } from '../config/env';

// ─── Tri-mode Email Service ───────────────────────────────────────────────────
//
// Priority order (first configured wins):
//
// 1. Gmail API (OAuth2 over HTTPS) — GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET +
//    GMAIL_REFRESH_TOKEN set.  Uses Google's REST API on port 443, so Render's
//    free tier SMTP port blocks (25 / 465 / 587) don't apply.
//    Quota: 500 messages/day for a regular Gmail account.
//
// 2. Resend HTTP API — RESEND_API_KEY set.
//    Requires a verified sender domain for arbitrary recipients.
//
// 3. Nodemailer SMTP — local development fallback.
//    Works fine locally (port 587); Render blocks this port so never used there.
//
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Gmail API (OAuth2) ─────────────────────────────────────────────────────
import { google } from 'googleapis';

const getGmailClient = () => {
  const oauth2Client = new google.auth.OAuth2(
    env.GMAIL_CLIENT_ID,
    env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oauth2Client.setCredentials({ refresh_token: env.GMAIL_REFRESH_TOKEN });
  return google.gmail({ version: 'v1', auth: oauth2Client });
};

/**
 * Build a base64url-encoded RFC 2822 message (required by Gmail API).
 */
const buildRawEmail = (
  to: string,
  from: string,
  subject: string,
  text: string
): string => {
  const mime = [
    `From: ColdMail System <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    text,
  ].join('\r\n');

  return Buffer.from(mime)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const sendViaGmailAPI = async (
  to: string,
  subject: string,
  text: string,
  from: string
): Promise<void> => {
  const gmail = getGmailClient();
  const senderAddress = from || env.GMAIL_USER || env.SMTP_USER;

  console.log(`[Gmail API] Sending to ${to} from ${senderAddress}`);

  const raw = buildRawEmail(to, senderAddress, subject, text);

  const { data } = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  console.log(`[Gmail API] Email sent to ${to} | MessageId: ${data.id}`);
};

// ── 2. Resend HTTP API ────────────────────────────────────────────────────────
import { Resend } from 'resend';

let _resend: Resend | null = null;
const getResend = (): Resend => {
  if (!_resend) _resend = new Resend(env.RESEND_API_KEY!);
  return _resend;
};

const sendViaResend = async (
  to: string,
  subject: string,
  text: string
): Promise<void> => {
  const resend = getResend();
  const senderAddress = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  console.log(`[Resend] Sending to ${to} from ${senderAddress}`);

  const { data, error } = await resend.emails.send({
    from: `ColdMail System <${senderAddress}>`,
    to,
    subject,
    text,
    html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${text}</pre>`,
  });

  if (error) {
    console.error('[Resend] Send failed:', error);
    throw new Error(`Resend error: ${error.message}`);
  }

  console.log(`[Resend] Email sent to ${to} | MessageId: ${data?.id}`);
};

// ── 3. Nodemailer SMTP ────────────────────────────────────────────────────────
import nodemailer from 'nodemailer';

let _transporter: nodemailer.Transporter | null = null;
const getTransporter = (): nodemailer.Transporter => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return _transporter;
};

const sendViaSMTP = async (
  to: string,
  subject: string,
  text: string,
  from: string
): Promise<void> => {
  const transporter = getTransporter();
  const senderAddress = from || env.SMTP_USER;

  console.log(`[SMTP] Sending to ${to} from ${senderAddress}`);

  const info = await transporter.sendMail({
    from: `ColdMail System <${senderAddress}>`,
    to,
    subject,
    text,
    html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${text}</pre>`,
  });

  console.log(`[SMTP] Email sent to ${to} | MessageId: ${info.messageId}`);
};

// ── Public API ────────────────────────────────────────────────────────────────
export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  from: string
): Promise<void> => {
  if (env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN) {
    // Production: Gmail API over HTTPS — not blocked by Render, completely free
    await sendViaGmailAPI(to, subject, text, from);
  } else if (env.RESEND_API_KEY) {
    // Fallback: Resend HTTP API (requires verified sender domain)
    await sendViaResend(to, subject, text);
  } else if (env.SMTP_USER && env.SMTP_PASS) {
    // Local dev only: SMTP (blocked on Render free tier)
    await sendViaSMTP(to, subject, text, from);
  } else {
    throw new Error(
      'No email provider configured. Set GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET + ' +
      'GMAIL_REFRESH_TOKEN (production) or SMTP_USER + SMTP_PASS (local dev).'
    );
  }
};

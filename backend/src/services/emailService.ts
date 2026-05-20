import { env } from '../config/env';

// ─── Dual-mode Email Service ──────────────────────────────────────────────────
//
// • LOCAL / Development  → Nodemailer + Gmail SMTP (SMTP_HOST / SMTP_USER / SMTP_PASS)
//   Gmail SMTP works fine locally because Render's port-blocking doesn't apply.
//
// • PRODUCTION (Render)  → Resend HTTP API (RESEND_API_KEY)
//   Render free tier blocks all outbound SMTP ports (25, 465, 587), so we must
//   use an HTTP-based provider instead.  Get a free key at https://resend.com.
//
// The mode is selected automatically:
//   - RESEND_API_KEY set  → Resend  (takes priority)
//   - otherwise           → Nodemailer SMTP
// ─────────────────────────────────────────────────────────────────────────────

// ── Resend path ───────────────────────────────────────────────────────────────
import { Resend } from 'resend';

let _resend: Resend | null = null;
const getResend = (): Resend => {
  if (!_resend) _resend = new Resend(env.RESEND_API_KEY!);
  return _resend;
};

const sendViaResend = async (to: string, subject: string, text: string): Promise<void> => {
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

// ── Nodemailer (SMTP) path ────────────────────────────────────────────────────
import nodemailer from 'nodemailer';

let _transporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // true only for port 465 (SSL), false for 587 (TLS/STARTTLS)
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return _transporter;
};

const sendViaSMTP = async (to: string, subject: string, text: string, from: string): Promise<void> => {
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

// ── Public API ─────────────────────────────────────────────────────────────────
export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  from: string
): Promise<void> => {
  if (env.RESEND_API_KEY) {
    // Production: use Resend HTTP API (bypasses Render SMTP port blocks)
    await sendViaResend(to, subject, text);
  } else {
    // Local / dev: use SMTP (Gmail works fine locally)
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      throw new Error(
        'No email provider configured. Set RESEND_API_KEY (production) ' +
        'or SMTP_USER + SMTP_PASS (local development) in your .env file.'
      );
    }
    await sendViaSMTP(to, subject, text, from);
  }
};

import { Resend } from 'resend';
import { env } from '../config/env';

// ─── Resend HTTP Email Client ─────────────────────────────────────────────────
// Uses Resend's HTTPS API (port 443) — works on Render free tier.
// Render blocks all outbound SMTP ports (25, 465, 587), so nodemailer/SMTP
// always times out. Resend is the correct solution for serverless/PaaS hosting.
//
// Sign up free at https://resend.com — 3,000 emails/month, 100/day.
// Set RESEND_API_KEY in your Render environment variables.

let _resend: Resend | null = null;

const getResend = (): Resend => {
  if (!env.RESEND_API_KEY) {
    throw new Error(
      'RESEND_API_KEY is not set. Add it to your Render environment variables. ' +
      'Get a free API key at https://resend.com'
    );
  }
  if (!_resend) {
    _resend = new Resend(env.RESEND_API_KEY);
  }
  return _resend;
};

export const sendEmail = async (to: string, subject: string, text: string, from: string) => {
  const resend = getResend();

  // Resend requires a verified sender domain in production.
  // During testing you can use: onboarding@resend.dev  (Resend's built-in test sender)
  // For production: verify your domain at resend.com/domains and use your own address.
  const senderAddress = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  console.log(`[Resend] Sending email to ${to} from ${senderAddress}`);

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
  return data;
};

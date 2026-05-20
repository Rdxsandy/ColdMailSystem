import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import dns from 'dns/promises';
import { env } from '../config/env';

// ─── SMTP Transporter ────────────────────────────────────────────────────────

// Resolve a hostname to its IPv4 address to bypass Render's broken IPv6 routing.
// Returns the original hostname if resolution fails (safe fallback).
const resolveIPv4 = async (hostname: string): Promise<string> => {
  try {
    const result = await dns.lookup(hostname, { family: 4 });
    console.log(`[SMTP] Resolved ${hostname} → ${result.address} (IPv4)`);
    return result.address;
  } catch {
    console.warn(`[SMTP] Could not resolve ${hostname} to IPv4, using hostname directly`);
    return hostname;
  }
};

export const sendEmail = async (to: string, subject: string, text: string, from: string) => {
  const smtpUser = env.SMTP_USER || '';
  const smtpPass = env.SMTP_PASS || '';

  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP_USER or SMTP_PASS environment variable is not set on the server');
  }

  // Determine host/port — default to Gmail 587 if not configured
  const smtpHostname = (env.SMTP_HOST && env.SMTP_HOST !== 'smtp.ethereal.email')
    ? env.SMTP_HOST
    : 'smtp.gmail.com';
  const smtpPort = env.SMTP_PORT === 465 ? 587 : (env.SMTP_PORT || 587);
  // port 465 is BLOCKED on Render free tier — always use 587 (STARTTLS)

  // Resolve hostname to a concrete IPv4 address BEFORE creating the transporter.
  // Render free tier has unreliable IPv6 outbound routing, so forcing IPv4 here
  // prevents "ENETUNREACH 2607:..." errors.
  const smtpHost = await resolveIPv4(smtpHostname);

  console.log(`[SMTP] Connecting to ${smtpHost}:${smtpPort} as ${smtpUser}`);

  // Do NOT use nodemailer's `service: 'gmail'` shorthand — it defaults to port 465 + IPv6.
  const options: SMTPTransport.Options = {
    host: smtpHost,       // Already a concrete IPv4 address — no DNS needed at connect time
    port: smtpPort,
    secure: false,        // false = STARTTLS (port 587)
    requireTLS: true,     // Enforce STARTTLS upgrade
    connectionTimeout: 20000,
    socketTimeout: 20000,
    auth: {
      user: smtpUser,
      pass: smtpPass,     // Must be a Gmail App Password, NOT your Google account password
    },
    tls: {
      rejectUnauthorized: true,
      servername: smtpHostname, // SNI must use the original hostname, not the IP
    },
  };

  const transporter = nodemailer.createTransport(options);

  // Verify SMTP connection before sending — gives a clear error if credentials are wrong
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
  }) as SMTPTransport.SentMessageInfo;

  console.log(`[SMTP] Email sent to ${to} | MessageId: ${info.messageId}`);

  return info;
};

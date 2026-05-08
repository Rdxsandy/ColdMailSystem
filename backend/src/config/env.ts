import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL as string,
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
  SESSION_SECRET: process.env.SESSION_SECRET || 'secret',
  ETHEREAL_USER: process.env.ETHEREAL_USER as string,
  ETHEREAL_PASS: process.env.ETHEREAL_PASS as string,
  WORKER_CONCURRENCY: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  MAX_EMAILS_PER_HOUR: parseInt(process.env.MAX_EMAILS_PER_HOUR || '200', 10),
  MIN_DELAY_BETWEEN_EMAILS: parseInt(process.env.MIN_DELAY_BETWEEN_EMAILS || '2000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173'
};

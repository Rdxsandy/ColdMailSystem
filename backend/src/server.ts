import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from './config/passport';
import { env } from './config/env';
import authRoutes from './routes/authRoutes';
import emailRoutes from './routes/emailRoutes';

const app = express();

const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl) or matching origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

app.set('trust proxy', 1);

app.use(session({
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true, // Required for Render to trust the secure cookie over proxy
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    sameSite: (env.NODE_ENV === 'production' || process.env.RENDER) ? 'none' : 'lax',
    secure: (env.NODE_ENV === 'production' || process.env.RENDER) ? true : false
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/emails', emailRoutes);

// Health check — always responds immediately so Render knows the server is up
app.get('/health', (req: import('express').Request, res: import('express').Response) => {
  res.json({ status: 'ok' });
});

// Start HTTP server first — this MUST happen before any blocking I/O
const server = app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);

  // Initialize the BullMQ worker AFTER the HTTP server is listening.
  // This ensures Render's health-check passes even if Redis is slow to connect.
  try {
    require('./workers/emailWorker');
    console.log('[Server] Email worker initialized');
  } catch (err: any) {
    // Worker failed to start (e.g. no Redis) — log it but keep serving HTTP
    console.error('[Server] Email worker failed to initialize:', err.message);
    console.warn('[Server] Scheduled/queued emails will not be processed until Redis is available');
  }
});

export default app;

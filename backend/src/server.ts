import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from './config/passport';
import { env } from './config/env';
import authRoutes from './routes/authRoutes';
import emailRoutes from './routes/emailRoutes';
import './workers/emailWorker'; // Initialize worker

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

app.use(session({
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/emails', emailRoutes);

app.get('/health', (req: import('express').Request, res: import('express').Response) => {
  res.json({ status: 'ok' });
});

app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});

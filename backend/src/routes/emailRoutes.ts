import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { scheduleEmails, sendInstantEmails, getScheduledEmails, getSentEmails, getEmailStatus } from '../controllers/emailController';

const router = Router();

// JWT-based auth middleware — reads the Authorization: Bearer <token> header
// This works with the stateless JWT approach (no sessions, no MemoryStore)
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    (req as any).userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

router.use(isAuthenticated);

router.post('/schedule', scheduleEmails);
router.post('/send-instant', sendInstantEmails);
router.get('/scheduled', getScheduledEmails);
router.get('/sent', getSentEmails);
router.get('/:id', getEmailStatus);

export default router;

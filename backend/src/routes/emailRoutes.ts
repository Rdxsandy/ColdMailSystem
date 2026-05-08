import { Router, Request, Response, NextFunction } from 'express';
import { scheduleEmails, getScheduledEmails, getSentEmails, getEmailStatus } from '../controllers/emailController';

const router = Router();

// Middleware to ensure authentication
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: 'Unauthorized' });
};

router.use(isAuthenticated);

router.post('/schedule', scheduleEmails);
router.get('/scheduled', getScheduledEmails);
router.get('/sent', getSentEmails);
router.get('/:id', getEmailStatus);

export default router;

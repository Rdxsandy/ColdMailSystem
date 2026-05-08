import { Request, Response } from 'express';
import { env } from '../config/env';

export const googleCallback = (req: Request, res: Response) => {
  // Successful authentication, redirect to frontend dashboard.
  res.redirect(`${env.FRONTEND_URL}/dashboard`);
};

export const logout = (req: Request, res: Response) => {
  req.logout(() => {
    res.json({ message: 'Logged out successfully' });
  });
};

export const getCurrentUser = (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

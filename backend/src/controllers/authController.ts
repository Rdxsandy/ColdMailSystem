import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// Step 1: After Google OAuth success, issue a short-lived JWT and redirect to frontend
export const googleCallback = (req: Request, res: Response) => {
  if (!req.user) {
    return res.redirect(`${env.FRONTEND_URL}/login?error=auth_failed`);
  }

  const user = req.user as any;

  // Sign a 5-minute token containing just the user id
  const token = jwt.sign(
    { userId: user.id },
    env.JWT_SECRET,
    { expiresIn: '5m' }
  );

  // Redirect to frontend with token in URL — frontend will exchange it for a session
  // encodeURIComponent is required: JWT contains +, /, = chars that break URL parsing
  res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}`);
};

// Step 2: Frontend calls this endpoint with the token → backend sets session cookie
export const verifyToken = (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };

    // Log the user into the session (this sets a proper first-party session cookie)
    (req.session as any).userId = payload.userId;
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ message: 'Session save failed' });
      }
      res.json({ message: 'Authenticated', userId: payload.userId });
    });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const logout = (req: Request, res: Response) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.json({ message: 'Logged out successfully' });
    });
  });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  // Support both passport session (req.user) and manual session (req.session.userId)
  if (req.isAuthenticated() && req.user) {
    return res.json(req.user);
  }

  if ((req.session as any).userId) {
    const { prisma } = await import('../config/prisma');
    const user = await prisma.user.findUnique({ where: { id: (req.session as any).userId } });
    if (user) return res.json(user);
  }

  res.status(401).json({ message: 'Unauthorized' });
};

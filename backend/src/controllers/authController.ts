import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// ─── Step 1: After Google OAuth success, issue a short-lived one-time token ───
// This token is passed in the URL and immediately exchanged via /auth/verify-token.
// The real long-lived JWT is returned from /auth/verify-token, NOT from the URL.
export const googleCallback = (req: Request, res: Response) => {
  if (!req.user) {
    return res.redirect(`${env.FRONTEND_URL}/login?error=auth_failed`);
  }

  const user = req.user as any;

  // Short-lived 5-min one-time token — just to get the user ID to the frontend
  const oneTimeToken = jwt.sign(
    { userId: user.id },
    env.JWT_SECRET,
    { expiresIn: '5m' }
  );

  // encodeURIComponent is needed because base64url can contain + and = chars
  res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${encodeURIComponent(oneTimeToken)}`);
};

// ─── Step 2: Frontend POSTs the one-time token → backend returns a long-lived JWT ───
// No sessions. No cookies. The long-lived JWT is stored in localStorage on the frontend.
export const verifyToken = async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    // Verify the one-time token
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };

    // Fetch the user from database to include in the long-lived JWT
    const { prisma } = await import('../config/prisma');
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user) {
      console.error('[verifyToken] User not found for id:', payload.userId);
      return res.status(401).json({ message: 'User not found' });
    }

    // Issue a LONG-LIVED JWT (7 days) — no session store needed
    const longLivedToken = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return the token and user data — frontend stores in localStorage
    return res.json({
      token: longLivedToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      }
    });
  } catch (err) {
    const errMsg = (err as Error).message;
    console.error('[verifyToken] Failed:', errMsg, '| Secret prefix:', env.JWT_SECRET?.substring(0, 8));
    return res.status(401).json({ message: 'Invalid or expired token', detail: errMsg });
  }
};

// ─── Get Current User — reads JWT from Authorization header ───────────────────
export const getCurrentUser = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    const { prisma } = await import('../config/prisma');
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ─── Logout — stateless, just tell the frontend to clear localStorage ─────────
export const logout = (_req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
};

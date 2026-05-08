import { Router } from 'express';
import passport from 'passport';
import { googleCallback, verifyToken, logout, getCurrentUser } from '../controllers/authController';

const router = Router();

// Step 1: Redirect user to Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Step 2: Google redirects back here, we issue a short-lived JWT and redirect to frontend
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`, session: true }),
  googleCallback
);

// Step 3: Frontend POSTs the JWT here to get a real session cookie
router.post('/verify-token', verifyToken);

router.post('/logout', logout);
router.get('/me', getCurrentUser);

export default router;

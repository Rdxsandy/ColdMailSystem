import { Router } from 'express';
import passport from 'passport';
import { googleCallback, logout, getCurrentUser } from '../controllers/authController';

const router = Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  googleCallback
);

router.post('/logout', logout);
router.get('/me', getCurrentUser);

export default router;

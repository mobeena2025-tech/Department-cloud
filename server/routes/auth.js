import express from 'express';
import { createAuthClient } from '../supabase.js';
import { requireAuth, loadProfile, toUserResponse } from '../lib/auth.js';
import { HttpError, asyncHandler, requiredString } from '../lib/validate.js';

const router = express.Router();

function sessionResponse(session) {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at, // unix seconds
  };
}

// Email + password sign-in through Supabase Auth.
router.post('/login', asyncHandler(async (req, res) => {
  const email = requiredString(req.body?.email, 'email', { max: 200 }).toLowerCase();
  const password = requiredString(req.body?.password, 'password', { max: 200 });

  const { data, error } = await createAuthClient().auth.signInWithPassword({ email, password });
  if (error || !data?.session) {
    // Same message for unknown email and wrong password.
    throw new HttpError(401, 'Invalid email or password');
  }

  const profile = await loadProfile(data.user.id);
  if (!profile) throw new HttpError(403, 'This account has no role assigned. Contact the department admin.');

  res.json({ success: true, session: sessionResponse(data.session), user: toUserResponse(profile) });
}));

// Exchange a refresh token for a new access token.
router.post('/refresh', asyncHandler(async (req, res) => {
  const refreshToken = requiredString(req.body?.refreshToken, 'refreshToken', { max: 500 });

  const { data, error } = await createAuthClient().auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data?.session) throw new HttpError(401, 'Your session has expired. Please sign in again.');

  const profile = await loadProfile(data.user.id);
  if (!profile) throw new HttpError(403, 'This account has no role assigned');

  res.json({ success: true, session: sessionResponse(data.session), user: toUserResponse(profile) });
}));

// Current user (validates the token).
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

export default router;

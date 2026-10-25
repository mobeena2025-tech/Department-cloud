import express from 'express';
import supabase, { createAuthClient } from '../supabase.js';
import { requireAuth, loadProfile, toUserResponse, clearAuthCache } from '../lib/auth.js';
import { validateNewPassword } from '../lib/password.js';
import { HttpError, asyncHandler, requiredString } from '../lib/validate.js';
import { recordAuditLog } from '../lib/audit.js';
import { loginByEmail, loginByIp } from '../lib/rateLimit.js';

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

  // Stop password guessing before asking Supabase.
  const ipKey = `ip:${req.ip}`;
  const emailKey = `email:${email}`;
  loginByIp.check(ipKey);
  loginByEmail.check(emailKey);

  const { data, error } = await createAuthClient().auth.signInWithPassword({ email, password });

  // Supabase's own limit (too many sign-ins from this server in a short
  // time) is not the user's fault: say so instead of "wrong password".
  if (error && error.status === 429) {
    throw new HttpError(503, 'Sign-in is busy right now. Please try again in a minute.');
  }

  if (error || !data?.session) {
    loginByIp.hit(ipKey);
    loginByEmail.hit(emailKey);
    recordAuditLog(req, {
      action: 'LOGIN',
      actor: { email },
      status: 'FAILURE',
      severity: 'WARNING',
      details: 'Wrong email or password.',
    });
    // Same message for unknown email and wrong password.
    throw new HttpError(401, 'Invalid email or password');
  }
  loginByEmail.reset(emailKey);

  const profile = await loadProfile(data.user.id);
  if (!profile) throw new HttpError(403, 'This account has no role assigned. Contact the department admin.');

  const user = toUserResponse(profile, data.user);
  recordAuditLog(req, { action: 'LOGIN', actor: user });
  res.json({ success: true, session: sessionResponse(data.session), user });
}));

// Exchange a refresh token for a new access token.
router.post('/refresh', asyncHandler(async (req, res) => {
  const refreshToken = requiredString(req.body?.refreshToken, 'refreshToken', { max: 500 });

  const { data, error } = await createAuthClient().auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data?.session) throw new HttpError(401, 'Your session has expired. Please sign in again.');

  const profile = await loadProfile(data.user.id);
  if (!profile) throw new HttpError(403, 'This account has no role assigned');

  res.json({ success: true, session: sessionResponse(data.session), user: toUserResponse(profile, data.user) });
}));

// Current user (validates the token).
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Change your own password. Requires the current password. Every other
// session (other phones/laptops) is signed out; this device gets a new one.
// A wrong current password is a 400, not a 401: a 401 would make the app
// think the session expired and sign the user out.
router.post('/change-password', requireAuth, asyncHandler(async (req, res) => {
  const currentPassword = requiredString(req.body?.currentPassword, 'currentPassword', { max: 200 });
  const newPassword = String(req.body?.newPassword ?? '');
  validateNewPassword(newPassword, { email: req.user.email });
  if (newPassword === currentPassword) throw new HttpError(400, 'New password must be different from the current one');

  // Same guessing protection as sign-in.
  const emailKey = `email:${req.user.email}`;
  loginByEmail.check(emailKey);

  const { error: signInError } = await createAuthClient().auth.signInWithPassword({
    email: req.user.email,
    password: currentPassword,
  });
  if (signInError && signInError.status === 429) {
    throw new HttpError(503, 'Busy right now. Please try again in a minute.');
  }
  if (signInError) {
    loginByEmail.hit(emailKey);
    recordAuditLog(req, { action: 'CHANGE_PASSWORD', status: 'FAILURE', severity: 'WARNING', details: 'Wrong current password.' });
    throw new HttpError(400, 'Current password is incorrect');
  }
  loginByEmail.reset(emailKey);

  const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
    password: newPassword,
    app_metadata: { must_change_password: false },
  });
  if (error) {
    console.error('Password update failed:', error.message);
    throw new HttpError(500, 'Could not change the password');
  }

  // Supabase ends ALL of the account's sessions when the password changes
  // (other devices included), so sign this device back in with the new one.
  clearAuthCache();
  const { data: fresh, error: freshError } = await createAuthClient().auth.signInWithPassword({
    email: req.user.email,
    password: newPassword,
  });
  if (freshError) console.warn('Re-sign-in after password change failed:', freshError.message);

  recordAuditLog(req, { action: 'CHANGE_PASSWORD', details: 'Password changed; other sessions signed out.' });
  res.json({
    success: true,
    message: 'Password changed',
    // null if the re-sign-in failed: the app then asks the user to sign in again.
    session: fresh?.session ? sessionResponse(fresh.session) : null,
    user: { ...req.user, mustChangePassword: false },
  });
}));

export default router;

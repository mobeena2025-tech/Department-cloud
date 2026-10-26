import crypto from 'node:crypto';
import { HttpError } from './validate.js';

/** Throws HttpError(400) if `password` is not acceptable as a new password. */
export function validateNewPassword(password, { email = '', rollNo = '' } = {}) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpError(400, 'New password must be at least 8 characters');
  }
  if (password.length > 72) throw new HttpError(400, 'New password must be at most 72 characters');
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new HttpError(400, 'New password must contain at least one letter and one number');
  }
  const local = String(email).split('@')[0].toLowerCase();
  if (local.length >= 4 && password.toLowerCase().includes(local)) {
    throw new HttpError(400, 'New password must not contain your email name');
  }
  const roll = rollNumberPassword(rollNo);
  if (roll && password.replace(/[^0-9A-Za-z]/g, '').toLowerCase().includes(roll.toLowerCase())) {
    throw new HttpError(400, 'New password must not contain your roll number');
  }
  return password;
}

/** First-time password for a student: the roll number without hyphens/spaces. */
export function rollNumberPassword(rollNo) {
  return String(rollNo || '').replace(/[^0-9A-Za-z]/g, '');
}

/** Easy-to-read random password (no 0/O/1/l/I), always with letters and digits. */
export function generateTemporaryPassword(length = 12) {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const all = letters + digits;
  for (;;) {
    const bytes = crypto.randomBytes(length);
    const pw = Array.from(bytes, (b) => all[b % all.length]).join('');
    if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) return pw;
  }
}

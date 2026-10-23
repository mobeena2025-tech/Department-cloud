import crypto from 'node:crypto';
import supabase from '../supabase.js';
import { HttpError } from './validate.js';

// The user object the API attaches to req.user and returns to the frontend.
export function toUserResponse(profile) {
  return {
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: profile.role,
    department: profile.department,
    rollNo: profile.roll_number,
    semester: profile.semester,
    section: profile.section,
    cgpa: profile.cgpa,
  };
}

export async function loadProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) {
    console.error('Profile lookup error:', error.message);
    throw new HttpError(500, 'Database error');
  }
  return data;
}

// Verified tokens are cached briefly so a page that makes several API calls
// doesn't ask Supabase Auth to verify the same token each time.
const CACHE_MS = 30 * 1000;
const cache = new Map(); // sha256(token) -> { user, until }

function cacheKey(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function clearAuthCache() {
  cache.clear();
}

/**
 * Verifies the Supabase access token in "Authorization: Bearer <token>",
 * loads the user's role from profiles, and sets req.user.
 * 401 = missing/invalid/expired token, 403 = valid login but no profile.
 */
export async function requireAuth(req, res, next) {
  try {
    const match = (req.headers.authorization || '').match(/^Bearer\s+(\S+)$/i);
    if (!match) throw new HttpError(401, 'Authentication required');
    const token = match[1];

    const key = cacheKey(token);
    const hit = cache.get(key);
    if (hit && hit.until > Date.now()) {
      req.user = hit.user;
      return next();
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) throw new HttpError(401, 'Your session has expired. Please sign in again.');

    const profile = await loadProfile(data.user.id);
    if (!profile) throw new HttpError(403, 'This account has no role assigned');

    req.user = toUserResponse(profile);
    cache.set(key, { user: req.user, until: Date.now() + CACHE_MS });
    if (cache.size > 500) cache.delete(cache.keys().next().value);
    next();
  } catch (err) {
    next(err);
  }
}

// Allow only the listed roles, e.g. requireRole('faculty', 'admin').
export function requireRole(...roles) {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) return next();
    next(new HttpError(403, 'You do not have permission to do this'));
  };
}

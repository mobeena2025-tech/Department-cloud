import { HttpError } from './validate.js';

/**
 * Small in-memory limiter (no extra packages). Counts attempts per key within
 * a time window and refuses with 429 once the limit is reached.
 * Good enough for one server instance; counts reset when the server restarts.
 */
export function createLimiter({ limit, windowMs }) {
  const hits = new Map(); // key -> { count, resetAt }

  function sweep(now) {
    if (hits.size < 5000) return;
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }

  return {
    // Throws HttpError(429) if `key` has used up its attempts.
    check(key) {
      const now = Date.now();
      const entry = hits.get(key);
      if (entry && entry.resetAt > now && entry.count >= limit) {
        const minutes = Math.ceil((entry.resetAt - now) / 60000);
        throw new HttpError(429, `Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`);
      }
    },
    // Record one attempt (call for failed sign-ins).
    hit(key) {
      const now = Date.now();
      sweep(now);
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= now) hits.set(key, { count: 1, resetAt: now + windowMs });
      else entry.count += 1;
    },
    reset(key) {
      hits.delete(key);
    },
    clear() {
      hits.clear();
    },
  };
}

// Sign-in guessing protection:
//   per account: 5 wrong passwords per 15 minutes
//   per network address: 30 wrong passwords per 15 minutes
// A whole class on one college Wi-Fi signing in correctly is never blocked,
// because only FAILED attempts count.
export const loginByEmail = createLimiter({ limit: 5, windowMs: 15 * 60 * 1000 });
export const loginByIp = createLimiter({ limit: 30, windowMs: 15 * 60 * 1000 });

import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetDb, startServer, stopServer, request } from './helpers/fakeSupabase.js';
import { createLimiter } from '../server/lib/rateLimit.js';

before(startServer);
after(stopServer);
beforeEach(resetDb);

// In tests Supabase is unreachable, so every sign-in is a failed attempt.
const tryLogin = (email) => request('POST', '/auth/login', { body: { email, password: 'wrong-password' } });

test('after 5 wrong passwords an account is locked for a while', async () => {
  for (let i = 0; i < 5; i++) {
    assert.equal((await tryLogin('victim@example.edu')).status, 401);
  }
  const blocked = await tryLogin('victim@example.edu');
  assert.equal(blocked.status, 429);
  assert.match(blocked.body.message, /Too many sign-in attempts/);

  // Other accounts are not affected.
  assert.equal((await tryLogin('someone.else@example.edu')).status, 401);
});

test('one address guessing across many accounts is stopped after 30 failures', async () => {
  for (let i = 0; i < 30; i++) {
    assert.equal((await tryLogin(`user${i}@example.edu`)).status, 401);
  }
  assert.equal((await tryLogin('user-new@example.edu')).status, 429);
});

test('the limit window expires', () => {
  const limiter = createLimiter({ limit: 2, windowMs: 50 });
  limiter.hit('k');
  limiter.hit('k');
  assert.throws(() => limiter.check('k'), /Too many/);
  return new Promise((resolve) =>
    setTimeout(() => {
      assert.doesNotThrow(() => limiter.check('k'));
      resolve();
    }, 70)
  );
});

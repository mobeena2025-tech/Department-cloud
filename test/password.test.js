import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db, ids, tokens, resetDb, startServer, stopServer, request } from './helpers/fakeSupabase.js';
import { validateNewPassword, generateTemporaryPassword } from '../server/lib/password.js';

before(startServer);
after(stopServer);
beforeEach(resetDb);

const change = (token, currentPassword, newPassword) =>
  request('POST', '/auth/change-password', { token, body: { currentPassword, newPassword } });

const login = (email, password) => request('POST', '/auth/login', { body: { email, password } });

test('a signed-in user can change their password; only the new one works after', async () => {
  const otherDevice = (await login('studentin@test.local', 'Password123')).body.session.accessToken;

  const res = await change(tokens.studentIn, 'Password123', 'NewPass456');
  assert.equal(res.status, 200);

  assert.equal((await login('studentin@test.local', 'Password123')).status, 401);
  assert.equal((await login('studentin@test.local', 'NewPass456')).status, 200);

  // Old sessions (this one and other devices) end; this device gets a fresh one.
  assert.equal((await request('GET', '/auth/me', { token: otherDevice })).status, 401);
  assert.equal((await request('GET', '/auth/me', { token: tokens.studentIn })).status, 401);
  const me = await request('GET', '/auth/me', { token: res.body.session.accessToken });
  assert.equal(me.status, 200);
  assert.equal(me.body.user.id, ids.studentIn);
  assert.ok(db.tables.audit_logs.some((l) => l.action === 'CHANGE_PASSWORD' && l.status !== 'FAILURE'));
});

test('a wrong current password is refused with 400 (not 401, which would sign the user out)', async () => {
  const res = await change(tokens.studentIn, 'not-my-password', 'NewPass456');
  assert.equal(res.status, 400);
  assert.match(res.body.message, /Current password is incorrect/);
  assert.equal(db.authUsers[ids.studentIn].password, 'Password123');
});

test('repeated wrong current passwords are rate limited', async () => {
  for (let i = 0; i < 5; i++) {
    assert.equal((await change(tokens.studentIn, `wrong${i}`, 'NewPass456')).status, 400);
  }
  assert.equal((await change(tokens.studentIn, 'Password123', 'NewPass456')).status, 429);
});

test('weak or unchanged new passwords are refused', async () => {
  for (const weak of ['short1', 'onlyletters', '12345678', 'studentin99']) {
    const res = await change(tokens.studentIn, 'Password123', weak);
    assert.equal(res.status, 400, weak);
  }
  assert.equal((await change(tokens.studentIn, 'Password123', 'Password123')).status, 400);
  assert.equal(db.authUsers[ids.studentIn].password, 'Password123');
});

test('changing a password needs a sign-in', async () => {
  assert.equal((await change(undefined, 'Password123', 'NewPass456')).status, 401);
});

test('admin reset gives a one-time temporary password and flags the account', async () => {
  const res = await request('POST', `/users/${ids.studentIn}/reset-password`, { token: tokens.admin });
  assert.equal(res.status, 200);
  const temp = res.body.temporaryPassword;
  assert.ok(temp && temp.length >= 12);
  assert.equal(db.authUsers[ids.studentIn].password, temp);

  // The password is never written to the audit log.
  const logged = JSON.stringify(db.tables.audit_logs);
  assert.ok(logged.includes('RESET_PASSWORD'));
  assert.ok(!logged.includes(temp));

  // Signing in with it shows the "choose your own" reminder ...
  const signedIn = await login('studentin@test.local', temp);
  assert.equal(signedIn.status, 200);
  assert.equal(signedIn.body.user.mustChangePassword, true);
  const me = await request('GET', '/auth/me', { token: signedIn.body.session.accessToken });
  assert.equal(me.body.user.mustChangePassword, true);

  // ... until the user changes it.
  assert.equal((await change(signedIn.body.session.accessToken, temp, 'MyOwnPass789')).status, 200);
  assert.equal(db.authUsers[ids.studentIn].app_metadata.must_change_password, false);
  const after = await login('studentin@test.local', 'MyOwnPass789');
  assert.equal(after.body.user.mustChangePassword, false);
});

test('only admins can reset passwords, and not their own', async () => {
  for (const who of ['facultyA', 'studentIn']) {
    const res = await request('POST', `/users/${ids.studentOut}/reset-password`, { token: tokens[who] });
    assert.equal(res.status, 403, who);
  }
  assert.equal(db.authUsers[ids.studentOut].password, 'Password123');

  assert.equal((await request('POST', `/users/${ids.admin}/reset-password`, { token: tokens.admin })).status, 400);
  assert.equal((await request('POST', '/users/not-a-uuid/reset-password', { token: tokens.admin })).status, 400);
  assert.equal(
    (await request('POST', `/users/${crypto.randomUUID()}/reset-password`, { token: tokens.admin })).status,
    404
  );
});

test('password rules and generator', () => {
  assert.doesNotThrow(() => validateNewPassword('Goodpass1', { email: 'abc@x.edu' }));
  assert.throws(() => validateNewPassword('a'.repeat(73) + '1'), /72/);
  for (let i = 0; i < 50; i++) {
    const p = generateTemporaryPassword();
    assert.equal(p.length, 12);
    assert.match(p, /[A-Za-z]/);
    assert.match(p, /\d/);
    assert.doesNotMatch(p, /[0O1lI]/);
  }
});

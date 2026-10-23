import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db, tokens, resetDb, startServer, stopServer, request } from './helpers/fakeSupabase.js';

before(startServer);
after(stopServer);
beforeEach(resetDb);

test('health check is public', async () => {
  const res = await request('GET', '/health');
  assert.equal(res.status, 200);
});

test('every protected route returns 401 without a token', async () => {
  const routes = [
    ['GET', '/courses'],
    ['GET', '/courses/CS202'],
    ['GET', '/materials'],
    ['GET', '/materials/00000000-0000-0000-0000-000000000000'],
    ['POST', '/materials'],
    ['GET', '/assignments'],
    ['GET', '/submissions'],
    ['GET', '/announcements'],
    ['POST', '/ai-search'],
    ['GET', '/audit-logs'],
    ['GET', '/analytics'],
    ['GET', '/users'],
    ['GET', '/auth/me'],
  ];
  for (const [method, path] of routes) {
    const res = await request(method, path);
    assert.equal(res.status, 401, `${method} ${path} should need a token`);
  }
});

test('an invalid or forged token is rejected with 401', async () => {
  for (const token of ['not-a-real-token', 'demo_token_00000000-0000-0000-0000-000000000000_1700000000000']) {
    const res = await request('GET', '/courses', { token });
    assert.equal(res.status, 401);
  }
});

test('a valid login without a profile row gets 403', async () => {
  const res = await request('GET', '/courses', { token: tokens.noProfile });
  assert.equal(res.status, 403);
  assert.match(res.body.message, /no role/i);
});

test('a valid token loads the user and role from profiles', async () => {
  const res = await request('GET', '/auth/me', { token: tokens.studentIn });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.role, 'student');
  assert.equal(res.body.user.name, 'StudentIn');
});

test('requireRole: admin-only routes refuse students and faculty', async () => {
  for (const token of [tokens.studentIn, tokens.facultyA]) {
    assert.equal((await request('GET', '/analytics', { token })).status, 403);
    assert.equal((await request('GET', '/audit-logs', { token })).status, 403);
    assert.equal((await request('POST', '/courses', { token, body: { code: 'ZZ1', title: 'x', semester: 1 } })).status, 403);
  }
  assert.equal((await request('GET', '/audit-logs', { token: tokens.admin })).status, 200);
});

test('the role comes from the profile, not from the request', async () => {
  const res = await request('POST', '/courses', {
    token: tokens.studentIn,
    body: { code: 'ZZ1', title: 'x', semester: 1, role: 'admin' },
  });
  assert.equal(res.status, 403);
  assert.equal(db.tables.courses.length, 2, 'no course was created');
});

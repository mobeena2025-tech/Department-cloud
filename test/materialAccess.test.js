import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db, ids, tokens, resetDb, startServer, stopServer, request } from './helpers/fakeSupabase.js';

before(startServer);
after(stopServer);
beforeEach(resetDb);

const wait = () => new Promise((r) => setTimeout(r, 20)); // let fire-and-forget audit writes land

test('an enrolled student gets a signed URL for a course material', async () => {
  const res = await request('GET', `/materials/${ids.material}`, { token: tokens.studentIn });
  assert.equal(res.status, 200);
  assert.ok(res.body.material.fileUrl.startsWith('https://signed.example/'));
  assert.deepEqual(db.signedUrls, [`courses/${ids.cs202}/normalization.pdf`]);
});

test('an unenrolled student is denied BEFORE any signed URL is created', async () => {
  const res = await request('GET', `/materials/${ids.material}`, { token: tokens.studentOut });
  assert.equal(res.status, 403);
  assert.equal(res.body.material, undefined);
  assert.equal(db.signedUrls.length, 0, 'no signed URL may be issued');

  await wait();
  const denial = db.tables.audit_logs.find((l) => l.action === 'OPEN_MATERIAL' && l.status === 'DENIED');
  assert.ok(denial, 'the denied attempt is audit-logged');
  assert.equal(denial.actor_id, ids.studentOut);
});

test('faculty who do not teach the course are denied; the course teacher and admin are allowed', async () => {
  assert.equal((await request('GET', `/materials/${ids.material}`, { token: tokens.facultyB })).status, 403);
  assert.equal((await request('GET', `/materials/${ids.material}`, { token: tokens.facultyA })).status, 200);
  assert.equal((await request('GET', `/materials/${ids.material}`, { token: tokens.admin })).status, 200);
});

test('material lists only include courses the user can access', async () => {
  const outList = await request('GET', '/materials', { token: tokens.studentOut });
  assert.equal(outList.status, 200);
  assert.equal(outList.body.materials.length, 0);

  const inList = await request('GET', '/materials', { token: tokens.studentIn });
  assert.deepEqual(inList.body.materials.map((m) => m.id), [ids.material]);
});

test('only faculty teaching the course (or admin) can edit or delete a material', async () => {
  assert.equal((await request('PUT', `/materials/${ids.material}`, { token: tokens.facultyB, body: { title: 'x' } })).status, 403);
  assert.equal((await request('PUT', `/materials/${ids.material}`, { token: tokens.studentIn, body: { title: 'x' } })).status, 403);
  assert.equal((await request('DELETE', `/materials/${ids.material}`, { token: tokens.facultyB })).status, 403);
  assert.equal(db.tables.materials[0].title, 'Normalization notes');

  const ok = await request('PUT', `/materials/${ids.material}`, { token: tokens.facultyA, body: { title: 'Updated' } });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.material.title, 'Updated');
});

test('deleting a material removes its storage object', async () => {
  const res = await request('DELETE', `/materials/${ids.material}`, { token: tokens.facultyA });
  assert.equal(res.status, 200);
  assert.equal(db.tables.materials.length, 0);
  assert.deepEqual(db.removed, [`courses/${ids.cs202}/normalization.pdf`]);
});

test('course detail is denied to unenrolled students', async () => {
  assert.equal((await request('GET', '/courses/CS202', { token: tokens.studentOut })).status, 403);
  assert.equal((await request('GET', '/courses/CS202', { token: tokens.studentIn })).status, 200);
});

test('malformed ids get 400, not a database error', async () => {
  assert.equal((await request('GET', '/materials/not-a-uuid', { token: tokens.admin })).status, 400);
  assert.equal((await request('GET', '/courses/x,code.neq.y', { token: tokens.admin })).status, 404);
});

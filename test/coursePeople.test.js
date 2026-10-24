import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db, ids, tokens, resetDb, startServer, stopServer, request } from './helpers/fakeSupabase.js';

before(startServer);
after(stopServer);
beforeEach(resetDb);

const enrolled = (courseId, studentId) =>
  db.tables.enrollments.some((e) => e.course_id === courseId && e.student_id === studentId);
const teaches = (courseId, facultyId) =>
  db.tables.course_faculty.some((r) => r.course_id === courseId && r.faculty_id === facultyId);

test('only admin can manage course people', async () => {
  for (const token of [tokens.facultyA, tokens.studentIn]) {
    assert.equal((await request('GET', '/courses/CS202/people', { token })).status, 403);
    assert.equal((await request('POST', '/courses/CS202/enrollments', { token, body: { userIds: [ids.studentOut] } })).status, 403);
    assert.equal((await request('POST', '/courses/CS202/faculty', { token, body: { userId: ids.facultyB } })).status, 403);
  }
  assert.equal(enrolled(ids.cs202, ids.studentOut), false);
  assert.equal(teaches(ids.cs202, ids.facultyB), false);
});

test('enrolling a student gives access to the course files; removing takes it away', async () => {
  const path = `/materials/${ids.material}`;
  assert.equal((await request('GET', path, { token: tokens.studentOut })).status, 403);

  const add = await request('POST', '/courses/CS202/enrollments', { token: tokens.admin, body: { userIds: [ids.studentOut] } });
  assert.equal(add.status, 201);
  assert.equal(enrolled(ids.cs202, ids.studentOut), true);
  assert.equal((await request('GET', path, { token: tokens.studentOut })).status, 200);

  const remove = await request('DELETE', `/courses/CS202/enrollments/${ids.studentOut}`, { token: tokens.admin });
  assert.equal(remove.status, 200);
  assert.equal(enrolled(ids.cs202, ids.studentOut), false);
  // Enrollment is checked on every request, so removal takes effect at once.
  assert.equal((await request('GET', path, { token: tokens.studentOut })).status, 403);
});

test('assigning faculty lets them manage the course; removing takes it away', async () => {
  const edit = () => request('PUT', `/materials/${ids.material}`, { token: tokens.facultyB, body: { topic: 'x' } });
  assert.equal((await edit()).status, 403);

  assert.equal((await request('POST', '/courses/CS202/faculty', { token: tokens.admin, body: { userId: ids.facultyB } })).status, 201);
  assert.equal((await edit()).status, 200);

  assert.equal((await request('DELETE', `/courses/CS202/faculty/${ids.facultyB}`, { token: tokens.admin })).status, 200);
  assert.equal((await edit()).status, 403);
});

test('roles are checked: only students can be enrolled, only faculty can teach', async () => {
  const wrongEnroll = await request('POST', '/courses/CS202/enrollments', { token: tokens.admin, body: { userIds: [ids.facultyB] } });
  assert.equal(wrongEnroll.status, 400);
  assert.match(wrongEnroll.body.message, /not a student/);

  const wrongTeach = await request('POST', '/courses/CS202/faculty', { token: tokens.admin, body: { userId: ids.studentOut } });
  assert.equal(wrongTeach.status, 400);
  assert.match(wrongTeach.body.message, /not a faculty/);

  assert.equal(enrolled(ids.cs202, ids.facultyB), false);
  assert.equal(teaches(ids.cs202, ids.studentOut), false);
});

test('bad ids, unknown people and unknown courses are handled cleanly', async () => {
  const admin = tokens.admin;
  assert.equal((await request('POST', '/courses/CS202/enrollments', { token: admin, body: { userIds: ['not-a-uuid'] } })).status, 400);
  assert.equal((await request('POST', '/courses/CS202/enrollments', { token: admin, body: { userIds: [] } })).status, 400);
  assert.equal((await request('POST', '/courses/CS202/enrollments', { token: admin, body: { userIds: [ids.noProfile] } })).status, 404);
  assert.equal((await request('POST', '/courses/NOPE99/enrollments', { token: admin, body: { userIds: [ids.studentOut] } })).status, 404);
  assert.equal((await request('DELETE', `/courses/CS202/enrollments/${ids.studentOut}`, { token: admin })).status, 404, 'not enrolled');
  assert.equal((await request('DELETE', '/courses/CS202/faculty/not-a-uuid', { token: admin })).status, 400);
});

test('creating a course can assign its teacher, and refuses a non-faculty teacher', async () => {
  const bad = await request('POST', '/courses', {
    token: tokens.admin,
    body: { code: 'CS999', title: 'New course', semester: 5, facultyId: ids.studentIn },
  });
  assert.equal(bad.status, 400);
  assert.equal(db.tables.courses.length, 2, 'no course was created');

  const ok = await request('POST', '/courses', {
    token: tokens.admin,
    body: { code: 'cs999', title: 'New course', semester: 5, facultyId: ids.facultyB },
  });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.course.code, 'CS999');
  assert.equal(ok.body.course.facultyName, 'FacultyB');
  assert.equal(teaches(ok.body.course.id, ids.facultyB), true);
});

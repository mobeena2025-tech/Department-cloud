import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { db, ids, tokens, resetDb, startServer, stopServer, request, pdfForm } from './helpers/fakeSupabase.js';
import { periodKind, periodsFor, periodLabel, parsePeriod, syllabusFor } from '../server/lib/syllabus.js';

before(startServer);
after(stopServer);

// A lab course taught by faculty A, alongside the fixture courses.
const labId = crypto.randomUUID();
beforeEach(() => {
  resetDb();
  db.tables.courses.push({ id: labId, code: 'AAN-LAB', name: 'ANN Lab', semester: 5, section: '1', credits: 1 });
  db.tables.course_faculty.push({ course_id: labId, faculty_id: ids.facultyA });
  db.tables.enrollments.push({ course_id: labId, student_id: ids.studentIn });
});

const upload = (fields, file) => request('POST', '/materials', { token: tokens.facultyA, form: pdfForm(fields, file) });
const pptx = { name: 'week3.pptx', type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', content: 'PK\x03\x04....[Content_Types].xml....ppt/slides/slide1.xml' };

test('Semester 5 syllabus: theory courses have units, labs have weeks', () => {
  assert.equal(periodKind('OS'), 'unit');
  assert.equal(periodKind('AAN-LAB'), 'week');
  assert.equal(periodKind('MP'), 'week');
  assert.equal(periodKind('XYZ-LAB'), 'week', 'unknown labs still use weeks');
  assert.equal(periodsFor('OS').length, 5);
  assert.equal(periodsFor('OS')[1].title, 'Process management');
  assert.equal(periodsFor('AAN-LAB').length, 10);
  assert.equal(periodsFor('IDS-LAB').length, 9);
  assert.equal(periodsFor('MP').length, 10);
  assert.equal(periodLabel('AAN-LAB', 3), 'Week 3');
  assert.equal(periodLabel('OS', 3), 'Unit 3');
  assert.equal(periodLabel('OS', null), 'Other');
  assert.equal(syllabusFor('AAN-LAB').credits, 1.5);
  assert.equal(parsePeriod('other'), null);
  assert.equal(parsePeriod('4'), 4);
  assert.throws(() => parsePeriod('21'), /1 to 20/);
});

test('courses tell the forms whether to offer units or weeks', async () => {
  const res = await request('GET', '/courses', { token: tokens.facultyA });
  const lab = res.body.courses.find((c) => c.code === 'AAN-LAB');
  assert.equal(lab.periodType, 'week');
  assert.equal(lab.periods.length, 10);
  const detail = await request('GET', `/courses/${labId}`, { token: tokens.studentIn });
  assert.equal(detail.body.course.syllabus.kind, 'lab');
});

const due = new Date(Date.now() + 7 * 864e5).toISOString();

test('assignments can be published for a week, or under "Other"', async () => {
  const week = await request('POST', '/assignments', {
    token: tokens.facultyA,
    body: { title: 'Week 4 CNN program', courseId: labId, unitNumber: 4, dueDate: due },
  });
  assert.equal(week.status, 201);
  assert.equal(week.body.assignment.unitNumber, 4);

  const other = await request('POST', '/assignments', {
    token: tokens.facultyA,
    body: { title: 'Case study', courseId: 'CS202', unitNumber: 'other', dueDate: due },
  });
  assert.equal(other.status, 201);
  assert.equal(other.body.assignment.unitNumber, null);
  assert.equal(other.body.assignment.unitTitle, 'Other');

  const noCourse = await request('POST', '/assignments', { token: tokens.facultyA, body: { title: 'x', dueDate: due } });
  assert.equal(noCourse.status, 400);
});

test('PowerPoint files upload as download-only; materials can be filed under "Other"', async () => {
  const res = await upload({ title: 'Week 3 slides', courseId: labId, unitNumber: '3' }, pptx);
  assert.equal(res.status, 201);
  assert.equal(res.body.material.fileType, 'PPTX');
  const row = db.tables.materials.find((m) => m.title === 'Week 3 slides');
  assert.equal(row.unit, '3');
  assert.equal(row.file_type, 'PPTX');
  assert.equal(row.index_status, 'no_text', 'not sent to the Assistant');

  const other = await upload({ title: 'Question bank', courseId: 'CS202', unitNumber: 'other' });
  assert.equal(other.status, 201);
  assert.equal(other.body.material.unitNumber, null);
  assert.equal(db.tables.materials.find((m) => m.title === 'Question bank').unit, 'other');
});

test('PDF text: number tables and repeated page headers are dropped', async () => {
  const { dropBoilerplate } = await import('../server/rag/text.js');
  const header = 'ARTIFICIAL INTELLIGENCE & DATA SCIENCE';
  const pages = dropBoilerplate([
    `${header}\nUNIT - I\nIntroduction: what an OS does.\nPO1 PO2 PO3 PO4 PSO1\nCO1 3 2 - 1 2`,
    `${header}\nUNIT - II\nProcess management and scheduling.`,
  ]);
  assert.ok(!pages[0].includes(header) && !pages[1].includes(header));
  assert.ok(!pages[0].includes('CO1 3 2'));
  assert.ok(!pages[0].includes('PO1 PO2'));
  assert.ok(pages[0].includes('Introduction: what an OS does.'));
});

test('syllabus questions are answered from the official syllabus', async () => {
  const { _internal } = await import('../server/services/syllabusAnswer.js');
  const { matchCourse, answerFor } = _internal;
  const courses = [
    { id: '1', code: 'OS', name: 'Operating Systems' },
    { id: '2', code: 'AAN', name: 'Advanced Artificial Neural Networks' },
    { id: '3', code: 'AAN-LAB', name: 'Advanced Artificial Neural Networks Lab' },
    { id: '4', code: 'CN', name: 'Computer Networks' },
  ];
  const ask = (q) => {
    const m = matchCourse(q, courses);
    return m ? answerFor(q, m) : null;
  };
  assert.match(ask('what topics are in unit 4 of operating systems'), /Unit 4: Concurrency and Synchronization/);
  assert.match(ask('what is the week 4 program in the neural networks lab'), /Week 4: Construct CNN/);
  assert.match(ask('unit 2 of neural networks'), /AAN – .*Unit 2: Deep Neural Networks Fundamentals/);
  assert.match(ask('textbooks for computer networks'), /Tanenbaum/);
  assert.match(ask('what are the units in OS'), /Unit 5: File Systems/);
  assert.equal(ask('explain deadlock avoidance'), null, 'normal questions go to the PDF search');
});

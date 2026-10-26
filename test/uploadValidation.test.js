import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db, ids, tokens, resetDb, startServer, stopServer, request, pdfForm } from './helpers/fakeSupabase.js';
import { isAllowedPdf, hasPdfSignature, MAX_MATERIAL_BYTES } from '../server/lib/pdfUpload.js';

before(startServer);
after(stopServer);
beforeEach(resetDb);

test('isAllowedPdf needs BOTH the PDF MIME type and a .pdf extension', () => {
  assert.equal(isAllowedPdf({ mimetype: 'application/pdf', originalname: 'notes.pdf' }), true);
  assert.equal(isAllowedPdf({ mimetype: 'application/pdf', originalname: 'NOTES.PDF' }), true);
  assert.equal(isAllowedPdf({ mimetype: 'application/pdf', originalname: 'notes.txt' }), false);
  assert.equal(isAllowedPdf({ mimetype: 'text/plain', originalname: 'notes.pdf' }), false);
  assert.equal(isAllowedPdf({ mimetype: 'application/octet-stream', originalname: 'notes.pdf' }), false);
  assert.equal(isAllowedPdf(undefined), false);
});

test('hasPdfSignature checks the file bytes', () => {
  assert.equal(hasPdfSignature(Buffer.from('%PDF-1.7 ...')), true);
  assert.equal(hasPdfSignature(Buffer.from('MZ\x90\x00 not a pdf')), false);
  assert.equal(hasPdfSignature('%PDF-'), false, 'must be a Buffer');
});

const upload = (token, fields, file) => request('POST', '/materials', { token, form: pdfForm(fields, file) });

test('rejects files that fail the type, extension or content checks', async () => {
  const fields = { title: 'x', courseId: 'CS202' };
  const cases = [
    { name: 'notes.txt', type: 'text/plain', content: 'hello' },
    { name: 'notes.txt', type: 'application/pdf', content: '%PDF-1.4' },
    { name: 'notes.pdf', type: 'application/pdf', content: 'not really a pdf' },
    { name: 'slides.pptx', type: 'application/octet-stream', content: 'not really slides' },
    { name: 'notes.docx', type: 'application/octet-stream', content: '%PDF-1.4 a pdf renamed to docx' },
    { name: 'tool.exe', type: 'application/octet-stream', content: 'MZ' },
  ];
  for (const file of cases) {
    const res = await upload(tokens.facultyA, fields, file);
    assert.equal(res.status, 400, `${file.name} as ${file.type}`);
  }
  assert.equal(db.uploads.length, 0, 'nothing reached storage');
});

test('rejects material files over 20 MB with 413', async () => {
  const big = '%PDF-' + 'x'.repeat(MAX_MATERIAL_BYTES);
  const res = await upload(tokens.facultyA, { title: 'x', courseId: 'CS202' }, { name: 'big.pdf', type: 'application/pdf', content: big });
  assert.equal(res.status, 413);
  assert.equal(db.uploads.length, 0);
});

test('requires a file, a title and a valid unit number', async () => {
  assert.equal((await upload(tokens.facultyA, { title: 'x', courseId: 'CS202' }, null)).status, 400);
  assert.equal((await upload(tokens.facultyA, { courseId: 'CS202' })).status, 400);
  assert.equal((await upload(tokens.facultyA, { title: 'x', courseId: 'CS202', unitNumber: 'abc' })).status, 400);
  assert.equal(db.uploads.length, 0);
});

test('checks the course BEFORE uploading, so nothing is orphaned in storage', async () => {
  assert.equal((await upload(tokens.facultyA, { title: 'x', courseId: 'NOPE99' })).status, 404);
  assert.equal((await upload(tokens.facultyA, { title: 'x', courseId: 'CS301' })).status, 403, 'not her course');
  assert.equal((await upload(tokens.studentIn, { title: 'x', courseId: 'CS202' })).status, 403, 'students cannot upload');
  assert.equal(db.uploads.length, 0);
});

test('a valid upload goes to a course-based path and records the real uploader', async () => {
  const res = await upload(tokens.facultyA, {
    title: 'Transactions',
    courseId: 'CS202',
    unitNumber: '4',
    uploadedBy: 'Someone Else', // must be ignored
  });
  assert.equal(res.status, 201);
  assert.equal(db.uploads.length, 1);
  assert.match(db.uploads[0], new RegExp(`^courses/${ids.cs202}/\\d+_notes\\.pdf$`));

  const row = db.tables.materials.find((m) => m.title === 'Transactions');
  assert.equal(row.uploaded_by, ids.facultyA);
  assert.equal(row.storage_path, db.uploads[0]);
  assert.equal(row.unit, '4');
  assert.ok(!('file_url' in row), 'stores a path, not a URL');
});

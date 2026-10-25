import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db, ids, tokens, resetDb, startServer, stopServer, request, makePdf, fakeEmbed, pdfForm } from './helpers/fakeSupabase.js';
import { setEmbedderForTests } from '../server/rag/embeddings.js';
import { chunkPages, splitSentences, extractPdfPages } from '../server/rag/text.js';
import { indexMaterial, idle } from '../server/rag/indexer.js';

setEmbedderForTests(async (texts) => fakeEmbed(texts));

before(startServer);
after(stopServer);
beforeEach(resetDb);

const BCNF = 'Boyce-Codd normal form BCNF is stricter than third normal form. A relation is in BCNF when every functional dependency has a superkey on the left side.';
const TCP = 'The TCP three-way handshake uses SYN, SYN-ACK and ACK packets to open a reliable connection.';

test('sentences and passages: whole sentences, one page each, page numbers kept', () => {
  assert.deepEqual(splitSentences('1. Find keys. 2. Check FDs. Dr. Rao explained BCNF.'), [
    '1. Find keys.', '2. Check FDs.', 'Dr. Rao explained BCNF.',
  ]);
  const chunks = chunkPages([BCNF, '7', TCP]);
  assert.deepEqual(chunks.map((c) => c.page), [1, 3], 'a page with only a number is skipped');
  assert.ok(chunks.every((c, i) => c.chunk_index === i));
  const long = chunkPages([Array.from({ length: 40 }, (_, i) => `Sentence number ${i} about normalization.`).join(' ')]);
  assert.ok(long.length > 1 && long.every((c) => c.content.length <= 900), 'long pages split into ~800-char passages');
});

test('reads the text of each page of a real PDF; blank pages come back empty', async () => {
  const { totalPages, pages } = await extractPdfPages(makePdf([BCNF, '', TCP]));
  assert.equal(totalPages, 3);
  assert.match(pages[0], /Boyce-Codd/);
  assert.equal(pages[1], '');
  assert.match(pages[2], /three-way handshake/);
});

test('indexing a PDF stores passages for its course and marks it searchable', async () => {
  const status = await indexMaterial(ids.material, makePdf([BCNF, TCP]));
  assert.equal(status, 'indexed');
  const chunks = db.tables.material_chunks.filter((c) => c.material_id === ids.material);
  assert.equal(chunks.length, 2);
  assert.ok(chunks.every((c) => c.course_id === ids.cs202 && c.embedding.length === 384));
  const m = db.tables.materials.find((x) => x.id === ids.material);
  assert.equal(m.index_status, 'indexed');
  assert.equal(m.page_count, 2);
  assert.equal(m.chunk_count, 2);

  // Re-indexing replaces passages instead of duplicating them.
  await indexMaterial(ids.material, makePdf([BCNF, TCP]));
  assert.equal(db.tables.material_chunks.filter((c) => c.material_id === ids.material).length, 2);
});

test('a PDF with no text (scanned) is marked no_text, not failed', async () => {
  assert.equal(await indexMaterial(ids.material, makePdf(['', ''])), 'no_text');
  assert.equal(db.tables.materials.find((x) => x.id === ids.material).index_status, 'no_text');
});

test('an enrolled student gets the answer sentence quoted with its source page', async () => {
  await indexMaterial(ids.material, makePdf([TCP, BCNF]));
  const res = await request('POST', '/ai-search', {
    token: tokens.studentIn,
    body: { query: 'When is a relation in BCNF? functional dependency superkey' },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.method, 'rag-extractive');
  assert.equal(res.body.found, true);
  assert.match(res.body.answer, /superkey/);
  const cited = res.body.sources[res.body.answerSentences[0].source - 1];
  assert.equal(cited.courseCode, 'CS202');
  assert.equal(cited.page, 2);
});

test('a student NOT enrolled in the course never receives its passages', async () => {
  await indexMaterial(ids.material, makePdf([BCNF])); // CS202 only
  const res = await request('POST', '/ai-search', {
    token: tokens.studentOut, // enrolled in CS301 only
    body: { query: 'When is a relation in BCNF? functional dependency superkey' },
  });
  assert.equal(res.status, 200);
  assert.notEqual(res.body.method, 'rag-extractive', 'nothing indexed in their courses -> keyword fallback');
  // (The response echoes the question, so check the answer and sources only.)
  assert.ok(!JSON.stringify({ a: res.body.answer, s: res.body.sources }).includes('superkey'), 'no CS202 text in the response');
  assert.ok(res.body.sources.every((s) => s.courseCode !== 'CS202'));
});

test('faculty only search the courses they teach; admin searches all', async () => {
  await indexMaterial(ids.material, makePdf([BCNF]));
  const q = { query: 'When is a relation in BCNF? functional dependency superkey' };
  const other = await request('POST', '/ai-search', { token: tokens.facultyB, body: q });
  assert.ok(!JSON.stringify({ a: other.body.answer, s: other.body.sources }).includes('superkey'));
  const admin = await request('POST', '/ai-search', { token: tokens.admin, body: q });
  assert.equal(admin.body.method, 'rag-extractive');
  assert.match(admin.body.answer, /superkey/);
});

test('an unrelated question says no clear answer instead of guessing', async () => {
  await indexMaterial(ids.material, makePdf([BCNF]));
  const res = await request('POST', '/ai-search', {
    token: tokens.studentIn,
    body: { query: 'photosynthesis chlorophyll sunlight plants' },
  });
  assert.equal(res.body.method, 'rag-extractive');
  assert.equal(res.body.found, false);
  assert.match(res.body.answer, /couldn't find a clear answer/);
});

test('uploading a PDF queues it for indexing automatically', async () => {
  const form = pdfForm({ title: 'Handshake notes', courseId: 'CS202' }, {
    name: 'tcp.pdf', type: 'application/pdf', content: makePdf([TCP]).toString('latin1'),
  });
  const res = await request('POST', '/materials', { token: tokens.facultyA, form });
  assert.equal(res.status, 201);
  await idle();
  const row = db.tables.materials.find((m) => m.title === 'Handshake notes');
  assert.equal(row.index_status, 'indexed');
  assert.ok(db.tables.material_chunks.some((c) => c.material_id === row.id && /handshake/.test(c.content)));
});

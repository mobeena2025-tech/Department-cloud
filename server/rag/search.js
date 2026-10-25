// Free RAG answer: find the passages closest in meaning to the question
// (pgvector), mix in keyword matches, then pick the sentences from those
// passages that best answer it. Everything stays inside the courses the user
// can access. Nothing is generated: the answer is quoted from the notes.
import supabase from '../supabase.js';
import { HttpError } from '../lib/validate.js';
import { visibleCourseIds } from '../lib/access.js';
import { embedQuery, embedPassages, cosine } from './embeddings.js';
import { splitSentences } from './text.js';
import { tokenize } from '../services/assistant.js';

// Tuned for bge-small: unrelated text scores about 0.3-0.5, a real match 0.6+.
const PASSAGE_MIN = 0.5;
const SENTENCE_MIN = 0.55;
const SENTENCE_SPREAD = 0.06; // also keep sentences this close to the best one
const MAX_SOURCES = 5;
const MAX_ANSWER_SENTENCES = 3;

function keywordHits(terms, text) {
  const t = text.toLowerCase();
  return terms.reduce((n, term) => n + (term.length > 2 && t.includes(term) ? 1 : 0), 0);
}

/**
 * Returns null when no course material has been indexed for this user
 * (the caller then falls back to the keyword assistant).
 */
export async function ragAnswer(user, question) {
  const visible = await visibleCourseIds(user);
  if (visible !== null && visible.length === 0) return null;

  const qVec = await embedQuery(question);
  const { data: matches, error } = await supabase.rpc('match_material_chunks', {
    query_embedding: qVec,
    course_ids: visible, // null for admin = all courses
    match_count: 24,
  });
  if (error) {
    console.error('[RAG] search failed:', error.message);
    return null; // e.g. migration 006 not run yet
  }
  if (!matches.length) return null;

  // Hybrid score: meaning first, small bonus for the question's exact words
  // (course terms like "BCNF" or "OSPF" that embeddings can blur).
  const terms = tokenize(question);
  const scored = matches
    .map((m) => ({ ...m, score: m.similarity + 0.02 * Math.min(keywordHits(terms, m.content), 5) }))
    .sort((a, b) => b.score - a.score);

  const top = scored.filter((m) => m.similarity >= PASSAGE_MIN).slice(0, MAX_SOURCES);
  const materialIds = [...new Set([...top, ...scored.slice(0, 3)].map((m) => m.material_id))];
  const { data: materials, error: mErr } = await supabase
    .from('materials')
    .select('id, title, unit, courses ( code, name )')
    .in('id', materialIds.length ? materialIds : ['00000000-0000-0000-0000-000000000000']);
  if (mErr) throw new HttpError(500, 'Database error');
  const byId = Object.fromEntries(materials.map((m) => [m.id, m]));

  const toSource = (m) => ({
    materialId: m.material_id,
    title: byId[m.material_id]?.title || 'Course material',
    courseCode: byId[m.material_id]?.courses?.code || '',
    course: byId[m.material_id]?.courses?.name || '',
    unit: `Unit ${Number(byId[m.material_id]?.unit) || 1}`,
    page: m.page,
    relevance: Math.round(Math.max(0, Math.min(1, m.similarity)) * 100),
    excerpt: m.content.length > 420 ? m.content.slice(0, 420) + '…' : m.content,
  });

  // Nothing close enough: say so honestly and show the nearest passages.
  if (!top.length) {
    return {
      found: false,
      answer: null,
      answerSentences: [],
      sources: scored.slice(0, 3).map(toSource),
    };
  }

  // Rank individual sentences from the best passages.
  const candidates = [];
  top.forEach((m, sourceIndex) => {
    splitSentences(m.content).forEach((text, position) => {
      // Skip headings and title-like fragments: short and without an ending
      // punctuation mark ("Unit 4: Transactions", "Lecture notes - week 2").
      const looksLikeTitle = text.length < 60 && !/[.!?:;]$/.test(text);
      if (text.length >= 20 && !looksLikeTitle) candidates.push({ text, sourceIndex, position });
    });
  });
  const sVecs = await embedPassages(candidates.map((c) => c.text));
  candidates.forEach((c, i) => {
    c.score = cosine(qVec, sVecs[i]) + 0.015 * Math.min(keywordHits(terms, c.text), 4);
  });
  const ranked = [...candidates].sort((a, b) => b.score - a.score);
  const best = ranked[0]?.score ?? 0;

  // Keep the best sentence plus close runners-up (no duplicates from the
  // overlapping passages), then show them in reading order.
  const picked = [];
  for (const c of ranked) {
    if (picked.length >= MAX_ANSWER_SENTENCES) break;
    if (c.score < SENTENCE_MIN || c.score < best - SENTENCE_SPREAD) break;
    if (picked.some((p) => p.text === c.text)) continue;
    picked.push(c);
  }
  picked.sort((a, b) => a.sourceIndex - b.sourceIndex || a.position - b.position);

  return {
    found: picked.length > 0,
    answer: picked.length ? picked.map((p) => p.text).join(' ') : null,
    answerSentences: picked.map((p) => ({ text: p.text, source: p.sourceIndex + 1 })),
    sources: top.map(toSource),
  };
}

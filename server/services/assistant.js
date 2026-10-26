import supabase from '../supabase.js';
import { visibleCourseIds } from '../lib/access.js';
import { HttpError } from '../lib/validate.js';
import { periodLabel, materialUnitFromRow } from '../lib/syllabus.js';

// Academic Assistant (prototype): simple keyword retrieval over the titles,
// topics and descriptions of materials and assignments in the courses the
// user can access. It does not generate text and does not read PDF contents.

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'is', 'are', 'was', 'what', 'which',
  'how', 'why', 'me', 'my', 'i', 'find', 'show', 'get', 'give', 'about', 'with', 'this', 'that',
  'material', 'materials', 'notes', 'note', 'document', 'documents', 'file', 'files', 'pdf',
  'uploaded', 'subject', 'explain', 'explains', 'does', 'do', 'please', 'any', 'all', 'from',
  // Assignment words decide WHAT to list, they are not search terms.
  'assignment', 'assignments', 'deadline', 'deadlines', 'due', 'homework', 'submission',
  'upcoming', 'recent', 'pending', 'next', 'latest',
]);
export const ASSIGNMENT_WORDS = /\b(assignment|assignments|deadline|deadlines|due|homework|submission)\b/;

// Common short forms students type, mapped to words in course names.
const ALIASES = {
  dbms: ['database'],
  db: ['database'],
  ann: ['neural'],
  nn: ['neural'],
  cn: ['networks'],
  ds: ['data', 'science'],
};

export function tokenize(text) {
  const words = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
  return [...new Set(words.flatMap((w) => [w, ...(ALIASES[w] || [])]))];
}

// Score a record: title matches count most, then course/topic, then description.
export function scoreFields(terms, fields) {
  let score = 0;
  for (const t of terms) {
    if (fields.title.includes(t)) score += 3;
    if (fields.course.includes(t)) score += 2;
    if (fields.topic.includes(t)) score += 2;
    if (fields.description.includes(t)) score += 1;
  }
  return score;
}

function unitFromQuery(q) {
  const m = q.match(/\b(?:unit|week)\s*(\d{1,2})\b/);
  return m ? Number(m[1]) : null;
}

export async function searchAcademicContent(user, query) {
  const q = query.toLowerCase();
  const terms = tokenize(q).filter((t) => t !== 'unit' && t !== 'week' && !/^\d+$/.test(t));
  const unit = unitFromQuery(q);
  const wantsAssignments = ASSIGNMENT_WORDS.test(q);

  const visible = await visibleCourseIds(user);
  if (visible !== null && visible.length === 0) {
    return emptyResult(query, 'You are not enrolled in or assigned to any course yet, so there is nothing to search.');
  }

  let mQuery = supabase.from('materials').select('id, title, topic, description, unit, course_id, courses ( code, name )');
  let aQuery = supabase
    .from('assignments')
    .select('id, title, description, unit_number, due_date, max_marks, status, course_id, courses ( code, name )')
    .order('due_date');
  if (visible !== null) {
    mQuery = mQuery.in('course_id', visible);
    aQuery = aQuery.in('course_id', visible);
  }
  const [m, a] = await Promise.all([mQuery, aQuery]);
  if (m.error || a.error) {
    console.error('Assistant search error:', (m.error || a.error).message);
    throw new HttpError(500, 'Database error');
  }

  const maxScore = Math.max(1, terms.length * 8);
  const fieldsOf = (r, unitValue) => ({
    title: (r.title || '').toLowerCase(),
    course: `${r.courses?.code || ''} ${r.courses?.name || ''}`.toLowerCase(),
    topic: (r.topic || '').toLowerCase(),
    description: (r.description || '').toLowerCase(),
    unit: Number(unitValue) || null,
  });

  const sources = m.data
    .map((r) => {
      const f = fieldsOf(r, r.unit);
      let score = scoreFields(terms, f);
      if (terms.length && score === 0) return { r, score: 0 }; // at least one word must match
      if (unit !== null) score = f.unit === unit ? score + 4 : 0; // "unit 3" must match the unit
      return { r, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, 6)
    .map(({ r, score }) => ({
      materialId: r.id,
      title: r.title,
      course: r.courses?.name || '',
      courseCode: r.courses?.code || '',
      unit: periodLabel(r.courses?.code, materialUnitFromRow(r.unit)),
      relevance: Math.min(100, Math.round((score / maxScore) * 100)),
      excerpt: r.topic || r.description || 'No topic or description was added for this material.',
    }));

  const now = Date.now();
  const assignments = a.data
    .map((r) => ({ r, score: scoreFields(terms, fieldsOf(r, r.unit_number)) }))
    .filter(({ r, score }) => (wantsAssignments && (terms.length === 0 || score > 0)) || score >= 3)
    .filter(({ r }) => !wantsAssignments || r.status === 'Active')
    .sort((x, y) => (wantsAssignments ? new Date(x.r.due_date) - new Date(y.r.due_date) : y.score - x.score))
    .slice(0, 5)
    .map(({ r }) => ({
      id: r.id,
      title: r.title,
      courseCode: r.courses?.code || '',
      dueDate: r.due_date,
      overdue: new Date(r.due_date).getTime() < now,
      maxMarks: r.max_marks,
    }));

  const lines = [];
  if (sources.length) {
    lines.push(`Found ${sources.length} material${sources.length === 1 ? '' : 's'} matching your question in courses you can access:`);
    for (const s of sources) lines.push(`• ${s.courseCode} ${s.unit}: ${s.title}`);
  }
  if (assignments.length) {
    if (lines.length) lines.push('');
    lines.push(`${assignments.length} assignment${assignments.length === 1 ? '' : 's'}:`);
    for (const x of assignments) {
      lines.push(`• ${x.courseCode}: ${x.title} (due ${new Date(x.dueDate).toLocaleDateString()})`);
    }
  }
  if (!lines.length) {
    lines.push('Nothing matched. Try a course code (e.g. OS), a unit ("unit 3"), or words from a material title or topic.');
  }
  lines.push('');
  lines.push('(Searched titles and topics only: none of the PDFs in your courses can be searched yet.)');

  const codes = [...new Set([...m.data, ...a.data].map((r) => r.courses?.code).filter(Boolean))].slice(0, 2);
  const relatedQuestions = [
    ...codes.map((c) => `Find ${c} materials`),
    'Show my upcoming assignments',
  ];

  return {
    query,
    method: 'keyword-search',
    answer: lines.join('\n'),
    sources,
    assignments,
    relatedQuestions,
    timestamp: new Date().toISOString(),
  };
}

function emptyResult(query, message) {
  return {
    query,
    method: 'keyword-search',
    answer: message,
    sources: [],
    assignments: [],
    relatedQuestions: [],
    timestamp: new Date().toISOString(),
  };
}

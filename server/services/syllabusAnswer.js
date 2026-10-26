import supabase from '../supabase.js';
import { visibleCourseIds } from '../lib/access.js';
import { syllabusFor } from '../lib/syllabus.js';

// Answers syllabus questions ("unit 4 of OS", "week 3 program in the ANN lab",
// "textbooks for computer networks") exactly, from the structured Semester V
// syllabus, instead of quoting the PDF. Returns null when the question is not
// clearly about one course's syllabus, so the normal search runs instead.

const FILLER = new Set(['and', 'of', 'the', 'with', 'to', 'introduction', 'advanced', 'lab', 'project']);
const words = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean);

// Short names students use, by course code.
const NICKNAMES = {
  AAN: ['ann', 'aann', 'deep learning', 'neural networks'],
  'AAN-LAB': ['ann lab', 'aann lab', 'deep learning lab', 'neural networks lab'],
  IDS: ['ids', 'data science'],
  'IDS-LAB': ['ids lab', 'data science lab', 'r lab'],
  OS: ['os', 'operating system'],
  SE: ['se', 'software engineering'],
  CN: ['cn', 'computer networks', 'networking'],
  APA: ['apa', 'predictive analytics'],
  BI: ['bi', 'business intelligence'],
  NLT: ['nlp', 'nlt', 'transformers'],
  MP: ['mini project', 'mp'],
};

function matchCourse(query, courses) {
  const q = ` ${words(query).join(' ')} `;
  const wantsLab = /\blab\b/.test(q);
  let best = null;
  for (const c of courses) {
    const s = syllabusFor(c.code);
    if (!s) continue;
    let score = 0;
    if (q.includes(` ${c.code.toLowerCase().replace('-', ' ')} `)) score += 5;
    for (const nick of NICKNAMES[c.code] || []) if (q.includes(` ${nick} `)) score += 3 + nick.split(' ').length;
    const nameWords = words(c.name).filter((w) => !FILLER.has(w));
    score += nameWords.filter((w) => q.includes(` ${w} `)).length * 2;
    if (!score) continue;
    // "lab" decides between a theory course and its lab.
    if (s.kind === 'lab') score += wantsLab ? 4 : -4;
    if (!best || score > best.score) best = { course: c, syllabus: s, score };
  }
  return best && best.score >= 3 ? best : null;
}

const list = (items) => items.map((t, i) => `${i + 1}. ${t}`).join('\n');

function answerFor(query, { course, syllabus }) {
  const q = query.toLowerCase();
  const name = `${course.code} – ${course.name}`;
  const period = q.match(/\b(unit|week|program|experiment)\s*(\d{1,2})\b/);
  const periods = syllabus.units || syllabus.weeks || [];

  if (period) {
    const p = periods.find((x) => x.number === Number(period[2]));
    const word = syllabus.units ? 'Unit' : 'Week';
    if (!p) return `${name} has ${periods.length} ${word.toLowerCase()}s in the syllabus; there is no ${word} ${period[2]}.`;
    if (syllabus.units) return `${name}, Unit ${p.number}: ${p.title}\n\nTopics: ${p.topics}`;
    if (p.title) return `${name}, Week ${p.number}: ${p.title}`;
    return `${name}, Week ${p.number}. The mini project plan: ${syllabus.schedule.map((s) => `${s.weeks === 'after' ? 'final weeks' : `week ${s.weeks}`}: ${s.title}`).join('; ')}.`;
  }
  if (/\b(text ?books?|books?|references?|reading)\b/.test(q) && syllabus.textbooks?.length) {
    return `Textbooks for ${name}:\n${list(syllabus.textbooks)}`;
  }
  if (/\b(outcomes?|cos?|objectives?|learn)\b/.test(q) && syllabus.outcomes?.length) {
    return `After ${name}, students will be able to:\n${list(syllabus.outcomes)}`;
  }
  if (/\b(syllabus|units?|weeks?|topics|contents?|programs?|experiments?|schedule|cover|covered)\b/.test(q)) {
    if (syllabus.units) return `${name} syllabus (${syllabus.officialCode}):\n${syllabus.units.map((u) => `Unit ${u.number}: ${u.title}`).join('\n')}`;
    if (syllabus.kind === 'lab') return `${name} weekly programs (${syllabus.officialCode}):\n${syllabus.weeks.map((w) => `Week ${w.number}: ${w.title}`).join('\n')}`;
    return `${name} (${syllabus.officialCode}): ${syllabus.description}\n\n${syllabus.schedule.map((s) => `${s.weeks === 'after' ? 'Final weeks' : `Week ${s.weeks}`}: ${s.title}`).join('\n')}`;
  }
  return null;
}

export async function syllabusAnswer(user, query) {
  const visible = await visibleCourseIds(user);
  if (visible !== null && visible.length === 0) return null;
  let q = supabase.from('courses').select('id, code, name');
  if (visible !== null) q = q.in('id', visible);
  const { data: courses, error } = await q;
  if (error || !courses?.length) return null;

  const match = matchCourse(query, courses);
  if (!match) return null;
  const answer = answerFor(query, match);
  if (!answer) return null;

  // Point to the course's syllabus PDF, if one was uploaded.
  const { data: doc } = await supabase
    .from('materials')
    .select('id, title')
    .eq('course_id', match.course.id)
    .like('title', 'Syllabus%')
    .limit(1)
    .maybeSingle();
  const sources = doc
    ? [{ materialId: doc.id, title: doc.title, courseCode: match.course.code, course: match.course.name, unit: 'Other', relevance: 100, excerpt: 'Official AI & DS Semester V syllabus (AY 2024-25).' }]
    : [];
  return { answer, sources, courseCode: match.course.code };
}

// For tests.
export const _internal = { matchCourse, answerFor };

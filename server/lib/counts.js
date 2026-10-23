import supabase from '../supabase.js';
import { HttpError } from './validate.js';

function fail(context, error) {
  console.error(`${context}:`, error.message);
  return new HttpError(500, 'Database error');
}

/** Map course_id -> number of enrolled students. */
export async function enrollmentCounts(courseIds) {
  const map = new Map();
  if (!courseIds.length) return map;
  const { data, error } = await supabase.from('enrollments').select('course_id').in('course_id', courseIds);
  if (error) throw fail('Enrollment count error', error);
  for (const r of data) map.set(r.course_id, (map.get(r.course_id) || 0) + 1);
  return map;
}

/** Map assignment_id -> number of submissions. */
export async function submissionCounts(assignmentIds) {
  const map = new Map();
  if (!assignmentIds.length) return map;
  const { data, error } = await supabase.from('submissions').select('assignment_id').in('assignment_id', assignmentIds);
  if (error) throw fail('Submission count error', error);
  for (const r of data) map.set(r.assignment_id, (map.get(r.assignment_id) || 0) + 1);
  return map;
}

/** Map an array of assignment rows to responses with real counts. */
export async function withAssignmentCounts(rows, toResponse) {
  const [enrolled, submitted] = await Promise.all([
    enrollmentCounts([...new Set(rows.map((a) => a.course_id))]),
    submissionCounts(rows.map((a) => a.id)),
  ]);
  return rows.map((a) =>
    toResponse(a, { enrolled: enrolled.get(a.course_id) || 0, submitted: submitted.get(a.id) || 0 })
  );
}

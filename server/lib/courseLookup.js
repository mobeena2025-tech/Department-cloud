import supabase from '../supabase.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COURSE_CODE_RE = /^[A-Za-z0-9_-]{1,20}$/;

export function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

/**
 * Find a course by UUID or by course code without building filter strings
 * from user input. Returns { course, error } where error is set only for
 * database failures; an unknown or malformed id gives { course: null }.
 */
export async function findCourse(idOrCode, columns = '*') {
  if (typeof idOrCode !== 'string') return { course: null };
  const value = idOrCode.trim();

  let query = supabase.from('courses').select(columns);
  if (isUuid(value)) {
    query = query.eq('id', value);
  } else if (COURSE_CODE_RE.test(value)) {
    query = query.eq('code', value);
  } else {
    return { course: null };
  }

  const { data, error } = await query.maybeSingle();
  if (error) return { course: null, error };
  return { course: data };
}

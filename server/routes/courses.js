import express from 'express';
import supabase from '../supabase.js';
import { findCourse } from '../lib/courseLookup.js';
import {
  HttpError,
  asyncHandler,
  optionalInt,
  requiredInt,
  optionalString,
  requiredString,
  COURSE_CODE_PATTERN,
  SECTION_PATTERN,
} from '../lib/validate.js';
import {
  MATERIAL_SELECT,
  ASSIGNMENT_SELECT,
  toCourseResponse,
  toMaterialResponse,
  toAssignmentResponse,
} from '../lib/mappers.js';

const router = express.Router();

function dbError(context, error) {
  console.error(`${context}:`, error.message);
  return new HttpError(500, 'Database error');
}

// Group already-mapped rows by course id.
function groupByCourse(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.courseId)) map.set(r.courseId, []);
    map.get(r.courseId).push(r);
  }
  return map;
}

// List courses (with counts)
router.get('/', asyncHandler(async (req, res) => {
  const semester = optionalInt(req.query.semester, 'semester', { min: 1, max: 8 });
  const section = optionalString(req.query.section, 'section', { max: 2, pattern: SECTION_PATTERN });

  let query = supabase.from('courses').select('*').order('code');
  if (semester !== undefined) query = query.eq('semester', semester);
  if (section !== undefined) query = query.eq('section', section.toUpperCase());

  const { data: courses, error } = await query;
  if (error) throw dbError('Courses list error', error);

  const ids = courses.map((c) => c.id);
  let materials = [];
  let assignments = [];
  if (ids.length) {
    const [m, a] = await Promise.all([
      supabase.from('materials').select('id, course_id, unit').in('course_id', ids),
      supabase.from('assignments').select('id, course_id, unit_number, status').in('course_id', ids),
    ]);
    if (m.error) throw dbError('Course materials count error', m.error);
    if (a.error) throw dbError('Course assignments count error', a.error);
    materials = m.data.map((r) => ({ courseId: r.course_id, unitNumber: Number(r.unit) || 1 }));
    assignments = a.data.map((r) => ({ courseId: r.course_id, unitNumber: r.unit_number, status: r.status }));
  }

  const mByCourse = groupByCourse(materials);
  const aByCourse = groupByCourse(assignments);

  res.json({
    success: true,
    courses: courses.map((c) =>
      toCourseResponse(c, {
        materials: mByCourse.get(c.id) || [],
        assignments: aByCourse.get(c.id) || [],
      })
    ),
  });
}));

// Single course by UUID or code, with its materials and assignments
router.get('/:id', asyncHandler(async (req, res) => {
  const { course, error } = await findCourse(req.params.id);
  if (error) throw dbError('Course lookup error', error);
  if (!course) throw new HttpError(404, 'Course not found');

  const [m, a] = await Promise.all([
    supabase.from('materials').select(MATERIAL_SELECT).eq('course_id', course.id).order('created_at', { ascending: false }),
    supabase.from('assignments').select(ASSIGNMENT_SELECT).eq('course_id', course.id).order('due_date'),
  ]);
  if (m.error) throw dbError('Course materials error', m.error);
  if (a.error) throw dbError('Course assignments error', a.error);

  res.json({
    success: true,
    course: toCourseResponse(course, {
      materials: m.data.map(toMaterialResponse),
      assignments: a.data.map(toAssignmentResponse),
      nested: true,
    }),
  });
}));

// Create a course (Admin)
router.post('/', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const code = requiredString(body.code, 'code', { max: 20, pattern: COURSE_CODE_PATTERN }).toUpperCase();
  const name = requiredString(body.title ?? body.name, 'title', { max: 150 });
  const semester = requiredInt(body.semester, 'semester', { min: 1, max: 8 });
  const section = (optionalString(body.section, 'section', { max: 2, pattern: SECTION_PATTERN }) || 'A').toUpperCase();
  const credits = optionalInt(body.credits, 'credits', { min: 1, max: 10 }) ?? 3;
  const description = optionalString(body.description, 'description', { max: 2000 }) ?? null;
  const department = optionalString(body.department, 'department', { max: 100 }) ?? null;

  const { data, error } = await supabase
    .from('courses')
    .insert({ code, name, semester, section, credits, description, department })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new HttpError(409, `A course with code ${code} already exists`);
    throw dbError('Course insert error', error);
  }

  res.status(201).json({ success: true, course: toCourseResponse(data) });
}));

export default router;

import express from 'express';
import supabase from '../supabase.js';
import { findCourse } from '../lib/courseLookup.js';
import { requireRole } from '../lib/auth.js';
import { visibleCourseIds, assertCanViewCourse } from '../lib/access.js';
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

// Group rows by course id.
function groupByCourse(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.courseId)) map.set(r.courseId, []);
    map.get(r.courseId).push(r);
  }
  return map;
}

// Faculty names and enrollment counts for a set of courses.
async function loadStaffAndEnrollment(courseIds) {
  if (!courseIds.length) return { faculty: new Map(), enrolled: new Map() };
  const [f, e] = await Promise.all([
    supabase.from('course_faculty').select('course_id, profiles ( full_name )').in('course_id', courseIds),
    supabase.from('enrollments').select('course_id').in('course_id', courseIds),
  ]);
  if (f.error) throw dbError('Course faculty lookup error', f.error);
  if (e.error) throw dbError('Enrollment count error', e.error);

  const faculty = new Map();
  for (const r of f.data) {
    if (!faculty.has(r.course_id)) faculty.set(r.course_id, []);
    if (r.profiles?.full_name) faculty.get(r.course_id).push(r.profiles.full_name);
  }
  const enrolled = new Map();
  for (const r of e.data) enrolled.set(r.course_id, (enrolled.get(r.course_id) || 0) + 1);
  return { faculty, enrolled };
}

// List the courses this user can see (with counts)
router.get('/', asyncHandler(async (req, res) => {
  const semester = optionalInt(req.query.semester, 'semester', { min: 1, max: 8 });
  const section = optionalString(req.query.section, 'section', { max: 2, pattern: SECTION_PATTERN });

  const visible = await visibleCourseIds(req.user);
  if (visible !== null && visible.length === 0) return res.json({ success: true, courses: [] });

  let query = supabase.from('courses').select('*').order('code');
  if (visible !== null) query = query.in('id', visible);
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
  const { faculty, enrolled } = await loadStaffAndEnrollment(ids);

  const mByCourse = groupByCourse(materials);
  const aByCourse = groupByCourse(assignments);

  res.json({
    success: true,
    courses: courses.map((c) =>
      toCourseResponse(c, {
        materials: mByCourse.get(c.id) || [],
        assignments: aByCourse.get(c.id) || [],
        facultyNames: faculty.get(c.id) || [],
        enrolledCount: enrolled.get(c.id) || 0,
      })
    ),
  });
}));

// Single course by UUID or code, with its materials and assignments
router.get('/:id', asyncHandler(async (req, res) => {
  const { course, error } = await findCourse(req.params.id);
  if (error) throw dbError('Course lookup error', error);
  if (!course) throw new HttpError(404, 'Course not found');
  await assertCanViewCourse(req.user, course.id);

  const [m, a] = await Promise.all([
    supabase.from('materials').select(MATERIAL_SELECT).eq('course_id', course.id).order('created_at', { ascending: false }),
    supabase.from('assignments').select(ASSIGNMENT_SELECT).eq('course_id', course.id).order('due_date'),
  ]);
  if (m.error) throw dbError('Course materials error', m.error);
  if (a.error) throw dbError('Course assignments error', a.error);
  const { faculty, enrolled } = await loadStaffAndEnrollment([course.id]);

  res.json({
    success: true,
    course: toCourseResponse(course, {
      materials: m.data.map(toMaterialResponse),
      assignments: a.data.map(toAssignmentResponse),
      facultyNames: faculty.get(course.id) || [],
      enrolledCount: enrolled.get(course.id) || 0,
      nested: true,
    }),
  });
}));

// Create a course (admin only)
router.post('/', requireRole('admin'), asyncHandler(async (req, res) => {
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

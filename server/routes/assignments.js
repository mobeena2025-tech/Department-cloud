import express from 'express';
import { parsePeriod } from '../lib/syllabus.js';
import supabase from '../supabase.js';
import { findCourse, isUuid } from '../lib/courseLookup.js';
import { requireRole } from '../lib/auth.js';
import { recordAuditLog } from '../lib/audit.js';
import { withAssignmentCounts } from '../lib/counts.js';
import { visibleCourseIds, assertCanViewCourse, assertCanManageCourse } from '../lib/access.js';
import {
  HttpError,
  asyncHandler,
  optionalInt,
  optionalString,
  requiredString,
  optionalDate,
} from '../lib/validate.js';
import { ASSIGNMENT_SELECT, toAssignmentResponse } from '../lib/mappers.js';

const router = express.Router();

const STATUSES = ['Active', 'Closed', 'Draft'];

function dbError(context, error) {
  console.error(`${context}:`, error.message);
  return new HttpError(500, 'Database error');
}

// List assignments, optionally by course (UUID or code) and status
router.get('/', asyncHandler(async (req, res) => {
  const courseIdParam = optionalString(req.query.courseId, 'courseId', { max: 40 });
  const status = optionalString(req.query.status, 'status', { max: 20 });
  if (status !== undefined && !STATUSES.includes(status)) {
    throw new HttpError(400, `status must be one of ${STATUSES.join(', ')}`);
  }

  const visible = await visibleCourseIds(req.user);
  if (visible !== null && visible.length === 0) return res.json({ success: true, assignments: [] });

  let query = supabase
    .from('assignments')
    .select(ASSIGNMENT_SELECT)
    .order('created_at', { ascending: false });
  if (visible !== null) query = query.in('course_id', visible);

  if (courseIdParam !== undefined) {
    const { course, error } = await findCourse(courseIdParam, 'id');
    if (error) throw dbError('Course lookup error', error);
    if (!course) return res.json({ success: true, assignments: [] });
    query = query.eq('course_id', course.id);
  }
  if (status !== undefined) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw dbError('Assignments list error', error);

  res.json({ success: true, assignments: await withAssignmentCounts(data, toAssignmentResponse) });
}));

// Single assignment
router.get('/:id', asyncHandler(async (req, res) => {
  if (!isUuid(req.params.id)) throw new HttpError(400, 'Invalid assignment id');

  const { data, error } = await supabase
    .from('assignments')
    .select(ASSIGNMENT_SELECT)
    .eq('id', req.params.id)
    .maybeSingle();

  if (error) throw dbError('Assignment lookup error', error);
  if (!data) throw new HttpError(404, 'Assignment not found');
  await assertCanViewCourse(req.user, data.course_id);

  res.json({
    success: true,
    assignment: (await withAssignmentCounts([data], toAssignmentResponse))[0],
  });
}));

// Create assignment (Faculty/Admin)
router.post('/', requireRole('faculty', 'admin'), asyncHandler(async (req, res) => {
  const body = req.body || {};
  const title = requiredString(body.title, 'title', { max: 200 });
  const courseIdParam = requiredString(body.courseId, 'courseId', { max: 40 });
  const dueDate = optionalDate(body.dueDate, 'dueDate');
  if (!dueDate) throw new HttpError(400, 'dueDate is required');
  const description = optionalString(body.description, 'description', { max: 5000 }) ?? null;
  const parsedUnit = parsePeriod(body.unitNumber);
  const unitNumber = parsedUnit === undefined ? 1 : parsedUnit; // null = "Other" (e.g. a case study)
  const maxMarks = optionalInt(body.maxMarks, 'maxMarks', { min: 1, max: 1000 }) ?? 25;
  const attachmentName = optionalString(body.attachmentName, 'attachmentName', { max: 200 }) ?? null;

  const { course, error: courseError } = await findCourse(courseIdParam);
  if (courseError) throw dbError('Course lookup error', courseError);
  if (!course) throw new HttpError(404, 'Course not found');
  await assertCanManageCourse(req.user, course.id);

  // Who created it comes from the verified session, never the request body.
  const facultyId = req.user.id;
  const facultyName = req.user.name;

  const { data, error } = await supabase
    .from('assignments')
    .insert({
      course_id: course.id,
      title,
      description,
      unit_number: unitNumber,
      due_date: dueDate,
      max_marks: maxMarks,
      faculty_id: facultyId,
      faculty_name: facultyName,
      attachment_name: attachmentName,
      status: 'Active',
    })
    .select(ASSIGNMENT_SELECT)
    .single();

  if (error) throw dbError('Assignment insert error', error);

  recordAuditLog(req, {
    action: 'CREATE_ASSIGNMENT',
    courseId: course.id,
    resource: `${course.code}: ${title}`,
    status: 'SUCCESS',
    severity: 'INFO',
    details: `Published assignment due on ${new Date(dueDate).toLocaleDateString()}.`,
  });

  res.status(201).json({ success: true, assignment: (await withAssignmentCounts([data], toAssignmentResponse))[0] });
}));

export default router;

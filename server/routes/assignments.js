import express from 'express';
import { recordAuditLog } from '../data/store.js';
import supabase from '../supabase.js';
import { findCourse, isUuid } from '../lib/courseLookup.js';
import { getDemoUserId } from '../lib/demoAuth.js';
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

  let query = supabase
    .from('assignments')
    .select(ASSIGNMENT_SELECT)
    .order('created_at', { ascending: false });

  if (courseIdParam !== undefined) {
    const { course, error } = await findCourse(courseIdParam, 'id');
    if (error) throw dbError('Course lookup error', error);
    if (!course) return res.json({ success: true, assignments: [] });
    query = query.eq('course_id', course.id);
  }
  if (status !== undefined) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw dbError('Assignments list error', error);

  res.json({ success: true, assignments: data.map(toAssignmentResponse) });
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

  res.json({
    success: true,
    // Submissions move to Supabase in Phase 4.
    assignment: { ...toAssignmentResponse(data), submissions: [] },
  });
}));

// Create assignment (Faculty/Admin)
router.post('/', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const title = requiredString(body.title, 'title', { max: 200 });
  const courseIdParam = requiredString(body.courseId, 'courseId', { max: 40 });
  const dueDate = optionalDate(body.dueDate, 'dueDate');
  if (!dueDate) throw new HttpError(400, 'dueDate is required');
  const description = optionalString(body.description, 'description', { max: 5000 }) ?? null;
  const unitNumber = optionalInt(body.unitNumber, 'unitNumber', { min: 1, max: 10 }) ?? 1;
  const maxMarks = optionalInt(body.maxMarks, 'maxMarks', { min: 1, max: 1000 }) ?? 25;
  const attachmentName = optionalString(body.attachmentName, 'attachmentName', { max: 200 }) ?? null;

  const { course, error: courseError } = await findCourse(courseIdParam);
  if (courseError) throw dbError('Course lookup error', courseError);
  if (!course) throw new HttpError(404, 'Course not found');

  // Faculty identity comes from the (temporary) demo token, not the body.
  const facultyId = getDemoUserId(req);
  let facultyName = null;
  if (facultyId) {
    const { data: user } = await supabase.from('users').select('name').eq('id', facultyId).maybeSingle();
    facultyName = user?.name ?? null;
  }

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

  recordAuditLog({
    actorName: facultyName || 'Unknown user',
    actorRole: 'faculty',
    action: 'CREATE_ASSIGNMENT',
    resource: `${course.code}: ${title}`,
    status: 'SUCCESS',
    severity: 'INFO',
    details: `Published assignment due on ${new Date(dueDate).toLocaleDateString()}.`,
  });

  res.status(201).json({ success: true, assignment: toAssignmentResponse(data) });
}));

export default router;

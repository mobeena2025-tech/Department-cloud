import express from 'express';
import supabase from '../supabase.js';
import { requireRole } from '../lib/auth.js';
import { recordAuditLog } from '../lib/audit.js';
import { findCourse, isUuid } from '../lib/courseLookup.js';
import { visibleCourseIds, assertCanViewCourse, canManageCourse } from '../lib/access.js';
import {
  BUCKET,
  SIGNED_URL_SECONDS,
  uploadSinglePdf,
  hasPdfSignature,
  safeFileName,
} from '../lib/pdfUpload.js';
import { HttpError, asyncHandler, optionalString, requiredString } from '../lib/validate.js';
import { SUBMISSION_SELECT, toSubmissionResponse } from '../lib/mappers.js';

const router = express.Router();

function dbError(context, error) {
  console.error(`${context}:`, error.message);
  return new HttpError(500, 'Database error');
}

// Students may read their own submissions; faculty those in courses they
// teach; admin all.
async function assertCanReadSubmission(user, row) {
  if (user.role === 'admin') return;
  if (user.role === 'student' && row.student_id === user.id) return;
  if (user.role === 'faculty' && (await canManageCourse(user, row.assignments.course_id))) return;
  throw new HttpError(403, 'You do not have access to this submission');
}

async function loadSubmission(id) {
  if (!isUuid(id)) throw new HttpError(400, 'Invalid submission id');
  const { data, error } = await supabase.from('submissions').select(SUBMISSION_SELECT).eq('id', id).maybeSingle();
  if (error) throw dbError('Submission lookup error', error);
  if (!data) throw new HttpError(404, 'Submission not found');
  return data;
}

// List submissions the user may see, with optional filters
router.get('/', asyncHandler(async (req, res) => {
  const assignmentId = optionalString(req.query.assignmentId, 'assignmentId', { max: 40 });
  if (assignmentId !== undefined && !isUuid(assignmentId)) throw new HttpError(400, 'Invalid assignmentId');
  const courseParam = optionalString(req.query.courseId, 'courseId', { max: 40 });
  const studentId = optionalString(req.query.studentId, 'studentId', { max: 40 });
  if (studentId !== undefined && !isUuid(studentId)) throw new HttpError(400, 'Invalid studentId');

  let query = supabase.from('submissions').select(SUBMISSION_SELECT).order('submitted_at', { ascending: false });

  if (req.user.role === 'student') {
    query = query.eq('student_id', req.user.id); // students only see their own
  } else {
    if (req.user.role === 'faculty') {
      const taught = await visibleCourseIds(req.user);
      if (!taught.length) return res.json({ success: true, submissions: [] });
      query = query.in('assignments.course_id', taught);
    }
    if (studentId !== undefined) query = query.eq('student_id', studentId);
  }
  if (assignmentId !== undefined) query = query.eq('assignment_id', assignmentId);
  if (courseParam !== undefined) {
    const { course, error } = await findCourse(courseParam, 'id');
    if (error) throw dbError('Course lookup error', error);
    if (!course) return res.json({ success: true, submissions: [] });
    query = query.eq('assignments.course_id', course.id);
  }

  const { data, error } = await query;
  if (error) throw dbError('Submissions list error', error);
  res.json({ success: true, submissions: data.map(toSubmissionResponse) });
}));

// One submission, with a short-lived link to the PDF if one was uploaded
router.get('/:id', asyncHandler(async (req, res) => {
  const row = await loadSubmission(req.params.id);
  await assertCanReadSubmission(req.user, row);

  const submission = toSubmissionResponse(row);
  submission.fileUrl = null;
  if (row.storage_path) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(row.storage_path, SIGNED_URL_SECONDS);
    if (error) console.error('Signed URL error:', error.message);
    else submission.fileUrl = data.signedUrl;
  }
  res.json({ success: true, submission });
}));

// Student submits (or resubmits, until graded) an assignment
router.post('/', requireRole('student'), uploadSinglePdf, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const assignmentId = requiredString(body.assignmentId, 'assignmentId', { max: 40 });
  if (!isUuid(assignmentId)) throw new HttpError(400, 'Invalid assignmentId');
  const submissionText = optionalString(body.submissionText, 'submissionText', { max: 5000 }) ?? null;
  if (!req.file && !submissionText) throw new HttpError(400, 'Attach a PDF or write a short answer');
  if (req.file && !hasPdfSignature(req.file.buffer)) throw new HttpError(400, 'File is not a valid PDF');

  const { data: assignment, error: aError } = await supabase
    .from('assignments')
    .select('id, title, course_id, status, courses ( code )')
    .eq('id', assignmentId)
    .maybeSingle();
  if (aError) throw dbError('Assignment lookup error', aError);
  if (!assignment) throw new HttpError(404, 'Assignment not found');
  await assertCanViewCourse(req.user, assignment.course_id); // must be enrolled
  if (assignment.status !== 'Active') throw new HttpError(409, 'This assignment is no longer accepting submissions');

  const { data: existing, error: eError } = await supabase
    .from('submissions')
    .select('id, status, storage_path')
    .eq('assignment_id', assignmentId)
    .eq('student_id', req.user.id)
    .maybeSingle();
  if (eError) throw dbError('Submission lookup error', eError);
  if (existing?.status === 'Graded') throw new HttpError(409, 'This submission has already been graded');

  let storagePath = existing?.storage_path ?? null;
  let fileFields = {};
  if (req.file) {
    storagePath = `submissions/${assignmentId}/${req.user.id}/${Date.now()}_${safeFileName(req.file.originalname)}`;
    const { error: upError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, req.file.buffer, { contentType: 'application/pdf', upsert: false });
    if (upError) {
      console.error('Submission upload error:', upError.message);
      throw new HttpError(500, 'Failed to upload PDF to storage');
    }
    fileFields = { storage_path: storagePath, file_name: req.file.originalname.slice(0, 200), file_size: req.file.size };
  }

  const { data, error } = await supabase
    .from('submissions')
    .upsert(
      {
        assignment_id: assignmentId,
        student_id: req.user.id, // never from the request body
        submission_text: submissionText,
        status: 'Submitted',
        submitted_at: new Date().toISOString(),
        ...fileFields,
      },
      { onConflict: 'assignment_id,student_id' }
    )
    .select(SUBMISSION_SELECT)
    .single();

  if (error) {
    if (req.file) await supabase.storage.from(BUCKET).remove([storagePath]);
    throw dbError('Submission save error', error);
  }
  // A new file replaces the old one.
  if (req.file && existing?.storage_path && existing.storage_path !== storagePath) {
    await supabase.storage.from(BUCKET).remove([existing.storage_path]);
  }

  recordAuditLog(req, {
    action: 'SUBMIT_ASSIGNMENT',
    resource: `${assignment.courses?.code || ''}: ${assignment.title}`,
    courseId: assignment.course_id,
    details: req.file ? `Uploaded ${req.file.originalname}.` : 'Text-only submission.',
  });

  res.status(existing ? 200 : 201).json({ success: true, submission: toSubmissionResponse(data) });
}));

// Faculty (teaching the course) or admin grades a submission
router.put('/:id/grade', requireRole('faculty', 'admin'), asyncHandler(async (req, res) => {
  const row = await loadSubmission(req.params.id);
  if (!(await canManageCourse(req.user, row.assignments.course_id))) {
    throw new HttpError(403, 'Only faculty assigned to this course (or an admin) can grade it');
  }

  const max = Number(row.assignments.max_marks) || 100;
  const grade = Number(req.body?.grade);
  if (req.body?.grade === undefined || req.body?.grade === '' || !Number.isFinite(grade) || grade < 0 || grade > max) {
    throw new HttpError(400, `Grade must be a number between 0 and ${max}`);
  }
  const feedback = optionalString(req.body?.feedback, 'feedback', { max: 2000 }) ?? null;

  const { data, error } = await supabase
    .from('submissions')
    .update({
      grade,
      feedback,
      status: 'Graded',
      graded_by: req.user.id, // never from the request body
      graded_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select(SUBMISSION_SELECT)
    .single();
  if (error) throw dbError('Grade save error', error);

  recordAuditLog(req, {
    action: 'GRADE_SUBMISSION',
    resource: `${row.assignments.title} - ${row.student?.full_name || row.student_id}`,
    courseId: row.assignments.course_id,
    details: `Awarded ${grade}/${max}.`,
  });

  res.json({ success: true, submission: toSubmissionResponse(data) });
}));

export default router;

import express from 'express';
import supabase from '../supabase.js';
import { requireRole } from '../lib/auth.js';
import { recordAuditLog } from '../lib/audit.js';
import { findCourse } from '../lib/courseLookup.js';
import { visibleCourseIds, assertCanViewCourse, assertCanManageCourse } from '../lib/access.js';
import { HttpError, asyncHandler, optionalString, requiredString } from '../lib/validate.js';
import { ANNOUNCEMENT_SELECT, toAnnouncementResponse } from '../lib/mappers.js';

const router = express.Router();

const PRIORITIES = ['Normal', 'High', 'Urgent'];

function dbError(context, error) {
  console.error(`${context}:`, error.message);
  return new HttpError(500, 'Database error');
}

// Department-wide notices plus notices for the user's own courses.
router.get('/', asyncHandler(async (req, res) => {
  const courseParam = optionalString(req.query.courseId, 'courseId', { max: 40 });
  const priority = optionalString(req.query.priority, 'priority', { max: 10 });
  if (priority !== undefined && !PRIORITIES.includes(priority)) {
    throw new HttpError(400, `priority must be one of ${PRIORITIES.join(', ')}`);
  }

  let query = supabase.from('announcements').select(ANNOUNCEMENT_SELECT).order('created_at', { ascending: false }).limit(200);

  if (courseParam !== undefined) {
    const { course, error } = await findCourse(courseParam, 'id');
    if (error) throw dbError('Course lookup error', error);
    if (!course) throw new HttpError(404, 'Course not found');
    await assertCanViewCourse(req.user, course.id);
    query = query.or(`course_id.is.null,course_id.eq.${course.id}`); // course.id is a verified UUID
  } else {
    const visible = await visibleCourseIds(req.user);
    if (visible !== null) {
      // Only UUIDs read from our own tables go into this filter.
      query = visible.length
        ? query.or(`course_id.is.null,course_id.in.(${visible.join(',')})`)
        : query.is('course_id', null);
    }
  }
  if (priority !== undefined) query = query.eq('priority', priority);

  const { data, error } = await query;
  if (error) throw dbError('Announcements list error', error);
  res.json({ success: true, announcements: data.map(toAnnouncementResponse) });
}));

// Post a notice: faculty for courses they teach, admin for any course or
// department-wide (no course).
router.post('/', requireRole('faculty', 'admin'), asyncHandler(async (req, res) => {
  const body = req.body || {};
  const title = requiredString(body.title, 'title', { max: 200 });
  const content = requiredString(body.content, 'content', { max: 5000 });
  const category = optionalString(body.category, 'category', { max: 50 }) || 'Course Notice';
  const priority = optionalString(body.priority, 'priority', { max: 10 }) || 'Normal';
  if (!PRIORITIES.includes(priority)) throw new HttpError(400, `priority must be one of ${PRIORITIES.join(', ')}`);
  const courseParam = optionalString(body.courseId, 'courseId', { max: 40 });

  let course = null;
  if (courseParam) {
    const found = await findCourse(courseParam);
    if (found.error) throw dbError('Course lookup error', found.error);
    if (!found.course) throw new HttpError(404, 'Course not found');
    course = found.course;
    await assertCanManageCourse(req.user, course.id);
  } else if (req.user.role !== 'admin') {
    throw new HttpError(403, 'Only an admin can post department-wide notices');
  }

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      course_id: course?.id ?? null,
      title,
      content,
      category,
      priority,
      author_id: req.user.id,
      author_name: req.user.name,
    })
    .select(ANNOUNCEMENT_SELECT)
    .single();
  if (error) throw dbError('Announcement insert error', error);

  recordAuditLog(req, {
    action: 'POST_ANNOUNCEMENT',
    resource: title,
    courseId: course?.id ?? null,
    severity: priority === 'Urgent' ? 'WARNING' : 'INFO',
    details: `Published ${priority} notice for ${course ? course.code : 'the whole department'}.`,
  });

  res.status(201).json({ success: true, announcement: toAnnouncementResponse(data) });
}));

export default router;

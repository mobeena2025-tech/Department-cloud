import express from 'express';
import supabase from '../supabase.js';
import { requireRole } from '../lib/auth.js';
import { HttpError, asyncHandler } from '../lib/validate.js';

const router = express.Router();

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function must({ data, error }, context) {
  if (error) {
    console.error(`${context}:`, error.message);
    throw new HttpError(500, 'Database error');
  }
  return data;
}

// Department analytics (admin only). Every number is counted from the
// database; activity numbers come from the audit log.
router.get('/', requireRole('admin'), asyncHandler(async (req, res) => {
  const since30 = new Date(Date.now() - 30 * DAY_MS).toISOString();

  const [profiles, courses, materials, assignments, enrollments, submissions, logs] = await Promise.all([
    supabase.from('profiles').select('role'),
    supabase.from('courses').select('id, code, name'),
    supabase.from('materials').select('course_id, file_size'),
    supabase.from('assignments').select('id, course_id, status'),
    supabase.from('enrollments').select('course_id'),
    supabase.from('submissions').select('assignment_id, status, file_size'),
    supabase
      .from('audit_logs')
      .select('action, status, created_at, actor_id, course_id, resource')
      .gte('created_at', since30)
      .order('created_at', { ascending: false })
      .limit(20000),
  ]).then((results) =>
    results.map((r, i) => must(r, ['profiles', 'courses', 'materials', 'assignments', 'enrollments', 'submissions', 'audit logs'][i] + ' query'))
  );

  const count = (rows, fn) => rows.filter(fn).length;
  const enrolledByCourse = new Map();
  for (const e of enrollments) enrolledByCourse.set(e.course_id, (enrolledByCourse.get(e.course_id) || 0) + 1);

  // Submission rate = submissions received / submissions expected
  // (each assignment expects one per student enrolled in its course).
  const expected = assignments.reduce((sum, a) => sum + (enrolledByCourse.get(a.course_id) || 0), 0);
  const submissionRate = expected ? Math.round((submissions.length / expected) * 1000) / 10 : null;

  const storageBytes =
    materials.reduce((s, m) => s + (Number(m.file_size) || 0), 0) +
    submissions.reduce((s, m) => s + (Number(m.file_size) || 0), 0);

  const ok = (l) => l.status === 'SUCCESS';
  const opens = logs.filter((l) => l.action === 'OPEN_MATERIAL' && ok(l));

  const resourceUsageByCourse = courses
    .map((c) => ({
      courseCode: c.code,
      courseName: c.name,
      uploads: count(materials, (m) => m.course_id === c.id),
      downloads: count(opens, (l) => l.course_id === c.id),
      enrolled: enrolledByCourse.get(c.id) || 0,
    }))
    .sort((a, b) => b.downloads - a.downloads || b.uploads - a.uploads);

  // Last 7 days, oldest first (server time).
  const weeklyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(Date.now() - i * DAY_MS);
    const key = day.toDateString();
    const onDay = logs.filter((l) => new Date(l.created_at).toDateString() === key);
    weeklyActivity.push({
      day: DAY_NAMES[day.getDay()],
      date: day.toISOString().slice(0, 10),
      downloads: count(onDay, (l) => l.action === 'OPEN_MATERIAL' && ok(l)),
      uploads: count(onDay, (l) => l.action === 'UPLOAD_MATERIAL' && ok(l)),
      aiQueries: count(onDay, (l) => l.action === 'ASSISTANT_SEARCH'),
      activeLogins: new Set(onDay.filter((l) => l.action === 'LOGIN' && ok(l) && l.actor_id).map((l) => l.actor_id)).size,
    });
  }

  // Most repeated assistant searches in the last 30 days.
  const searches = logs.filter((l) => l.action === 'ASSISTANT_SEARCH' && l.resource);
  const byQuery = new Map();
  for (const l of searches) {
    const q = l.resource.trim().toLowerCase();
    byQuery.set(q, (byQuery.get(q) || 0) + 1);
  }
  const topSearchedTopics = [...byQuery.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, n]) => ({ topic, count: n }));

  res.json({
    success: true,
    analytics: {
      generatedAt: new Date().toISOString(),
      overview: {
        totalStudents: count(profiles, (p) => p.role === 'student'),
        totalFaculty: count(profiles, (p) => p.role === 'faculty'),
        totalAdmins: count(profiles, (p) => p.role === 'admin'),
        totalCourses: courses.length,
        academicResources: materials.length,
        totalAssignments: assignments.length,
        activeAssignments: count(assignments, (a) => a.status === 'Active'),
        totalEnrollments: enrollments.length,
        totalSubmissions: submissions.length,
        gradedSubmissions: count(submissions, (s) => s.status === 'Graded'),
        assignmentSubmissionRate: submissionRate, // null when nothing is expected yet
        storageUsedMb: Math.round((storageBytes / (1024 * 1024)) * 100) / 100,
        deniedAccessLast30Days: count(logs, (l) => l.status === 'DENIED'),
        failedLoginsLast30Days: count(logs, (l) => l.action === 'LOGIN' && l.status === 'FAILURE'),
      },
      resourceUsageByCourse,
      weeklyActivity,
      aiSearchTelemetry: {
        totalQueriesThisMonth: searches.length, // last 30 days
        topSearchedTopics,
      },
    },
  });
}));

export default router;

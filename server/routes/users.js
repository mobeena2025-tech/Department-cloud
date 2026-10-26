import express from 'express';
import supabase from '../supabase.js';
import { requireRole, toUserResponse } from '../lib/auth.js';
import { recordAuditLog } from '../lib/audit.js';
import { visibleCourseIds } from '../lib/access.js';
import { isUuid } from '../lib/courseLookup.js';
import { generateTemporaryPassword } from '../lib/password.js';
import { DEPARTMENT } from '../lib/department.js';
import { HttpError, asyncHandler, optionalInt, optionalString, requiredString } from '../lib/validate.js';

const router = express.Router();

const ROLES = ['admin', 'faculty', 'student'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function dbError(context, error) {
  console.error(`${context}:`, error.message);
  return new HttpError(500, 'Database error');
}

// Admin: every account. Faculty: students enrolled in courses they teach.
router.get('/', requireRole('admin', 'faculty'), asyncHandler(async (req, res) => {
  const role = optionalString(req.query.role, 'role', { max: 10 })?.toLowerCase();
  if (role && !ROLES.includes(role)) throw new HttpError(400, `role must be one of ${ROLES.join(', ')}`);
  const search = optionalString(req.query.query, 'query', { max: 100 })?.toLowerCase();

  let query = supabase.from('profiles').select('*').order('role').order('full_name');

  if (req.user.role === 'faculty') {
    if (role && role !== 'student') return res.json({ success: true, users: [] });
    const taught = await visibleCourseIds(req.user);
    if (!taught.length) return res.json({ success: true, users: [] });
    const { data: rows, error } = await supabase.from('enrollments').select('student_id').in('course_id', taught);
    if (error) throw dbError('Enrollment lookup error', error);
    const ids = [...new Set(rows.map((r) => r.student_id))];
    if (!ids.length) return res.json({ success: true, users: [] });
    query = query.in('id', ids).eq('role', 'student');
  } else if (role) {
    query = query.eq('role', role);
  }

  const { data, error } = await query;
  if (error) throw dbError('Users list error', error);

  let users = data.map(toUserResponse);
  if (search) {
    users = users.filter((u) =>
      [u.name, u.email, u.rollNo, u.empId].some((v) => v && v.toLowerCase().includes(search))
    );
  }
  res.json({ success: true, users });
}));

// Create an account (admin only): a Supabase Auth user + its profile.
router.post('/', requireRole('admin'), asyncHandler(async (req, res) => {
  const body = req.body || {};
  const name = requiredString(body.name, 'name', { max: 120 });
  const email = requiredString(body.email, 'email', { max: 200, pattern: EMAIL_PATTERN }).toLowerCase();
  const role = requiredString(body.role, 'role', { max: 10 }).toLowerCase();
  if (!ROLES.includes(role)) throw new HttpError(400, `role must be one of ${ROLES.join(', ')}`);
  const password = requiredString(body.password, 'password', { max: 72 });
  if (password.length < 8) throw new HttpError(400, 'password must be at least 8 characters');

  const isStudent = role === 'student';
  const profile = {
    full_name: name,
    email,
    role,
    department: optionalString(body.department, 'department', { max: 100 }) ?? DEPARTMENT,
    roll_number: isStudent ? optionalString(body.rollNo, 'rollNo', { max: 30 }) ?? null : null,
    semester: isStudent ? optionalInt(body.semester, 'semester', { min: 1, max: 8 }) ?? null : null,
    section: isStudent ? optionalString(body.section, 'section', { max: 2 }) ?? null : null,
    emp_id: !isStudent ? optionalString(body.empId, 'empId', { max: 30 }) ?? null : null,
    designation: !isStudent ? optionalString(body.designation, 'designation', { max: 60 }) ?? null : null,
  };

  const { data: created, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    // The admin chose this password, so ask the user to pick their own.
    app_metadata: { must_change_password: true },
  });
  if (authError) {
    if (/already/i.test(authError.message)) throw new HttpError(409, 'An account with this email already exists');
    console.error('Create auth user error:', authError.message);
    throw new HttpError(400, 'Could not create the account');
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: created.user.id, ...profile })
    .select()
    .single();
  if (error) {
    await supabase.auth.admin.deleteUser(created.user.id); // keep auth and profiles in sync
    throw dbError('Profile insert error', error);
  }

  recordAuditLog(req, {
    action: 'CREATE_USER',
    resource: `${name} (${email}) - ${role}`,
    details: `Admin created a ${role} account.`,
  });

  res.status(201).json({ success: true, user: toUserResponse(data, created.user) });
}));

// "Forgot password": the admin gives the user a new temporary password.
// It is returned ONCE in this response (never stored or logged) for the
// admin to pass on privately; the user is asked to change it after sign-in.
router.post('/:id/reset-password', requireRole('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) throw new HttpError(400, 'Invalid user id');
  if (id === req.user.id) throw new HttpError(400, 'Use "Change password" to change your own password');

  const { data: profile, error } = await supabase.from('profiles').select('id, full_name, email, role').eq('id', id).maybeSingle();
  if (error) throw dbError('Profile lookup error', error);
  if (!profile) throw new HttpError(404, 'User not found');

  const temporaryPassword = generateTemporaryPassword();
  const { error: updError } = await supabase.auth.admin.updateUserById(id, {
    password: temporaryPassword,
    app_metadata: { must_change_password: true },
  });
  if (updError) {
    console.error('Password reset failed:', updError.message);
    throw new HttpError(500, 'Could not reset the password');
  }

  recordAuditLog(req, {
    action: 'RESET_PASSWORD',
    resource: `${profile.full_name} (${profile.email})`,
    severity: 'WARNING',
    details: 'Admin issued a temporary password.',
  });

  res.json({ success: true, user: { id: profile.id, name: profile.full_name, email: profile.email }, temporaryPassword });
}));

export default router;

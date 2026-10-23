import supabase from '../supabase.js';
import { HttpError } from './validate.js';

// Course-level access rules:
//   admin   -> every course
//   faculty -> courses they teach (course_faculty)
//   student -> courses they are enrolled in (enrollments)
// Viewing and managing use the same lists; only faculty/admin can manage.

async function courseIdsFrom(table, column, userId) {
  const { data, error } = await supabase.from(table).select('course_id').eq(column, userId);
  if (error) {
    console.error(`${table} lookup error:`, error.message);
    throw new HttpError(500, 'Database error');
  }
  return data.map((r) => r.course_id);
}

/** Course ids this user may see, or null meaning "all" (admin). */
export async function visibleCourseIds(user) {
  if (user.role === 'admin') return null;
  if (user.role === 'faculty') return courseIdsFrom('course_faculty', 'faculty_id', user.id);
  if (user.role === 'student') return courseIdsFrom('enrollments', 'student_id', user.id);
  return [];
}

export async function canViewCourse(user, courseId) {
  const ids = await visibleCourseIds(user);
  return ids === null || ids.includes(courseId);
}

export async function canManageCourse(user, courseId) {
  if (user.role === 'admin') return true;
  if (user.role !== 'faculty') return false;
  const ids = await courseIdsFrom('course_faculty', 'faculty_id', user.id);
  return ids.includes(courseId);
}

export async function assertCanViewCourse(user, courseId) {
  if (!(await canViewCourse(user, courseId))) {
    throw new HttpError(403, 'You are not enrolled in or assigned to this course');
  }
}

export async function assertCanManageCourse(user, courseId) {
  if (!(await canManageCourse(user, courseId))) {
    throw new HttpError(403, 'Only faculty assigned to this course (or an admin) can do this');
  }
}

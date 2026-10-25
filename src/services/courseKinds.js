// Core vs elective, worked out from enrollment numbers (no extra database field).
// A student is enrolled in every core course of their class, so their core
// courses all have the class's full head count; a course with fewer students
// than that is an elective (e.g. 67 in each core course, 41 in APA).
export function markElectives(courses) {
  const classSize = Math.max(0, ...courses.map((c) => c.enrolledCount || 0));
  return courses
    .map((c) => ({ ...c, isElective: classSize > 0 && (c.enrolledCount || 0) < classSize }))
    .sort((a, b) => Number(a.isElective) - Number(b.isElective) || a.code.localeCompare(b.code));
}

// "8 core + 1 elective"
export function courseMixLabel(courses) {
  const electives = courses.filter((c) => c.isElective).length;
  const core = courses.length - electives;
  return electives ? `${core} core + ${electives} elective${electives > 1 ? 's' : ''}` : `${core} core`;
}

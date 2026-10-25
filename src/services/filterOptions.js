// Filter choices built from the materials actually loaded (no hard-coded lists).

// [{ id, label }] for each course that has materials, sorted by code.
export function courseOptions(materials) {
  const byId = new Map();
  for (const m of materials) {
    if (m.courseId && !byId.has(m.courseId)) {
      byId.set(m.courseId, { id: m.courseId, code: m.courseCode, label: [m.courseCode, m.courseName].filter(Boolean).join(' - ') });
    }
  }
  return [...byId.values()].sort((a, b) => (a.code || '').localeCompare(b.code || ''));
}

// Semester numbers present in the materials, ascending.
export function semesterOptions(materials) {
  return [...new Set(materials.map((m) => m.semester).filter((s) => s != null))].sort((a, b) => a - b);
}

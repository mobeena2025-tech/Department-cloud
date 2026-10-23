// Convert database rows (snake_case) into the JSON shapes the frontend uses
// (camelCase). Keep every response shape in this one file.

export function formatFileSize(bytes) {
  if (typeof bytes !== 'number') return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const MATERIAL_SELECT = `
  *,
  courses ( id, code, name, semester, section ),
  uploader:profiles!materials_uploaded_by_fkey ( full_name )
`;

export const ASSIGNMENT_SELECT = `
  *,
  courses ( id, code, name, semester, section )
`;

export function toMaterialResponse(m) {
  const unitNumber = Number(m.unit) || 1;
  return {
    id: m.id,
    courseId: m.course_id,
    courseName: m.courses?.name || '',
    courseCode: m.courses?.code || '',
    semester: m.courses?.semester ?? null,

    title: m.title,
    description: m.description,
    unitNumber,
    unitTitle: `Unit ${unitNumber}`,
    topic: m.topic,

    fileType: m.file_type || 'PDF',
    materialType: m.file_type || 'PDF',
    storagePath: m.storage_path,
    size: formatFileSize(m.file_size),

    uploadDate: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : null,
    uploadedBy: m.uploader?.full_name || null,
    uploadedById: m.uploaded_by,
    downloads: 0,

    tags: [],
    summary: m.description || '',
    visibility: 'Department / Enrolled',
    accessPermissions: 'Department Enrolled Only',
    downloadPermitted: true,
  };
}

export function toAssignmentResponse(a) {
  return {
    id: a.id,
    courseId: a.course_id,
    courseCode: a.courses?.code || '',
    courseTitle: a.courses?.name || '',

    title: a.title,
    description: a.description,
    unitNumber: a.unit_number,
    assignedDate: a.assigned_date,
    dueDate: a.due_date,
    maxMarks: a.max_marks,

    facultyId: a.faculty_id,
    facultyName: a.faculty_name,

    attachmentName: a.attachment_name,
    attachmentSize: a.attachment_size,

    // Real counts arrive with enrollments (Phase 3) and submissions (Phase 4).
    totalEnrolled: a.total_enrolled ?? 0,
    submittedCount: 0,
    pendingCount: a.total_enrolled ?? 0,

    status: a.status,
    createdAt: a.created_at,
  };
}

// Units are derived from the unit numbers actually used by materials and
// assignments; there is no separate syllabus table.
function unitsFrom(unitNumbers) {
  return [...new Set(unitNumbers.filter((n) => Number.isInteger(n) && n > 0))]
    .sort((a, b) => a - b)
    .map((n) => ({ unitNumber: n, title: '', description: '' }));
}

/**
 * The one course shape used by every endpoint and page.
 * `materials` / `assignments` are arrays of already-mapped objects.
 * Pass `nested: true` to include them in full (course detail page).
 */
export function toCourseResponse(
  c,
  { materials = [], assignments = [], facultyNames = [], enrolledCount = 0, nested = false } = {}
) {
  const course = {
    id: c.id,
    code: c.code,
    title: c.name,
    semester: c.semester,
    section: c.section,
    credits: c.credits,
    department: c.department || null,
    description: c.description || null,

    facultyName: facultyNames.length ? facultyNames.join(', ') : null,
    enrolledCount,

    materialsCount: materials.length,
    activeAssignmentsCount: assignments.filter((a) => a.status === 'Active').length,
    units: unitsFrom([
      ...materials.map((m) => m.unitNumber),
      ...assignments.map((a) => a.unitNumber),
    ]),
  };

  if (nested) {
    course.materials = materials;
    course.assignments = assignments;
    course.announcements = []; // Phase 4
  }
  return course;
}

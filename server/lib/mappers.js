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
    // Assistant search status: pending | indexing | indexed | no_text | failed
    indexStatus: m.index_status ?? null,
    pageCount: m.page_count ?? null,
    size: formatFileSize(m.file_size),

    uploadDate: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : null,
    uploadedBy: m.uploader?.full_name || null,
    uploadedById: m.uploaded_by,
    downloads: 0,

    summary: m.description || '',
    visibility: 'Department / Enrolled',
    accessPermissions: 'Department Enrolled Only',
    downloadPermitted: true,
  };
}

export function toAssignmentResponse(a, { enrolled = 0, submitted = 0 } = {}) {
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

    totalEnrolled: enrolled,
    submittedCount: submitted,
    pendingCount: Math.max(0, enrolled - submitted),

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
  { materials = [], assignments = [], announcements = [], facultyNames = [], enrolledCount = 0, nested = false } = {}
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
    course.announcements = announcements;
  }
  return course;
}

export const ANNOUNCEMENT_SELECT = `
  *,
  courses ( id, code, name )
`;

export function toAnnouncementResponse(a) {
  return {
    id: a.id,
    courseId: a.course_id,
    courseCode: a.courses?.code || null,
    courseName: a.courses?.name || null,
    title: a.title,
    content: a.content,
    category: a.category,
    priority: a.priority,
    department: 'CSE - AI & ML',
    author: a.author_name,
    date: a.created_at,
    attachments: [],
  };
}

export const SUBMISSION_SELECT = `
  *,
  assignments!inner ( id, title, course_id, max_marks, courses ( code, name ) ),
  student:profiles!submissions_student_id_fkey ( full_name, roll_number ),
  grader:profiles!submissions_graded_by_fkey ( full_name )
`;

export function toSubmissionResponse(s) {
  return {
    id: s.id,
    assignmentId: s.assignment_id,
    assignmentTitle: s.assignments?.title || '',
    courseId: s.assignments?.course_id || null,
    courseCode: s.assignments?.courses?.code || '',
    studentId: s.student_id,
    studentName: s.student?.full_name || '',
    rollNo: s.student?.roll_number || '',
    submittedAt: s.submitted_at,
    status: s.status,
    submissionText: s.submission_text,
    fileName: s.file_name,
    fileSize: formatFileSize(s.file_size),
    hasFile: Boolean(s.storage_path),
    grade: s.grade === null || s.grade === undefined ? null : Number(s.grade),
    maxMarks: s.assignments?.max_marks ?? null,
    feedback: s.feedback,
    gradedBy: s.grader?.full_name || null,
    gradedAt: s.graded_at,
  };
}

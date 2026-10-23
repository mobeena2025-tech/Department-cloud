/**
 * Mongoose Schema definition for User model
 * MongoDB-compatible data architecture
 */

export const UserSchemaDefinition = {
  name: { type: 'String', required: true },
  email: { type: 'String', required: true, unique: true },
  rollNo: { type: 'String', sparse: true },
  empId: { type: 'String', sparse: true },
  role: { type: 'String', enum: ['student', 'faculty', 'admin'], required: true },
  department: { type: 'String', required: true },
  semester: { type: 'Number' },
  section: { type: 'String' },
  cgpa: { type: 'Number' },
  creditsCompleted: { type: 'Number' },
  enrolledCourses: [{ type: 'String', ref: 'Course' }],
  coursesTaught: [{ type: 'String', ref: 'Course' }],
  designation: { type: 'String' },
  office: { type: 'String' },
  status: { type: 'String', enum: ['Active', 'Suspended', 'On Leave'], default: 'Active' },
  createdAt: { type: 'Date', default: 'Date.now' },
};

export const CourseSchemaDefinition = {
  code: { type: 'String', required: true, unique: true },
  title: { type: 'String', required: true },
  department: { type: 'String', required: true },
  semester: { type: 'Number', required: true },
  credits: { type: 'Number', required: true },
  facultyId: { type: 'String', ref: 'User', required: true },
  facultyName: { type: 'String', required: true },
  description: { type: 'String' },
  syllabusUrl: { type: 'String' },
  units: [{
    unitNumber: { type: 'Number', required: true },
    title: { type: 'String', required: true },
    description: { type: 'String' },
  }],
};

export const MaterialSchemaDefinition = {
  courseId: { type: 'String', ref: 'Course', required: true },
  courseName: { type: 'String', required: true },
  unitNumber: { type: 'Number', required: true },
  unitTitle: { type: 'String', required: true },
  title: { type: 'String', required: true },
  topic: { type: 'String', required: true },
  fileType: { type: 'String', enum: ['PDF', 'PPTX', 'IPYNB', 'DOCX', 'ZIP'], default: 'PDF' },
  size: { type: 'String', required: true },
  pages: { type: 'Number' },
  uploadedBy: { type: 'String', required: true },
  uploadDate: { type: 'Date', default: 'Date.now' },
  downloads: { type: 'Number', default: 0 },
  visibility: { type: 'String', default: 'Department / Enrolled' },
  tags: [{ type: 'String' }],
  summary: { type: 'String' },
  contentPreview: { type: 'String' },
  cloudStorageKey: { type: 'String' }, // For S3/GCS blob binding
};

export const AssignmentSchemaDefinition = {
  courseId: { type: 'String', ref: 'Course', required: true },
  courseCode: { type: 'String', required: true },
  courseTitle: { type: 'String', required: true },
  title: { type: 'String', required: true },
  description: { type: 'String', required: true },
  unitNumber: { type: 'Number', required: true },
  assignedDate: { type: 'Date', default: 'Date.now' },
  dueDate: { type: 'Date', required: true },
  maxMarks: { type: 'Number', required: true },
  facultyId: { type: 'String', ref: 'User', required: true },
  facultyName: { type: 'String', required: true },
  attachmentName: { type: 'String' },
  attachmentSize: { type: 'String' },
  status: { type: 'String', enum: ['Active', 'Closed', 'Graded'], default: 'Active' },
};

export const SubmissionSchemaDefinition = {
  assignmentId: { type: 'String', ref: 'Assignment', required: true },
  courseId: { type: 'String', ref: 'Course', required: true },
  studentId: { type: 'String', ref: 'User', required: true },
  studentName: { type: 'String', required: true },
  rollNo: { type: 'String', required: true },
  submittedAt: { type: 'Date' },
  status: { type: 'String', enum: ['Pending', 'Submitted', 'Graded'], default: 'Pending' },
  fileName: { type: 'String' },
  fileSize: { type: 'String' },
  submissionText: { type: 'String' },
  grade: { type: 'Number' },
  maxMarks: { type: 'Number' },
  feedback: { type: 'String' },
  gradedBy: { type: 'String' },
  gradedAt: { type: 'Date' },
};

export const AnnouncementSchemaDefinition = {
  title: { type: 'String', required: true },
  category: { type: 'String', required: true },
  priority: { type: 'String', enum: ['Normal', 'High', 'Urgent'], default: 'Normal' },
  department: { type: 'String', required: true },
  courseId: { type: 'String', ref: 'Course', default: null },
  courseName: { type: 'String', default: null },
  author: { type: 'String', required: true },
  date: { type: 'Date', default: 'Date.now' },
  content: { type: 'String', required: true },
  attachments: [{ name: 'String', size: 'String' }],
};

export const AuditLogSchemaDefinition = {
  timestamp: { type: 'Date', default: 'Date.now' },
  actorName: { type: 'String', required: true },
  actorRole: { type: 'String', required: true },
  actorEmail: { type: 'String', required: true },
  action: { type: 'String', required: true },
  resource: { type: 'String', required: true },
  ipAddress: { type: 'String', required: true },
  status: { type: 'String', enum: ['SUCCESS', 'DENIED', 'ERROR'], default: 'SUCCESS' },
  severity: { type: 'String', enum: ['INFO', 'LOW', 'WARNING', 'CRITICAL'], default: 'INFO' },
  details: { type: 'String' },
};

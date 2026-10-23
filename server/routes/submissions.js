import express from 'express';
import { store, recordAuditLog } from '../data/store.js';
import { requireRole } from '../lib/auth.js';

const router = express.Router();

// List submissions with filtering
router.get('/', (req, res) => {
  const { assignmentId, courseId } = req.query;
  // Students only ever see their own submissions.
  const studentId = req.user.role === 'student' ? req.user.id : req.query.studentId;

  let list = [...store.submissions];

  if (assignmentId) {
    list = list.filter(s => s.assignmentId === assignmentId);
  }

  if (studentId) {
    list = list.filter(s => s.studentId === studentId);
  }

  if (courseId) {
    list = list.filter(s => s.courseId === courseId);
  }

  res.json({ success: true, submissions: list });
});

// Single submission details
router.get('/:id', (req, res) => {
  const sub = store.submissions.find(s => s.id === req.params.id);
  if (!sub) {
    return res.status(404).json({ success: false, message: 'Submission not found' });
  }
  if (req.user.role === 'student' && sub.studentId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'You can only view your own submissions' });
  }
  res.json({ success: true, submission: sub });
});

// Student submits an assignment
router.post('/', requireRole('student'), (req, res) => {
  const { assignmentId, fileName, fileSize = '3.5 MB', submissionText } = req.body || {};
  const studentId = req.user.id; // never from the request body

  if (!assignmentId) {
    return res.status(400).json({ success: false, message: 'Assignment ID is required' });
  }

  const assignment = store.assignments.find(a => a.id === assignmentId);
  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  const student = store.users.find(u => u.id === studentId) || store.users[0];

  // Find existing pending submission or create new
  let sub = store.submissions.find(s => s.assignmentId === assignmentId && s.studentId === studentId);

  if (sub) {
    sub.status = 'Submitted';
    sub.submittedAt = new Date().toISOString();
    sub.fileName = fileName || `${assignment.courseCode}_Submission_${student.rollNo}.pdf`;
    sub.fileSize = fileSize;
    sub.submissionText = submissionText || 'Uploaded completed assignment report and source verification.';
  } else {
    sub = {
      id: `sub_${assignmentId}_${studentId}_${Date.now()}`,
      assignmentId,
      courseId: assignment.courseId,
      studentId,
      studentName: student.name,
      rollNo: student.rollNo,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      fileName: fileName || `${assignment.courseCode}_Submission_${student.rollNo}.pdf`,
      fileSize,
      submissionText: submissionText || 'Uploaded completed assignment report.',
      grade: null,
      maxMarks: assignment.maxMarks,
      feedback: null,
    };
    store.submissions.push(sub);
  }

  recordAuditLog({
    actorName: student.name,
    actorRole: 'student',
    actorEmail: student.email,
    action: 'SUBMIT_ASSIGNMENT',
    resource: `${assignment.courseCode}: ${assignment.title}`,
    status: 'SUCCESS',
    severity: 'INFO',
    details: `Submitted work "${sub.fileName}" (${sub.fileSize}).`,
  });

  res.json({ success: true, submission: sub });
});

// Faculty grades a submission
router.put('/:id/grade', requireRole('faculty', 'admin'), (req, res) => {
  const { id } = req.params;
  const { grade, feedback } = req.body || {};
  const gradedBy = req.user.name;

  const sub = store.submissions.find(s => s.id === id);
  if (!sub) {
    return res.status(404).json({ success: false, message: 'Submission not found' });
  }

  const numGrade = Number(grade);
  if (isNaN(numGrade) || numGrade < 0 || numGrade > (sub.maxMarks || 100)) {
    return res.status(400).json({ success: false, message: `Grade must be between 0 and ${sub.maxMarks || 100}` });
  }

  sub.grade = numGrade;
  sub.feedback = feedback || 'Graded by course instructor.';
  sub.status = 'Graded';
  sub.gradedBy = gradedBy;
  sub.gradedAt = new Date().toISOString();

  recordAuditLog({
    actorName: req.user.name,
    actorRole: req.user.role,
    actorEmail: req.user.email,
    action: 'GRADE_SUBMISSION',
    resource: `Submission ${id} (Student: ${sub.studentName})`,
    status: 'SUCCESS',
    severity: 'INFO',
    details: `Awarded ${numGrade}/${sub.maxMarks} marks.`,
  });

  res.json({ success: true, submission: sub });
});

export default router;

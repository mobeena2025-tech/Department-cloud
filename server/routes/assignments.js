import express from 'express';
import { recordAuditLog } from '../data/store.js';
import supabase from '../supabase.js';

const router = express.Router();

// List all assignments
// List all assignments
router.get('/', async (req, res) => {
  try {
    const { courseId, status } = req.query;

    let query = supabase
      .from('assignments')
      .select(`
        *,
        courses (
          id,
          code,
          name,
          semester,
          section
        )
      `)
      .order('created_at', { ascending: false });

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase assignments error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch assignments',
        error: error.message
      });
    }

    const assignments = data.map(a => ({
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

      totalEnrolled: a.total_enrolled,
      submittedCount: 0,
      pendingCount: a.total_enrolled,

      status: a.status,
      createdAt: a.created_at
    }));

    res.json({
      success: true,
      assignments
    });

  } catch (error) {
    console.error('Assignments route error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Single assignment details
router.get('/:id', (req, res) => {
  const assignment = store.assignments.find(a => a.id === req.params.id);
  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  const submissions = store.submissions.filter(s => s.assignmentId === assignment.id);
  res.json({
    success: true,
    assignment: {
      ...assignment,
      submissions,
    },
  });
});

// Create new assignment (Faculty/Admin)
router.post('/', (req, res) => {
  const {
    title,
    courseId,
    description,
    unitNumber = 1,
    dueDate,
    maxMarks = 25,
    attachmentName,
    attachmentSize = '1.5 MB',
    facultyName = 'Dr. Demo Faculty A',
    facultyId = 'usr_faculty_1',
  } = req.body;

  if (!title || !courseId || !dueDate) {
    return res.status(400).json({ success: false, message: 'Title, course, and due date are required' });
  }

  const course = store.courses.find(c => c.id === courseId) || store.courses[0];

  const newAssignment = {
    id: `asg_${course.id.toLowerCase()}_${Date.now()}`,
    courseId: course.id,
    courseCode: course.code,
    courseTitle: course.title,
    title,
    description: description || 'Complete the assignment questions as outlined in the course instructions.',
    unitNumber: Number(unitNumber) || 1,
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate,
    maxMarks: Number(maxMarks) || 25,
    facultyId,
    facultyName,
    attachmentName: attachmentName || null,
    attachmentSize: attachmentName ? attachmentSize : null,
    totalEnrolled: course.enrolledCount || 68,
    submittedCount: 0,
    pendingCount: course.enrolledCount || 68,
    status: 'Active',
  };

  store.assignments.unshift(newAssignment);

  // Initialize pending submission records for all enrolled students
  const enrolledStudents = store.users.filter(u => u.role === 'student' && (!u.enrolledCourses || u.enrolledCourses.includes(course.id)));
  enrolledStudents.forEach(stu => {
    store.submissions.push({
      id: `sub_${newAssignment.id}_${stu.id}`,
      assignmentId: newAssignment.id,
      courseId: course.id,
      studentId: stu.id,
      studentName: stu.name,
      rollNo: stu.rollNo,
      submittedAt: null,
      status: 'Pending',
      fileName: null,
      fileSize: null,
      submissionText: null,
      grade: null,
      maxMarks: newAssignment.maxMarks,
      feedback: null,
    });
  });

  recordAuditLog({
    actorName: facultyName,
    actorRole: 'faculty',
    actorEmail: 'demo.user@example.edu',
    action: 'CREATE_ASSIGNMENT',
    resource: `${course.code}: ${title}`,
    status: 'SUCCESS',
    severity: 'INFO',
    details: `Published assignment due on ${new Date(dueDate).toLocaleDateString()}. Total enrolled: ${newAssignment.totalEnrolled}.`,
  });

  res.status(201).json({ success: true, assignment: newAssignment });
});

export default router;

import express from 'express';
import { store, recordAuditLog } from '../data/store.js';

const router = express.Router();

// List users with role filter
router.get('/', (req, res) => {
  const { role, department, status, query } = req.query;

  let list = [...store.users];

  if (role) {
    list = list.filter(u => u.role.toLowerCase() === role.toLowerCase());
  }

  if (department) {
    list = list.filter(u => u.department.toLowerCase().includes(department.toLowerCase()));
  }

  if (status) {
    list = list.filter(u => u.status.toLowerCase() === status.toLowerCase());
  }

  if (query) {
    const q = query.toLowerCase();
    list = list.filter(u => 
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.rollNo && u.rollNo.toLowerCase().includes(q)) ||
      (u.empId && u.empId.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, users: list });
});

// Create new user (Admin only)
router.post('/', (req, res) => {
  const { name, email, role, department, rollNo, empId, designation, semester, section } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ success: false, message: 'Name, email, and role are required' });
  }

  const existing = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, message: 'User with this email already exists' });
  }

  const newUser = {
    id: `usr_${role}_${Date.now()}`,
    name,
    email,
    role,
    department: department || 'CSE - AI & ML',
    rollNo: role === 'student' ? (rollNo || `160121733${Math.floor(100 + Math.random() * 900)}`) : null,
    empId: role !== 'student' ? (empId || `FAC-${Math.floor(100 + Math.random() * 900)}`) : null,
    designation: designation || (role === 'faculty' ? 'Assistant Professor' : 'Student'),
    semester: role === 'student' ? (Number(semester) || 6) : null,
    section: section || 'A',
    cgpa: role === 'student' ? 8.50 : null,
    creditsCompleted: role === 'student' ? 114 : null,
    enrolledCourses: role === 'student' ? ['AI204', 'CS301', 'CS202'] : [],
    coursesTaught: role === 'faculty' ? ['AI204'] : [],
    status: 'Active',
    createdAt: new Date().toISOString(),
  };

  store.users.unshift(newUser);

  recordAuditLog({
    actorName: 'Prof. Demo Head',
    actorRole: 'admin',
    actorEmail: 'demo.user@example.edu',
    action: 'CREATE_USER',
    resource: `${name} (${email}) - ${role}`,
    status: 'SUCCESS',
    severity: 'INFO',
    details: `Admin provisioned new ${role} account.`,
  });

  res.status(201).json({ success: true, user: newUser });
});

export default router;

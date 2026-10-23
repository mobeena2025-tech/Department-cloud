import express from 'express';
import { store, recordAuditLog } from '../data/store.js';

const router = express.Router();

// List announcements
router.get('/', (req, res) => {
  const { courseId, priority } = req.query;

  let list = [...store.announcements];

  if (courseId) {
    list = list.filter(a => a.courseId === courseId || a.courseId === null);
  }

  if (priority) {
    list = list.filter(a => a.priority.toLowerCase() === priority.toLowerCase());
  }

  res.json({ success: true, announcements: list });
});

// Post new announcement (Faculty/Admin)
router.post('/', (req, res) => {
  const {
    title,
    category = 'Department Notice',
    priority = 'Normal',
    department = 'CSE - AI & ML',
    courseId = null,
    courseName = null,
    author = 'Dr. Demo Faculty A',
    content,
    attachments = [],
  } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Title and content are required' });
  }

  const newAnnouncement = {
    id: `anc_${Date.now()}`,
    title,
    category,
    priority,
    department,
    courseId,
    courseName,
    author,
    date: new Date().toISOString(),
    content,
    attachments: Array.isArray(attachments) ? attachments : [],
  };

  store.announcements.unshift(newAnnouncement);

  recordAuditLog({
    actorName: author,
    actorRole: courseId ? 'faculty' : 'admin',
    actorEmail: 'demo.user@example.edu',
    action: 'POST_ANNOUNCEMENT',
    resource: title,
    status: 'SUCCESS',
    severity: priority === 'Urgent' ? 'WARNING' : 'INFO',
    details: `Published ${priority} announcement for ${courseName || department}.`,
  });

  res.status(201).json({ success: true, announcement: newAnnouncement });
});

export default router;

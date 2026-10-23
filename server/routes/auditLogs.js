import express from 'express';
import { store, recordAuditLog } from '../data/store.js';
import { requireRole } from '../lib/auth.js';

const router = express.Router();

// List audit logs (HOD/Admin only)
router.get('/', requireRole('admin'), (req, res) => {
  const { severity, action, role } = req.query;

  let list = [...store.auditLogs];

  if (severity) {
    list = list.filter(l => l.severity.toLowerCase() === severity.toLowerCase());
  }

  if (action) {
    list = list.filter(l => l.action.toLowerCase().includes(action.toLowerCase()));
  }

  if (role) {
    list = list.filter(l => l.actorRole.toLowerCase() === role.toLowerCase());
  }

  res.json({ success: true, auditLogs: list });
});

// Record custom security event
// Clients may report an event, but the actor and IP are always taken from
// the verified session and the connection, never from the request body.
router.post('/', (req, res) => {
  const { action, resource, status, severity, details } = req.body || {};
  if (typeof action !== 'string' || !action.trim()) {
    return res.status(400).json({ success: false, message: 'action is required' });
  }

  const log = recordAuditLog({
    actorName: req.user.name,
    actorRole: req.user.role,
    actorEmail: req.user.email,
    action: action.slice(0, 60),
    resource: String(resource || '').slice(0, 200),
    ipAddress: req.ip,
    status: ['SUCCESS', 'FAILURE', 'DENIED'].includes(status) ? status : 'SUCCESS',
    severity: ['INFO', 'WARNING', 'CRITICAL'].includes(severity) ? severity : 'INFO',
    details: String(details || '').slice(0, 500),
  });

  res.status(201).json({ success: true, auditLog: log });
});

export default router;

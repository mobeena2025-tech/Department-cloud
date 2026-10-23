import express from 'express';
import { store, recordAuditLog } from '../data/store.js';

const router = express.Router();

// List audit logs (HOD/Admin only)
router.get('/', (req, res) => {
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
router.post('/', (req, res) => {
  const { actorName, actorRole, actorEmail, action, resource, ipAddress, status, severity, details } = req.body;

  const log = recordAuditLog({
    actorName,
    actorRole,
    actorEmail,
    action,
    resource,
    ipAddress,
    status,
    severity,
    details,
  });

  res.status(201).json({ success: true, auditLog: log });
});

export default router;

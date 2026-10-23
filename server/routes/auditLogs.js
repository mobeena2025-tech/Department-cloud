import express from 'express';
import supabase from '../supabase.js';
import { requireRole } from '../lib/auth.js';
import { recordAuditLog, toAuditLogResponse } from '../lib/audit.js';
import { HttpError, asyncHandler, optionalInt, optionalString, requiredString } from '../lib/validate.js';

const router = express.Router();

const SEVERITIES = ['INFO', 'WARNING', 'CRITICAL'];
const STATUSES = ['SUCCESS', 'FAILURE', 'DENIED'];
const ROLES = ['admin', 'faculty', 'student'];

// List audit logs (admin only), newest first
router.get('/', requireRole('admin'), asyncHandler(async (req, res) => {
  const severity = optionalString(req.query.severity, 'severity', { max: 10 })?.toUpperCase();
  const action = optionalString(req.query.action, 'action', { max: 60, pattern: /^[A-Za-z_]+$/ });
  const role = optionalString(req.query.role, 'role', { max: 10 })?.toLowerCase();
  const status = optionalString(req.query.status, 'status', { max: 10 })?.toUpperCase();
  const limit = optionalInt(req.query.limit, 'limit', { min: 1, max: 500 }) ?? 200;
  if (severity && !SEVERITIES.includes(severity)) throw new HttpError(400, `severity must be one of ${SEVERITIES.join(', ')}`);
  if (status && !STATUSES.includes(status)) throw new HttpError(400, `status must be one of ${STATUSES.join(', ')}`);
  if (role && !ROLES.includes(role)) throw new HttpError(400, `role must be one of ${ROLES.join(', ')}`);

  let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit);
  if (severity) query = query.eq('severity', severity);
  if (status) query = query.eq('status', status);
  if (role) query = query.eq('actor_role', role);
  if (action) query = query.ilike('action', `%${action}%`);

  const { data, error } = await query;
  if (error) {
    console.error('Audit log list error:', error.message);
    throw new HttpError(500, 'Database error');
  }
  res.json({ success: true, auditLogs: data.map(toAuditLogResponse) });
}));

// Record a client-side event. The actor and IP come from the verified
// session and the connection, never from the request body.
router.post('/', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const action = requiredString(body.action, 'action', { max: 60, pattern: /^[A-Za-z_]+$/ }).toUpperCase();
  const status = (optionalString(body.status, 'status', { max: 10 }) || 'SUCCESS').toUpperCase();
  const severity = (optionalString(body.severity, 'severity', { max: 10 }) || 'INFO').toUpperCase();
  if (!STATUSES.includes(status) || !SEVERITIES.includes(severity)) throw new HttpError(400, 'Invalid status or severity');

  await recordAuditLog(req, {
    action: `CLIENT_${action}`,
    resource: optionalString(body.resource, 'resource', { max: 300 }) ?? null,
    status,
    severity,
    details: optionalString(body.details, 'details', { max: 1000 }) ?? null,
  });
  res.status(201).json({ success: true });
}));

export default router;

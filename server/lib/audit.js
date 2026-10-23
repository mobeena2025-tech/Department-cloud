import supabase from '../supabase.js';

const clip = (value, max) => (value == null ? null : String(value).slice(0, max));

/**
 * Write an audit log row. The actor is the verified user on req.user (or an
 * explicit `actor` for the login route). Never throws: a failed audit write
 * is logged on the server and does not break the user's request.
 */
export function recordAuditLog(req, {
  action,
  resource = null,
  courseId = null,
  status = 'SUCCESS',
  severity = 'INFO',
  details = null,
  actor = null,
}) {
  const who = actor || req?.user || {};
  return supabase
    .from('audit_logs')
    .insert({
      actor_id: who.id || null,
      actor_name: clip(who.name, 120),
      actor_role: clip(who.role, 20),
      actor_email: clip(who.email, 200),
      action: clip(action, 60),
      resource: clip(resource, 300),
      course_id: courseId,
      ip_address: clip(req?.ip, 60),
      status,
      severity,
      details: clip(details, 1000),
    })
    .then(({ error }) => {
      if (error) console.error('Audit log insert failed:', error.message);
    });
}

export function toAuditLogResponse(r) {
  return {
    id: r.id,
    timestamp: r.created_at,
    actorName: r.actor_name || 'Unknown',
    actorRole: r.actor_role || 'unknown',
    actorEmail: r.actor_email,
    action: r.action,
    resource: r.resource,
    courseId: r.course_id,
    ipAddress: r.ip_address,
    status: r.status,
    severity: r.severity,
    details: r.details,
  };
}

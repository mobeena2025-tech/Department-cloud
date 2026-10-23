import {
  mockUsers,
  mockCourses,
  mockMaterials,
  mockAssignments,
  mockSubmissions,
  mockAnnouncements,
  mockAuditLogs,
  mockDepartmentAnalytics
} from './mockData.js';

// In-memory persistent state mirroring a MongoDB database
export const store = {
  users: [...mockUsers],
  courses: [...mockCourses],
  materials: [...mockMaterials],
  assignments: [...mockAssignments],
  submissions: [...mockSubmissions],
  announcements: [...mockAnnouncements],
  auditLogs: [...mockAuditLogs],
  analytics: { ...mockDepartmentAnalytics },
};

/**
 * Add an audit log event
 */
export function recordAuditLog({ actorName, actorRole, actorEmail, action, resource, ipAddress = '10.20.44.112', status = 'SUCCESS', severity = 'INFO', details = '' }) {
  const newLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    actorName: actorName || 'System',
    actorRole: actorRole || 'system',
    actorEmail: actorEmail || 'demo.user@example.edu',
    action,
    resource,
    ipAddress,
    status,
    severity,
    details,
  };
  store.auditLogs.unshift(newLog);
  // Keep last 100 logs
  if (store.auditLogs.length > 100) store.auditLogs.pop();
  return newLog;
}

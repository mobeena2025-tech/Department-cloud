/**
 * Unified API Client for Department Academic Cloud
 * Interfaces with Express backend with fallback to embedded dataset
 */

const API_BASE = '/api';

export async function fetchApi(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn(`[API Client] Fallback or error on ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth
  getDemoUsers: () => fetchApi('/auth/demo-users'),
  login: (credentials) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getProfile: () => fetchApi('/auth/me'),

  // Courses
  getCourses: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchApi(`/courses${qs ? `?${qs}` : ''}`);
  },
  getCourse: (id) => fetchApi(`/courses/${id}`),
  createCourse: (data) => fetchApi('/courses', { method: 'POST', body: JSON.stringify(data) }),

  // Materials
  getMaterials: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchApi(`/materials${qs ? `?${qs}` : ''}`);
  },
  getMaterial: (id) => fetchApi(`/materials/${id}`),
  uploadMaterial: (data) => fetchApi('/materials', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterial: (id, data) => fetchApi(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterial: (id) => fetchApi(`/materials/${id}`, { method: 'DELETE' }),
  smartClassify: (fileName, fileSize) => 
    fetchApi('/materials/smart-classify', { method: 'POST', body: JSON.stringify({ fileName, fileSize }) }),

  // Assignments
  getAssignments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchApi(`/assignments${qs ? `?${qs}` : ''}`);
  },
  getAssignment: (id) => fetchApi(`/assignments/${id}`),
  createAssignment: (data) => fetchApi('/assignments', { method: 'POST', body: JSON.stringify(data) }),

  // Submissions
  getSubmissions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchApi(`/submissions${qs ? `?${qs}` : ''}`);
  },
  getSubmission: (id) => fetchApi(`/submissions/${id}`),
  submitAssignment: (data) => fetchApi('/submissions', { method: 'POST', body: JSON.stringify(data) }),
  gradeSubmission: (id, data) => fetchApi(`/submissions/${id}/grade`, { method: 'PUT', body: JSON.stringify(data) }),

  // Announcements
  getAnnouncements: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchApi(`/announcements${qs ? `?${qs}` : ''}`);
  },
  createAnnouncement: (data) => fetchApi('/announcements', { method: 'POST', body: JSON.stringify(data) }),

  // AI Semantic Search
  searchAI: (query, userContext = {}) => 
    fetchApi('/ai-search', { method: 'POST', body: JSON.stringify({ query, ...userContext }) }),

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchApi(`/audit-logs${qs ? `?${qs}` : ''}`);
  },
  recordAuditLog: (data) => fetchApi('/audit-logs', { method: 'POST', body: JSON.stringify(data) }),

  // Analytics
  getAnalytics: () => fetchApi('/analytics'),

  // Users
  getUsers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchApi(`/users${qs ? `?${qs}` : ''}`);
  },
  createUser: (data) => fetchApi('/users', { method: 'POST', body: JSON.stringify(data) }),
};

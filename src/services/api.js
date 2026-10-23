/**
 * Unified API Client for Department Academic Cloud
 * Interfaces with Express backend with fallback to embedded dataset
 */

const API_BASE = '/api';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // must match the server limit

// Returns an error message, or null if the file is an acceptable PDF.
export function validatePdfFile(file) {
  if (!file) return 'Please choose a file.';
  if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
    return 'Only PDF files are allowed.';
  }
  if (file.size > MAX_UPLOAD_BYTES) return 'File is larger than 10 MB.';
  return null;
}

export function formatFileSize(bytes) {
  if (typeof bytes !== 'number') return bytes || '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function fetchApi(endpoint, options = {}) {
  try {
    // Let the browser set the multipart boundary for FormData bodies.
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const token = localStorage.getItem('dac_auth_token');
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
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
  uploadMaterial: (formData) => fetchApi('/materials', { method: 'POST', body: formData }),
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

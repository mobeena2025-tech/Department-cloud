/**
 * API client for Department Academic Cloud.
 * Every request carries the Supabase access token from the current session.
 * A 401 triggers one refresh attempt; if that fails the session is cleared
 * and a 'dac:unauthorized' event sends the user back to the login page.
 */

const API_BASE = '/api';
const SESSION_KEY = 'dac_session';
export const USER_KEY = 'dac_auth_user';

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

let refreshInFlight = null;

// Exchange the refresh token for a new session (shared by parallel requests).
async function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const current = getSession();
      if (!current?.refreshToken) return null;
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      setSession(data.session);
      if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.session;
    })()
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

function signOutLocally() {
  setSession(null);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('dac:unauthorized'));
}

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

export async function fetchApi(endpoint, options = {}, canRetry = true) {
  const isAuthCall = endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/refresh');

  // Renew a token that is about to expire before using it.
  let session = getSession();
  if (!isAuthCall && session?.expiresAt && session.expiresAt * 1000 - Date.now() < 60 * 1000) {
    session = (await refreshSession()) || session;
  }

  // Let the browser set the multipart boundary for FormData bodies.
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(session?.accessToken && !isAuthCall ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401 && !isAuthCall) {
    if (canRetry && (await refreshSession())) {
      return fetchApi(endpoint, options, false);
    }
    signOutLocally();
    throw new Error('Your session has expired. Please sign in again.');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (email, password) =>
    fetchApi('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
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
  submitAssignment: (formData) => fetchApi('/submissions', { method: 'POST', body: formData }),
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

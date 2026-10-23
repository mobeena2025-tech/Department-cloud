import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import materialRoutes from './routes/materials.js';
import assignmentRoutes from './routes/assignments.js';
import submissionRoutes from './routes/submissions.js';
import announcementRoutes from './routes/announcements.js';
import aiSearchRoutes from './routes/aiSearch.js';
import auditLogRoutes from './routes/auditLogs.js';
import analyticsRoutes from './routes/analytics.js';
import userRoutes from './routes/users.js';
import { requireAuth } from './lib/auth.js';

const app = express();

// Only the frontend may call the API from a browser.
// CORS_ORIGIN can list several origins, comma separated.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Middleware
app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '100kb' }));

// Request logger (quiet during tests)
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ---- Public routes (no token needed) ----
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Department Academic Cloud API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// /login and /refresh are public; /me checks the token itself.
app.use('/api/auth', authRoutes);

// ---- Everything below needs a valid Supabase access token ----
app.use('/api', requireAuth);

app.use('/api/courses', courseRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/ai-search', aiSearchRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// Unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// Global error handler: log the details, send only a safe message.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  if (status >= 500) {
    console.error(`[API] ${req.method} ${req.originalUrl} failed:`, err.message);
  }
  let message = 'Internal server error';
  if (status < 500) {
    message = err.type === 'entity.parse.failed' ? 'Invalid JSON body' : err.expose ? err.message : 'Bad request';
  }
  res.status(status).json({ success: false, message });
});

export default app;

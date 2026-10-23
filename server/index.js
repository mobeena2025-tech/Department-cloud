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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.originalUrl}`);
  next();
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/ai-search', aiSearchRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Department Academic Cloud API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` DEPARTMENT ACADEMIC CLOUD — BACKEND SERVER ONLINE `);
  console.log(` Port: ${PORT} | Mode: Local/MongoDB Compatible     `);
  console.log(` API Endpoint: http://localhost:${PORT}/api/health `);
  console.log(`====================================================`);
});

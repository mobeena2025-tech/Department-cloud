import express from 'express';
import { searchAcademicContent } from '../services/assistant.js';
import { recordAuditLog } from '../lib/audit.js';
import { asyncHandler, requiredString } from '../lib/validate.js';

const router = express.Router();

// Academic Assistant search (keyword retrieval over the user's own courses).
router.post('/', asyncHandler(async (req, res) => {
  const query = requiredString(req.body?.query, 'query', { max: 300 });
  const result = await searchAcademicContent(req.user, query);

  recordAuditLog(req, {
    action: 'ASSISTANT_SEARCH',
    resource: query.slice(0, 120),
    details: `${result.sources.length} materials, ${result.assignments.length} assignments matched.`,
  });

  res.json({ success: true, ...result });
}));

export default router;

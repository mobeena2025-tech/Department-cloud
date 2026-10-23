import express from 'express';
import { searchDepartmentKnowledge } from '../services/aiService.js';
import { recordAuditLog } from '../data/store.js';

const router = express.Router();
// Mounted behind requireAuth; identity comes from req.user.

// Semantic search endpoint
router.post('/', (req, res) => {
  const { query } = req.body || {};

  if (typeof query !== 'string' || !query.trim() || query.length > 500) {
    return res.status(400).json({ success: false, message: 'Query is required' });
  }

  const result = searchDepartmentKnowledge(query);

  recordAuditLog({
    actorName: req.user.name,
    actorRole: req.user.role,
    actorEmail: req.user.email,
    action: 'SEMANTIC_AI_QUERY',
    resource: `Vector query: "${query.substring(0, 40)}${query.length > 40 ? '...' : ''}"`,
    status: 'SUCCESS',
    severity: 'INFO',
    details: `Retrieved ${result.sources.length} grounded department resources with top score ${result.sources[0]?.relevance || 90}%.`,
  });

  res.json({ success: true, ...result });
});

export default router;

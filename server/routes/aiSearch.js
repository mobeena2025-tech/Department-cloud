import express from 'express';
import { searchAcademicContent, ASSIGNMENT_WORDS } from '../services/assistant.js';
import { ragAnswer } from '../rag/search.js';
import { recordAuditLog } from '../lib/audit.js';
import { asyncHandler, requiredString } from '../lib/validate.js';

const router = express.Router();

// Academic Assistant.
//  1. Free RAG: searches INSIDE the course PDFs the user can access (local
//     embeddings + pgvector) and quotes the sentences that answer the question.
//  2. Keyword search over titles/topics/assignments: used for assignment
//     questions, and as the fallback when no PDF text is indexed yet.
router.post('/', asyncHandler(async (req, res) => {
  const query = requiredString(req.body?.query, 'query', { max: 300 });

  // Run both searches at the same time.
  const [keyword, rag] = await Promise.all([
    searchAcademicContent(req.user, query),
    ragAnswer(req.user, query).catch((err) => {
      console.error('[RAG] falling back to keyword search:', err.message);
      return null;
    }),
  ]);

  // "Show my upcoming assignments" is answered with the assignment list,
  // not with sentences from the notes.
  const assignmentQuestion = ASSIGNMENT_WORDS.test(query.toLowerCase()) && keyword.assignments.length > 0;

  let result;
  if (assignmentQuestion) {
    result = {
      query,
      method: rag ? 'rag-extractive' : 'keyword-search',
      found: true,
      answer: `You have ${keyword.assignments.length} assignment${keyword.assignments.length === 1 ? '' : 's'} in your courses, listed below.`,
      answerSentences: [],
      sources: [],
      assignments: keyword.assignments,
      relatedQuestions: keyword.relatedQuestions,
      timestamp: new Date().toISOString(),
    };
  } else if (!rag) {
    result = { ...keyword, method: 'keyword-search', found: keyword.sources.length > 0, answerSentences: [] };
  } else {
    const answer = rag.found
      ? rag.answer
      : keyword.assignments.length
        ? 'No passage in your course PDFs answers this, but matching assignments are listed below.'
        : "I couldn't find a clear answer in your course PDFs. The closest passages are shown below; try different words or a course code.";
    result = {
      query,
      method: 'rag-extractive',
      found: rag.found,
      answer,
      answerSentences: rag.answerSentences,
      sources: rag.sources,
      assignments: keyword.assignments,
      relatedQuestions: keyword.relatedQuestions,
      timestamp: new Date().toISOString(),
    };
  }

  recordAuditLog(req, {
    action: 'ASSISTANT_SEARCH',
    resource: query.slice(0, 120),
    details: `${result.method}: ${result.found ? 'answer found' : 'no clear answer'}, ${result.sources.length} sources, ${result.assignments.length} assignments.`,
  });

  res.json({ success: true, ...result });
}));

export default router;

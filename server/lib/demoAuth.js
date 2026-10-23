import { isUuid } from './courseLookup.js';

// TEMPORARY (Phases 1-2): reads the user id from the demo token so
// uploaded_by / faculty_id get filled in. This token can be forged;
// Phase 3 replaces it with verified Supabase Auth tokens.
export function getDemoUserId(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const match = token.match(/^demo_token_(.+)_\d+$/);
  return match && isUuid(match[1]) ? match[1] : null;
}

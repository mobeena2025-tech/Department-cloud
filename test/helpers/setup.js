// Loaded first by every test file. Points the server at a dummy Supabase
// project so nothing can reach the real one, then swaps the client for an
// in-memory fake (see fakeSupabase.js).
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'http://127.0.0.1:9'; // unreachable on purpose
process.env.SUPABASE_SECRET_KEY = 'fake-key-for-tests-only';

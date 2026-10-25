import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client. It uses the SECRET key, which bypasses Row
// Level Security, so it must never be exposed to the browser (nothing in
// src/ imports this file, and Vite only exposes VITE_* variables).
// SUPABASE_KEY is still accepted so older .env files keep working.
const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY;

if (!url || !secretKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env');
}
if (secretKey.startsWith('sb_publishable_')) {
  throw new Error('The server needs the Supabase SECRET key (sb_secret_...), not the publishable key');
}

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

const supabase = createClient(url, secretKey, clientOptions);

// A throwaway client for sign-in / refresh calls, so a user's session is
// never stored on the shared admin client above.
let authClientFactory = () => createClient(url, secretKey, clientOptions);
export function createAuthClient() {
  return authClientFactory();
}

/** Tests only: replace the sign-in client with a fake. */
export function setAuthClientFactoryForTests(factory) {
  authClientFactory = factory;
}

export default supabase;

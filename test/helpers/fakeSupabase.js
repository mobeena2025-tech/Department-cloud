import './setup.js';
import crypto from 'node:crypto';
import supabase, { setAuthClientFactoryForTests } from '../../server/supabase.js';
import app from '../../server/app.js';
import { clearAuthCache } from '../../server/lib/auth.js';
import { loginByEmail, loginByIp } from '../../server/lib/rateLimit.js';

// In-memory stand-in for the parts of the Supabase client the API uses.
// Rows are stored per table; joined data (e.g. materials.courses) is stored
// on the row itself, the same shape PostgREST returns.
export const db = {
  tables: {},
  tokens: {}, // access token -> user id
  signedUrls: [], // storage paths a signed URL was created for
  uploads: [], // storage paths uploaded
  removed: [], // storage paths removed
  authUsers: {}, // user id -> { email, password, app_metadata }
};

const getPath = (row, path) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), row);

class FakeQuery {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.op = 'select';
    this.payload = null;
    this.mode = 'many';
  }
  select() { return this; }
  order() { return this; }
  limit() { return this; }
  or() { return this; }
  ilike() { return this; }
  gte() { return this; }
  eq(col, val) { this.filters.push((r) => getPath(r, col) === val); return this; }
  in(col, vals) { this.filters.push((r) => vals.includes(getPath(r, col))); return this; }
  is(col, val) { this.filters.push((r) => getPath(r, col) === val); return this; }
  insert(p) { this.op = 'insert'; this.payload = p; return this; }
  upsert(p) { this.op = 'insert'; this.payload = p; return this; }
  update(p) { this.op = 'update'; this.payload = p; return this; }
  delete() { this.op = 'delete'; return this; }
  maybeSingle() { this.mode = 'maybe'; return this; }
  single() { this.mode = 'one'; return this; }
  then(resolve, reject) { return Promise.resolve().then(() => this.run()).then(resolve, reject); }

  run() {
    const rows = (db.tables[this.table] ||= []);
    let out;
    if (this.op === 'insert') {
      out = [].concat(this.payload).map((r) => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...r }));
      rows.push(...out);
    } else {
      out = rows.filter((r) => this.filters.every((f) => f(r)));
      if (this.op === 'update') out.forEach((r) => Object.assign(r, this.payload));
      if (this.op === 'delete') db.tables[this.table] = rows.filter((r) => !out.includes(r));
    }
    if (this.mode === 'maybe') return { data: out[0] ?? null, error: null };
    if (this.mode === 'one') {
      return out[0] ? { data: out[0], error: null } : { data: null, error: { message: 'no rows', code: 'PGRST116' } };
    }
    return { data: out, error: null };
  }
}

supabase.from = (table) => new FakeQuery(table);

// pgvector search stand-in: cosine similarity over stored passages, limited
// to the given courses (null = all), like public.match_material_chunks.
supabase.rpc = async (fn, args) => {
  if (fn !== 'match_material_chunks') return { data: null, error: { message: `unknown function ${fn}` } };
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const rows = (db.tables.material_chunks || [])
    .filter((c) => args.course_ids === null || args.course_ids.includes(c.course_id))
    .map((c) => ({
      id: c.id, material_id: c.material_id, course_id: c.course_id, page: c.page, content: c.content,
      similarity: dot(c.embedding, args.query_embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, args.match_count);
  return { data: rows, error: null };
};
supabase.auth.getUser = async (token) => {
  const id = db.tokens[token];
  if (!id) return { data: { user: null }, error: { message: 'invalid JWT' } };
  const u = db.authUsers[id];
  return { data: { user: { id, email: u?.email, app_metadata: { ...(u?.app_metadata || {}) } } }, error: null };
};
supabase.auth.admin.updateUserById = async (id, attrs) => {
  const u = db.authUsers[id];
  if (!u) return { data: { user: null }, error: { message: 'User not found' } };
  // Like Supabase: a new password ends every session of the account.
  if (attrs.password) {
    u.password = attrs.password;
    for (const [t, uid] of Object.entries(db.tokens)) if (uid === id) delete db.tokens[t];
  }
  if (attrs.app_metadata) u.app_metadata = { ...u.app_metadata, ...attrs.app_metadata };
  return { data: { user: { id, email: u.email, app_metadata: u.app_metadata } }, error: null };
};
// Sign-in checks the passwords stored in db.authUsers.
setAuthClientFactoryForTests(() => ({
  auth: {
    signInWithPassword: async ({ email, password }) => {
      const entry = Object.entries(db.authUsers).find(([, u]) => u.email === email && u.password === password);
      if (!entry) return { data: { user: null, session: null }, error: { status: 400, message: 'Invalid login credentials' } };
      const [id, u] = entry;
      const token = `tok-${crypto.randomUUID()}`;
      db.tokens[token] = id;
      return {
        data: {
          user: { id, email: u.email, app_metadata: { ...u.app_metadata } },
          session: { access_token: token, refresh_token: `ref-${token}`, expires_at: Math.floor(Date.now() / 1000) + 3600 },
        },
        error: null,
      };
    },
    refreshSession: async () => ({ data: { session: null, user: null }, error: { status: 400, message: 'Invalid refresh token' } }),
  },
}));

const fakeBucket = {
  createSignedUrl: async (path) => {
    db.signedUrls.push(path);
    return { data: { signedUrl: `https://signed.example/${path}?token=t` }, error: null };
  },
  upload: async (path) => {
    db.uploads.push(path);
    return { data: { path }, error: null };
  },
  remove: async (paths) => {
    db.removed.push(...paths);
    return { data: null, error: null };
  },
};
Object.defineProperty(supabase, 'storage', { value: { from: () => fakeBucket }, configurable: true });

// ---------------------------------------------------------------- fixtures

export const ids = {
  admin: crypto.randomUUID(),
  facultyA: crypto.randomUUID(), // teaches CS202
  facultyB: crypto.randomUUID(), // teaches CS301
  studentIn: crypto.randomUUID(), // enrolled in CS202
  studentOut: crypto.randomUUID(), // enrolled in CS301 only
  noProfile: crypto.randomUUID(), // valid login, no profile row
  cs202: crypto.randomUUID(),
  cs301: crypto.randomUUID(),
  material: crypto.randomUUID(),
};

export const tokens = {
  admin: 'tok-admin',
  facultyA: 'tok-faculty-a',
  facultyB: 'tok-faculty-b',
  studentIn: 'tok-student-in',
  studentOut: 'tok-student-out',
  noProfile: 'tok-no-profile',
};

export function resetDb() {
  clearAuthCache();
  loginByEmail.clear();
  loginByIp.clear();
  db.signedUrls.length = 0;
  db.uploads.length = 0;
  db.removed.length = 0;
  db.tokens = Object.fromEntries(Object.entries(tokens).map(([k, t]) => [t, ids[k]]));

  const profile = (id, role, name) => ({ id, role, full_name: name, email: `${name.toLowerCase()}@test.local` });
  const course = (id, code) => ({ id, code, name: `${code} course`, semester: 6, section: 'A', credits: 4 });
  db.tables = {
    profiles: [
      profile(ids.admin, 'admin', 'Admin'),
      profile(ids.facultyA, 'faculty', 'FacultyA'),
      profile(ids.facultyB, 'faculty', 'FacultyB'),
      profile(ids.studentIn, 'student', 'StudentIn'),
      profile(ids.studentOut, 'student', 'StudentOut'),
    ],
    courses: [course(ids.cs202, 'CS202'), course(ids.cs301, 'CS301')],
    course_faculty: [
      { course_id: ids.cs202, faculty_id: ids.facultyA },
      { course_id: ids.cs301, faculty_id: ids.facultyB },
    ],
    enrollments: [
      { course_id: ids.cs202, student_id: ids.studentIn },
      { course_id: ids.cs301, student_id: ids.studentOut },
    ],
    materials: [
      {
        id: ids.material,
        course_id: ids.cs202,
        title: 'Normalization notes',
        unit: '3',
        file_type: 'PDF',
        storage_path: `courses/${ids.cs202}/normalization.pdf`,
        file_size: 1234,
        uploaded_by: ids.facultyA,
        created_at: new Date().toISOString(),
        courses: { id: ids.cs202, code: 'CS202', name: 'CS202 course', semester: 6, section: 'A' },
        uploader: { full_name: 'FacultyA' },
      },
    ],
    assignments: [],
    audit_logs: [],
    material_chunks: [],
  };
  // Every fixture account signs in with this password.
  db.authUsers = Object.fromEntries(
    db.tables.profiles.map((p) => [p.id, { email: p.email, password: 'Password123', app_metadata: {} }])
  );
}

// A real (tiny) PDF with one text line per page, for PDF-reading tests.
export function makePdf(pageTexts) {
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', null];
  const kids = [];
  const fontId = 3;
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  for (const text of pageTexts) {
    // Wrap at ~70 characters so every line stays inside the page.
    const lines = (text.replace(/[()\\]/g, '').match(/.{1,70}(\s|$)/g) || []).map((l) => l.trim());
    const stream = lines.length
      ? `BT /F1 11 Tf 40 780 Td ${lines.map((l, i) => `${i ? '0 -14 Td ' : ''}(${l} ) Tj`).join(' ')} ET`
      : '';
    objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const contentId = objs.length;
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`);
    kids.push(`${objs.length} 0 R`);
  }
  objs[1] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`;
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

// Stand-in for the embedding model: hashed bag of words, normalised.
// Texts sharing words get high similarity, like a (very) simple model.
export function fakeEmbed(texts) {
  return texts.map((t) => {
    const v = new Array(384).fill(0);
    const words = t
      .toLowerCase()
      .replace(/^represent this sentence for searching relevant passages: /, '')
      .match(/[a-z0-9]+/g) || [];
    for (const w of words) {
      if (w.length < 3) continue;
      let h = 0;
      for (const ch of w) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      v[h % 384] += 1;
    }
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
    return v.map((x) => x / norm);
  });
}

// ---------------------------------------------------------------- HTTP

let server;
let base;

export async function startServer() {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}/api`;
}

export async function stopServer() {
  await new Promise((resolve) => server.close(resolve));
}

export async function request(method, path, { token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(base + path, {
    method,
    headers,
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  let json = {};
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, body: json };
}

export function pdfForm(fields, file = { name: 'notes.pdf', type: 'application/pdf', content: '%PDF-1.4\n%%EOF\n' }) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  if (file) form.append('file', new Blob([file.content], { type: file.type }), file.name);
  return form;
}

import './setup.js';
import crypto from 'node:crypto';
import supabase from '../../server/supabase.js';
import app from '../../server/app.js';
import { clearAuthCache } from '../../server/lib/auth.js';

// In-memory stand-in for the parts of the Supabase client the API uses.
// Rows are stored per table; joined data (e.g. materials.courses) is stored
// on the row itself, the same shape PostgREST returns.
export const db = {
  tables: {},
  tokens: {}, // access token -> user id
  signedUrls: [], // storage paths a signed URL was created for
  uploads: [], // storage paths uploaded
  removed: [], // storage paths removed
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
supabase.auth.getUser = async (token) =>
  db.tokens[token]
    ? { data: { user: { id: db.tokens[token] } }, error: null }
    : { data: { user: null }, error: { message: 'invalid JWT' } };

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
  };
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

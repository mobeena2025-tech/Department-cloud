// Import real accounts from a CSV file kept in the git-ignored private/ folder.
//
//   npm run import-people -- private/people.csv --dry-run   (check only, changes nothing)
//   npm run import-people -- private/people.csv             (create / update accounts)
//   add --reset-passwords to give EXISTING accounts a new password too
//
// CSV columns (header row required, extra columns ignored):
//   name,email,role,roll_number,semester,section,courses
//   role    = admin | faculty | student
//   courses = course codes separated by ; (students: enrolled in; faculty: teaches)
//
// New accounts get their own random password. Passwords are written ONLY to a
// dated file, private/people-credentials-<date>.csv, for you to share
// privately; they are never printed to the screen.
//
// The import only ADDS course links; removing someone from a course is done in
// the app (admin -> Courses -> Manage People).

import fs from 'node:fs';
import path from 'node:path';
import supabase from '../supabase.js';
import { generateTemporaryPassword } from '../lib/password.js';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
const resetPasswords = args.includes('--reset-passwords');

const ROLES = ['admin', 'faculty', 'student'];
const EMAIL = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

function die(msg) {
  console.error(`\nImport stopped: ${msg}`);
  process.exit(1);
}

// Small CSV parser: commas, double-quoted fields, "" escapes, CRLF/LF.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

const makePassword = () => generateTemporaryPassword();

const csvCell = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

async function main() {
  if (!file) die('give the CSV path, e.g. npm run import-people -- private/people.csv --dry-run');
  const full = path.resolve(file);
  if (!fs.existsSync(full)) die(`file not found: ${file}`);
  const rel = path.relative(process.cwd(), full).replace(/\\/g, '/');
  if (!rel.startsWith('private/')) die('keep the CSV inside the private/ folder so it can never be committed');

  const [header, ...lines] = parseCsv(fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, ''));
  if (!header) die('the file is empty');
  const col = Object.fromEntries(header.map((h, i) => [h.trim().toLowerCase(), i]));
  for (const needed of ['name', 'email', 'role']) {
    if (!(needed in col)) die(`missing column "${needed}" (header must include: name,email,role)`);
  }
  const get = (r, k) => (k in col ? (r[col[k]] ?? '').trim() : '');

  const { data: courses, error: cErr } = await supabase.from('courses').select('id, code');
  if (cErr) die(`could not read courses (${cErr.message})`);
  const courseId = Object.fromEntries(courses.map((c) => [c.code.toUpperCase(), c.id]));

  // ---- validate every row before changing anything
  const people = [];
  const problems = [];
  const seen = new Set();
  lines.forEach((r, i) => {
    const line = i + 2; // spreadsheet row number
    const p = {
      line,
      name: get(r, 'name'),
      email: get(r, 'email').toLowerCase(),
      role: get(r, 'role').toLowerCase(),
      roll: get(r, 'roll_number') || null,
      semester: get(r, 'semester') ? Number(get(r, 'semester')) : null,
      section: get(r, 'section') || null,
      courses: get(r, 'courses').split(/[;|]/).map((c) => c.trim().toUpperCase()).filter(Boolean),
    };
    if (!p.name) problems.push(`row ${line}: name is empty`);
    if (!EMAIL.test(p.email)) problems.push(`row ${line}: "${p.email}" is not a valid email`);
    if (!ROLES.includes(p.role)) problems.push(`row ${line}: role must be admin, faculty or student`);
    if (p.semester !== null && !(Number.isInteger(p.semester) && p.semester >= 1 && p.semester <= 8)) {
      problems.push(`row ${line}: semester must be 1-8`);
    }
    if (seen.has(p.email)) problems.push(`row ${line}: ${p.email} appears more than once`);
    seen.add(p.email);
    const unknown = p.courses.filter((c) => !courseId[c]);
    if (unknown.length) problems.push(`row ${line}: unknown course code(s) ${unknown.join(', ')} (known: ${Object.keys(courseId).sort().join(', ')})`);
    if (p.role === 'admin' && p.courses.length) problems.push(`row ${line}: admins see every course; leave courses empty`);
    people.push(p);
  });

  const counts = ROLES.map((r) => `${people.filter((p) => p.role === r).length} ${r}`).join(', ');
  console.log(`Read ${people.length} people (${counts}) from ${rel}`);
  if (problems.length) {
    console.log(`\n${problems.length} problem(s) found, nothing was changed:`);
    problems.forEach((m) => console.log('  - ' + m));
    process.exit(1);
  }

  // Existing accounts, by email
  const existing = new Map();
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) die(`could not list accounts (${error.message})`);
    data.users.forEach((u) => existing.set(u.email.toLowerCase(), u));
    if (data.users.length < 1000) break;
  }
  const toCreate = people.filter((p) => !existing.has(p.email));
  console.log(`${toCreate.length} new account(s), ${people.length - toCreate.length} already exist (will be updated).`);

  if (dryRun) {
    console.log('\nDry run: everything checks out. Nothing was changed.');
    console.log('Run again without --dry-run to import.');
    return;
  }

  // ---- create / update
  const credentials = [];
  for (const p of people) {
    let user = existing.get(p.email);
    let password = null;
    if (!user) {
      password = makePassword();
      const { data, error } = await supabase.auth.admin.createUser({
        email: p.email,
        password,
        email_confirm: true,
        app_metadata: { must_change_password: true }, // asked to choose their own after sign-in
      });
      if (error) die(`could not create ${p.email} (${error.message}); rows before this one were imported`);
      user = data.user;
    } else if (resetPasswords) {
      password = makePassword();
      const { error } = await supabase.auth.admin.updateUserById(user.id, { password, app_metadata: { must_change_password: true } });
      if (error) die(`could not reset password for ${p.email} (${error.message})`);
    }

    const isStudent = p.role === 'student';
    const { error: pErr } = await supabase.from('profiles').upsert({
      id: user.id,
      email: p.email,
      full_name: p.name,
      role: p.role,
      roll_number: isStudent ? p.roll : null,
      semester: isStudent ? p.semester : null,
      section: isStudent ? p.section : null,
    });
    if (pErr) die(`could not save profile for ${p.email} (${pErr.message})`);

    if (p.courses.length) {
      const table = isStudent ? 'enrollments' : 'course_faculty';
      const key = isStudent ? 'student_id' : 'faculty_id';
      const { error } = await supabase
        .from(table)
        .upsert(p.courses.map((c) => ({ course_id: courseId[c], [key]: user.id })), { ignoreDuplicates: true });
      if (error) die(`could not set courses for ${p.email} (${error.message})`);
    }

    credentials.push({ ...p, password });
    console.log(`  ${existing.has(p.email) ? 'updated' : 'created'}  ${p.role.padEnd(7)} ${p.email}${p.courses.length ? '  -> ' + p.courses.join(', ') : ''}`);
  }

  // ---- write NEW passwords to a dated file in the private folder only.
  // Each run gets its own file, so earlier passwords are never overwritten.
  console.log(`\nDone. ${toCreate.length} created, ${people.length - toCreate.length} updated.`);
  const withPassword = credentials.filter((c) => c.password);
  if (withPassword.length) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const out = `private/people-credentials-${stamp}.csv`;
    const rows = ['name,email,role,password', ...withPassword.map((c) => [c.name, c.email, c.role, c.password].map(csvCell).join(','))];
    fs.writeFileSync(path.resolve(out), rows.join('\n') + '\n');
    console.log(`${withPassword.length} password(s) written to ${out} (git-ignored). Share each one privately.`);
  } else {
    console.log('No new passwords (existing accounts keep theirs; use --reset-passwords to change them).');
  }
}

main().catch((err) => die(err.message));

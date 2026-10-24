// Creates the demo accounts, assigns faculty to courses and enrolls students.
// Run with:  npm run seed
// Safe to run again: existing accounts are updated, and every account gets
// a NEW shared password, written to seed-credentials.txt (never committed).

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import supabase from '../supabase.js';

const PEOPLE = [
  { email: 'admin@dac.test',  full_name: 'Prof. Demo Head', role: 'admin' },
  { email: 'faculty.a@dac.test', full_name: 'Dr. Demo Faculty A',     role: 'faculty' },
  { email: 'faculty.b@dac.test', full_name: 'Dr. Demo Faculty B',   role: 'faculty' },
  { email: 'student.a@dac.test',  full_name: 'Demo Student A', role: 'student', roll_number: 'DEMO-S001', semester: 6, section: 'A', cgpa: 8.7 },
  { email: 'student.b@dac.test',   full_name: 'Demo Student B',   role: 'student', roll_number: 'DEMO-S002', semester: 6, section: 'A', cgpa: 9.1 },
  { email: 'student.c@dac.test',  full_name: 'Demo Student C',  role: 'student', roll_number: 'DEMO-S003', semester: 6, section: 'A', cgpa: 7.95 },
];

// Who teaches what.
const TEACHING = {
  'faculty.a@dac.test': ['CS202', 'AI204'],
  'faculty.b@dac.test': ['CS301', 'AI302'],
};

// Who is enrolled where. Student C is deliberately NOT in CS202, so they are the
// "unenrolled student" in the demo script.
const ENROLLED = {
  'student.a@dac.test': ['CS202', 'AI204', 'CS301'],
  'student.b@dac.test':  ['CS202', 'AI302'],
  'student.c@dac.test': ['CS301'],
};

function fail(message, error) {
  console.error(`Seed failed: ${message}${error ? ` (${error.message})` : ''}`);
  process.exit(1);
}

async function findAuthUsersByEmail() {
  const byEmail = new Map();
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) fail('could not list auth users', error);
    for (const u of data.users) byEmail.set(u.email.toLowerCase(), u);
    if (data.users.length < 1000) break;
  }
  return byEmail;
}

async function main() {
  const password = crypto.randomBytes(12).toString('base64url'); // 16 chars
  const existing = await findAuthUsersByEmail();
  const ids = {};

  for (const person of PEOPLE) {
    let user = existing.get(person.email);
    if (user) {
      const { error } = await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
      if (error) fail(`could not update ${person.email}`, error);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: person.email,
        password,
        email_confirm: true,
      });
      if (error) fail(`could not create ${person.email}`, error);
      user = data.user;
    }
    ids[person.email] = user.id;

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      email: person.email,
      full_name: person.full_name,
      role: person.role,
      roll_number: person.roll_number ?? null,
      semester: person.semester ?? null,
      section: person.section ?? null,
      cgpa: person.cgpa ?? null,
    });
    if (profileError) fail(`could not save profile for ${person.email}`, profileError);
    console.log(`  ${person.role.padEnd(8)} ${person.email}`);
  }

  const { data: courses, error: coursesError } = await supabase.from('courses').select('id, code');
  if (coursesError) fail('could not read courses', coursesError);
  const courseId = Object.fromEntries(courses.map((c) => [c.code, c.id]));

  const pairs = (map, key) =>
    Object.entries(map).flatMap(([email, codes]) =>
      codes
        .filter((code) => courseId[code])
        .map((code) => ({ course_id: courseId[code], [key]: ids[email] }))
    );

  const { error: cfError } = await supabase
    .from('course_faculty')
    .upsert(pairs(TEACHING, 'faculty_id'), { ignoreDuplicates: true });
  if (cfError) fail('could not assign faculty', cfError);

  const { error: enError } = await supabase
    .from('enrollments')
    .upsert(pairs(ENROLLED, 'student_id'), { ignoreDuplicates: true });
  if (enError) fail('could not enroll students', enError);

  const file = path.resolve('seed-credentials.txt');
  const lines = [
    'Demo accounts for Department Academic Cloud (do not commit this file)',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Password for every account: ${password}`,
    '',
    ...PEOPLE.map((p) => `${p.role.padEnd(8)} ${p.email.padEnd(18)} ${p.full_name}`),
    '',
    'Teaching:  ' + Object.entries(TEACHING).map(([e, c]) => `${e} -> ${c.join(', ')}`).join(' | '),
    'Enrolled:  ' + Object.entries(ENROLLED).map(([e, c]) => `${e} -> ${c.join(', ')}`).join(' | '),
    '',
  ];
  fs.writeFileSync(file, lines.join('\n'));

  console.log(`\nDone. Faculty assigned, students enrolled.`);
  console.log(`Logins and the new password are in: ${file}`);
}

main().catch((err) => fail('unexpected error', err));

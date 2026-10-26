// Give students their roll number (without hyphens) as a first-time password.
// They must choose their own password the first time they sign in.
//
//   npm run roll-passwords -- --dry-run   (shows counts, changes nothing)
//   npm run roll-passwords                (sets the passwords)
//
// Students who already chose their own password (a successful CHANGE_PASSWORD
// in the audit log) are skipped. No passwords are printed.

import supabase from '../supabase.js';
import { rollNumberPassword } from '../lib/password.js';

const dryRun = process.argv.includes('--dry-run');
const MIN_LENGTH = 6; // Supabase Auth minimum

function must({ data, error }, what) {
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

const students = must(
  await supabase.from('profiles').select('id, email, roll_number').eq('role', 'student'),
  'students'
);
const changed = new Set(
  must(
    await supabase.from('audit_logs').select('actor_id, status').eq('action', 'CHANGE_PASSWORD'),
    'audit log'
  )
    .filter((r) => r.status !== 'FAILURE')
    .map((r) => r.actor_id)
);

const todo = [];
const skipped = { changedOwn: 0, noRollNo: 0, tooShort: 0 };
const seen = new Map();
for (const s of students) {
  if (changed.has(s.id)) { skipped.changedOwn++; continue; }
  const pw = rollNumberPassword(s.roll_number);
  if (!pw) { skipped.noRollNo++; continue; }
  if (pw.length < MIN_LENGTH) { skipped.tooShort++; continue; }
  seen.set(pw, (seen.get(pw) || 0) + 1);
  todo.push({ ...s, pw });
}
const duplicates = [...seen.values()].filter((n) => n > 1).length;

console.log(`Students: ${students.length}`);
console.log(`Will get roll-number passwords: ${todo.length}`);
console.log(`Skipped: ${skipped.changedOwn} already chose their own, ${skipped.noRollNo} without roll number, ${skipped.tooShort} roll number too short`);
if (duplicates) console.log(`WARNING: ${duplicates} roll number(s) are shared by more than one student`);

if (dryRun) {
  console.log('Dry run: nothing changed.');
  process.exit(0);
}

let ok = 0;
for (const s of todo) {
  const { error } = await supabase.auth.admin.updateUserById(s.id, {
    password: s.pw,
    app_metadata: { must_change_password: true },
  });
  if (error) console.error(`Failed for ${s.email}: ${error.message}`);
  else ok++;
}
await supabase.from('audit_logs').insert({
  action: 'RESET_PASSWORD',
  actor_role: 'admin',
  actor_name: 'roll-passwords script',
  resource: `${ok} student accounts`,
  status: 'SUCCESS',
  severity: 'WARNING',
  details: 'Roll-number first-time passwords set; students must change them at first sign-in.',
});
console.log(`Done: ${ok} of ${todo.length} updated. Each of these students must choose a new password at first sign-in.`);

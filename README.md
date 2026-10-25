# Department Academic Cloud

A department portal where faculty upload course PDFs, enrolled students find and
open them, and anyone not enrolled is denied. It also has assignments with PDF
submissions and grading, announcements, an audit log, admin analytics and a
simple search assistant.

**Stack:** React 18 + Vite + Tailwind (frontend) · Express (backend, `server/`) ·
Supabase Postgres, Auth and Storage. Frontend and backend share one `package.json`;
Vite proxies `/api` to the Express server on port 5000.

---

## How it works (in one minute)

- **The browser never talks to Supabase.** Every request goes to the Express API,
  which uses the server-only **secret key**.
- **Sign-in** uses Supabase Auth (email + password) via `POST /api/auth/login`.
  The browser keeps the access token and sends it as `Authorization: Bearer …`.
- **Every API route needs a valid token** except `GET /api/health` and
  `POST /api/auth/login` / `refresh`. The server checks the token with Supabase and
  reads the user's role from the `profiles` table. Who is uploading, grading or
  posting is always taken from the token, never from the request body.
- **Course access:**

  | Role | Sees | Can upload / edit / delete / grade |
  |---|---|---|
  | `admin` (HOD) | all courses | everything; only admin creates courses and accounts |
  | `faculty` | courses they teach (`course_faculty`) | only in courses they teach |
  | `student` | courses they're enrolled in (`enrollments`) | submit their own work |

- **Files** are stored in a **private** Supabase Storage bucket (`academic-materials`).
  Opening a file asks the API, which checks access **first** and only then returns a
  link that expires after one hour. Denied attempts are written to the audit log.
- **Database lock-down:** Row Level Security is on for every table with no policies,
  and the public (anon) role has no privileges, so the publishable key can't read
  or change anything.

---

## Setup

### 1. Requirements

- Node.js 20 or newer (tested with 22) and npm
- A free Supabase account: <https://supabase.com>

### 2. Install

```bash
npm ci
```

### 3. Create the database

1. In Supabase, create a **new project** (any name; pick the region nearest to you).
2. Open **SQL Editor → New query**, paste all of [`supabase/schema.sql`](supabase/schema.sql), click **Run**.
3. New query again, paste [`supabase/seed.sql`](supabase/seed.sql), click **Run**.
   This adds 4 sample courses and 3 sample assignments.
4. Recommended: **Authentication → Sign In / Providers → Email** → turn off
   **Allow new users to sign up**. (Accounts are created by the seed script or by an
   admin. A self-signed-up account has no role and the API refuses it anyway.)

> `supabase/migrations/000–005` are the same changes applied step by step to the
> original project. You don't need them for a new project.

### 4. Environment variables

Copy `.env.example` to `.env` and fill it in:

| Variable | Where to find it | Notes |
|---|---|---|
| `SUPABASE_URL` | Project Settings → Data API → Project URL | `https://<ref>.supabase.co` |
| `SUPABASE_SECRET_KEY` | Project Settings → API Keys → **Secret keys** | starts with `sb_secret_`. **Server only, never share it.** The server refuses to start with a publishable key. (The older name `SUPABASE_KEY` also works.) |
| `API_PORT` | – | default `5000` (Vite proxies `/api` here) |
| `CORS_ORIGIN` | – | default `http://localhost:3000` |

`.env` is git-ignored. Nothing in `src/` reads these variables, so no key ends up
in the browser bundle.

### 5. Create the demo accounts

```bash
npm run seed
```

This creates 1 admin, 2 faculty and 3 students, assigns faculty to courses and
enrolls the students. It picks a **random password** for all of them and writes the
logins to `seed-credentials.txt` (git-ignored). Running it again sets a new password.

| Email | Role | Courses |
|---|---|---|
| `admin@dac.test` | admin | all |
| `faculty.a@dac.test` | faculty | teaches CS202, AI204 |
| `faculty.b@dac.test` | faculty | teaches CS301, AI302 |
| `student.a@dac.test` | student | CS202, AI204, CS301 |
| `student.b@dac.test` | student | CS202, AI302 |
| `student.c@dac.test` | student | CS301 only (the "not enrolled" student) |

### 6. Run

```bash
npm run dev
```

Open <http://localhost:3000>. (`npm run dev` starts both the API on 5000 and Vite on 3000.)

---

## Demo script

Use the password from `seed-credentials.txt`.

1. **Faculty uploads.** Sign in as `faculty.a@dac.test`. Go to **Upload Material**.
   The course list only shows CS202 and AI204. Choose a PDF (max 10 MB), pick
   **CS202**, enter a title, click **Publish to Department Cloud**. The success
   banner shows the storage path `courses/<course-id>/…`. Sign out (avatar → Sign Out).
2. **Enrolled student opens it.** Sign in as `student.a@dac.test`. Open **Courses →
   CS202** (or go to `/courses/CS202`). The new file is listed under its unit. Click it,
   then **Open / Download**: the PDF opens in a new tab through a short-lived link.
   Sign out.
3. **Unenrolled student is denied.** Sign in as `student.c@dac.test`. CS202 is not in their
   course list, and going to `/courses/CS202` shows *"Course unavailable — You are not
   enrolled in or assigned to this course."* The API refuses the file itself with 403
   before any link is created. Sign out.
4. **Admin sees the denial.** Sign in as `admin@dac.test` → **Activity & Audit**: Student C's
   attempt appears as `OPEN_MATERIAL` / `DENIED`. The **Dashboard** and the analytics page
   (`/admin/analytics`) show live counts from the database.

Optional extras: as Student A, submit a PDF for *Normalization worksheet* under
**Assignments**; as Faculty A, grade it under **Submissions** (the grading screen opens
their PDF; it is at `/faculty/submissions`, linked from **Assignments**); post a course notice under **Announcements**; ask the **Assistant**
"Find DBMS unit 3 material".

### Managing who teaches and who is enrolled

Sign in as admin → **Courses** → **Manage People** on any course card:

- **Teaching Faculty:** choose a faculty account and click **Assign**, or click the bin
  icon to remove. Assigned faculty can upload, post notices, create assignments and grade
  in that course.
- **Enrolled Students:** search, tick one or more students and click **Enroll selected**,
  or click the bin icon to remove. Only enrolled students can see the course and open its
  files. Changes apply immediately.
- **Add Department Course** also lets you pick the faculty in-charge when creating a course.

New accounts are created under **Users & Roles**; then enroll them here.

### Importing real accounts from a spreadsheet

For a whole class at once, use a CSV file in the **`private/`** folder (git-ignored, so
real names and emails can never be committed). See [`people.example.csv`](people.example.csv)
for the format:

```
name,email,role,roll_number,semester,section,courses
```

`role` is `admin`, `faculty` or `student`; `courses` is a list of course codes separated
by `;` (students are enrolled in them, faculty teach them).

```bash
npm run import-people -- private/people.csv --dry-run
```
```bash
npm run import-people -- private/people.csv
```

- `--dry-run` checks every row (emails, roles, duplicates, course codes) and changes nothing.
- New accounts get their own random password, written only to
  `private/people-credentials-<date>.csv`. Share each password privately.
- Running it again updates existing people and adds courses; it never duplicates accounts
  or changes their passwords (add `--reset-passwords` to issue new ones).
- Only add people who have agreed to have an account; it is their personal data.

---

## Academic Assistant (free RAG)

The assistant answers questions from **inside the course PDFs**, with no paid AI service
and no API key:

1. **Indexing:** when a PDF is uploaded, the server extracts its text page by page
   (`unpdf`), splits it into ~800-character passages, and turns each passage into 384
   numbers (an *embedding*) with the open **bge-small-en-v1.5** model, run locally by
   `@huggingface/transformers`. Passages are stored in `material_chunks` (pgvector).
2. **Retrieval:** a question is embedded the same way; `match_material_chunks` finds the
   closest passages **only within courses the user can access**, and exact words from the
   question add a small bonus (hybrid search).
3. **Answer:** the sentences of those passages are ranked against the question and the
   best 1-3 are shown, quoted, each with a citation to its PDF and page. If nothing is
   close enough it says so instead of guessing. Nothing is generated.

Setup: run [`supabase/migrations/006_rag_passages.sql`](supabase/migrations/006_rag_passages.sql)
(already in `schema.sql`), then index existing PDFs once:

```bash
npm run index-materials
```

New uploads are indexed automatically in the background. Faculty see the status on
**My Materials** (*Searchable by Assistant*, *Indexing…*, *Scanned PDF: no searchable
text*). The model (~34 MB) downloads once into `.models-cache/` (git-ignored); Render
downloads it during the build. Measured: ~0.3 s per question and ~7 s to index a
30-page PDF on a laptop, peak memory ~280 MB; expect a few seconds per question on
Render's free plan. Until something is indexed, the assistant falls back to keyword
search over titles and topics.

---

## Putting it online (Render, free)

In production one Node service runs the API **and** serves the built React app, so the
whole site is one address. [`render.yaml`](render.yaml) describes it.

1. Sign in at <https://render.com> with GitHub.
2. **New → Blueprint**, pick this repository, click **Apply**.
3. When asked, enter `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (same values as your `.env`).
4. Wait for the first build (a few minutes). The site is at `https://<service-name>.onrender.com`.
5. In Supabase → **Authentication → Rate Limits**, raise *sign-ups and sign-ins* and
   *token refreshes*: all sign-ins come from the server's address, so the defaults are too
   low for a whole class.

Every push to `main` redeploys automatically. On the free plan the service sleeps after
~15 minutes without visitors; the next visit takes up to a minute to wake it.

Locally you can try the production build with:

```bash
npm run build
```
```bash
npm start
```
(with `NODE_ENV=production` set; the site is then on port 5000).

Sign-in is protected against guessing: 5 wrong passwords lock that account for
15 minutes, and 30 failures from one network address block that address for 15 minutes.
Correct sign-ins never count.

### Passwords

- **Change password:** anyone signed in opens the menu at the top right and chooses
  **Change Password** (current password, then a new one: 8+ characters with a letter
  and a number). Their other devices are signed out.
- **Temporary passwords:** accounts made by the admin or the importer, and accounts
  that were reset, show a yellow reminder until the person picks their own password.
- **Forgot password:** there is no email reset. The admin opens **Users & Roles** and
  clicks **Reset password** next to the person. The new temporary password is shown
  once; send it to them privately. Resets are recorded in the audit log (without the
  password).

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | API (port 5000) + Vite dev server (port 3000) |
| `npm start` | production server (API + built pages); used by Render |
| `npm run build` | production build of the frontend into `dist/` |
| `npm test` | server tests (Node's built-in test runner) |
| `npm run lint` | ESLint (0 errors; remaining warnings are unused imports in older pages) |
| `npm run seed` | create/refresh demo accounts, teaching assignments and enrollments |
| `npm run index-materials` | make existing PDFs searchable by the assistant (`-- --all` to redo all) |

### Tests

`test/` covers the highest-risk server paths:

- **auth** — every protected route returns 401 without a token; forged/old demo
  tokens are rejected; a login without a profile gets 403; admin-only routes refuse
  other roles; the role can't be set from the request.
- **material access control** — enrolled students get a signed URL; unenrolled
  students and other faculty get 403 **and no signed URL is created**; the denial is
  audit-logged; lists only show accessible courses; only the course's faculty can
  edit/delete; delete removes the storage object.
- **upload validation** — MIME type **and** `.pdf` extension **and** `%PDF-` bytes
  required; >10 MB → 413; the course is checked before anything is uploaded (no
  orphaned files); uploads go to `courses/<course-id>/…` and record the real uploader.

The tests replace the Supabase client with an in-memory fake, so they need no
network and never touch your project. They test the API's own checks, not
Supabase's Row Level Security.

---

## Project layout

```
server/
  app.js              Express app: CORS, public routes, auth gate, routes, error handler
  index.js            starts the server
  supabase.js         server-only Supabase client (secret key)
  lib/                auth middleware, course access rules, validation, PDF upload,
                      audit log, response shapes
  routes/             auth, courses (+ people/enrollment), materials, assignments, submissions,
                      announcements, users, audit-logs, analytics, ai-search
  rag/                free RAG: PDF text, passages, local embeddings, indexer, search
  services/           keyword assistant (fallback, assignments), classifier (file-name suggestions)
  scripts/seed.js     demo accounts + enrollments
src/                  React app (pages per role, components, api client)
supabase/
  schema.sql          full database: tables, RLS lock-down, private bucket
  seed.sql            sample courses and assignments
  migrations/         step-by-step history used on the original project
test/                 server tests
```

---

## Known limitations

- **The assistant quotes, it doesn't write.** The free version returns the most relevant
  sentences from your PDFs with page citations; it cannot rephrase, summarise across
  documents or answer what the notes don't contain. Scanned (image-only) PDFs have no
  text to search (no OCR). Writing full answers would need a paid model (e.g. Claude),
  which can be added on top of the same retrieval later.
- **Smart Upload suggestions** come from simple keywords in the file name, not from the
  PDF; faculty should check them.
- **Enrollment is per student and per course.** There is no bulk import (e.g. from a
  CSV) or "enroll the whole semester" button; the Manage People window lets you tick
  several students at once.
- **Analytics activity numbers** (file opens, sign-ins, searches) start from when the
  audit log was added; there is no older history.
- `npm run lint` reports warnings (mostly unused icon imports) in pages that were not
  otherwise changed.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `getaddrinfo ENOTFOUND <ref>.supabase.co` | Wrong `SUPABASE_URL`, or the project is paused (free projects pause after a week idle; click **Restore** in the dashboard). |
| Server says it needs the SECRET key | `.env` has the publishable key; use the `sb_secret_…` key. |
| Every page sends you back to sign-in | Session expired or the account has no `profiles` row; sign in again / run `npm run seed`. |
| `EADDRINUSE :::5000` | Something else uses port 5000 (often another `npm run dev` you left open). Stop it with Ctrl + C, or set `API_PORT` in `.env`; the Vite proxy follows it. |
| A new feature is missing | The API doesn't reload by itself. Stop `npm run dev` (Ctrl + C) and start it again. |

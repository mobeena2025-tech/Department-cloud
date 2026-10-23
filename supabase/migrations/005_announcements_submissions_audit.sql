-- 005: announcements, assignment submissions + grading, audit log, and two
-- staff fields on profiles. Replaces the last in-memory mock data.
-- Safe to run more than once. Run in Supabase Dashboard -> SQL Editor.

alter table public.profiles add column if not exists emp_id      text;
alter table public.profiles add column if not exists designation text;

-- Announcements: course_id null = department-wide notice.
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid references public.courses(id) on delete cascade,
  title       text not null,
  content     text not null,
  category    text not null default 'Course Notice',
  priority    text not null default 'Normal' check (priority in ('Normal', 'High', 'Urgent')),
  author_id   uuid references public.profiles(id) on delete set null,
  author_name text,
  created_at  timestamptz not null default now()
);
create index if not exists announcements_course_idx on public.announcements(course_id, created_at desc);

-- One submission per student per assignment; resubmitting replaces it.
-- The PDF (optional) lives in the private academic-materials bucket under
-- submissions/<assignment_id>/<student_id>/...
create table if not exists public.submissions (
  id              uuid primary key default gen_random_uuid(),
  assignment_id   uuid not null references public.assignments(id) on delete cascade,
  student_id      uuid not null references public.profiles(id) on delete cascade,
  submission_text text,
  file_name       text,
  storage_path    text,
  file_size       bigint,
  status          text not null default 'Submitted' check (status in ('Submitted', 'Graded')),
  grade           numeric(6,2),
  feedback        text,
  graded_by       uuid references public.profiles(id) on delete set null,
  graded_at       timestamptz,
  submitted_at    timestamptz not null default now(),
  unique (assignment_id, student_id)
);
create index if not exists submissions_student_idx on public.submissions(student_id);

-- Audit log. The actor always comes from the verified session.
create table if not exists public.audit_logs (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_name  text,
  actor_role  text,
  actor_email text,
  action      text not null,
  resource    text,
  course_id   uuid references public.courses(id) on delete set null,
  ip_address  text,
  status      text not null default 'SUCCESS' check (status in ('SUCCESS', 'FAILURE', 'DENIED')),
  severity    text not null default 'INFO' check (severity in ('INFO', 'WARNING', 'CRITICAL')),
  details     text
);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_action_idx  on public.audit_logs(action, created_at desc);

-- Same lock-down as every other table: no access with the public key.
alter table public.announcements enable row level security;
alter table public.submissions   enable row level security;
alter table public.audit_logs    enable row level security;
revoke all on table public.announcements from anon, authenticated;
revoke all on table public.submissions   from anon, authenticated;
revoke all on table public.audit_logs    from anon, authenticated;

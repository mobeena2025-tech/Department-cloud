-- Department Academic Cloud: complete database schema.
--
-- Use this on a NEW, empty Supabase project:
--   Dashboard -> SQL Editor -> New query -> paste this whole file -> Run
-- then run supabase/seed.sql, then `npm run seed` for the login accounts.
--
-- (supabase/migrations/000-005 are the same changes applied step by step to
-- the original project. You don't need them for a fresh project.)
--
-- Security model:
--   * The browser never talks to Supabase. Every request goes through the
--     Express API, which uses the server-only SECRET key (service_role) and
--     checks the user's role, course assignments and enrollments itself.
--   * Row Level Security is ON for every table with NO policies, and all
--     privileges are revoked from anon/authenticated, so the public key can
--     read or write nothing.
--   * PDFs live in the PRIVATE bucket "academic-materials" and are only
--     reachable through short-lived signed URLs created by the API.
--   * Roles: 'admin' (HOD / department admin), 'faculty', 'student'.

-- gen_random_uuid() is built into Postgres 13+ (Supabase runs 15), no extension needed.

-- =========================================================== accounts

-- One row per Supabase Auth user. No trigger creates these automatically:
-- an account without a profile has no role and the API refuses it.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text not null unique,
  role        text not null check (role in ('admin', 'faculty', 'student')),
  department  text default 'CSE - AI & ML',
  roll_number text,
  semester    int check (semester between 1 and 8),
  section     text,
  cgpa        numeric(4,2),
  emp_id      text,
  designation text,
  created_at  timestamptz not null default now()
);

-- =========================================================== courses

create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  semester    int  not null check (semester between 1 and 8),
  section     text not null default 'A',
  credits     int  not null default 3,
  description text,
  department  text default 'CSE - AI & ML',
  created_at  timestamptz not null default now()
);

-- Who teaches which course.
create table if not exists public.course_faculty (
  course_id  uuid not null references public.courses(id)  on delete cascade,
  faculty_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_id, faculty_id)
);
create index if not exists course_faculty_faculty_idx on public.course_faculty(faculty_id);

-- Which students are enrolled in which course.
create table if not exists public.enrollments (
  course_id  uuid not null references public.courses(id)  on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_id, student_id)
);
create index if not exists enrollments_student_idx on public.enrollments(student_id);

-- =========================================================== content

create table if not exists public.materials (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  title        text not null,
  description  text,
  unit         text not null default '1',
  topic        text,
  file_type    text not null default 'PDF',
  storage_path text,              -- path inside the academic-materials bucket, never a URL
  file_size    bigint,            -- bytes
  uploaded_by  uuid references public.profiles(id) on delete set null,
  -- Assistant search (free RAG) status for this PDF
  index_status text not null default 'pending'
               check (index_status in ('pending', 'indexing', 'indexed', 'no_text', 'failed')),
  index_error  text,
  indexed_at   timestamptz,
  page_count   int,
  chunk_count  int,
  created_at   timestamptz not null default now()
);
create index if not exists materials_course_id_idx on public.materials(course_id);

create table if not exists public.assignments (
  id              uuid primary key default gen_random_uuid(),
  course_id       uuid not null references public.courses(id) on delete cascade,
  title           text not null,
  description     text,
  unit_number     int  default 1,
  assigned_date   date default current_date,
  due_date        timestamptz not null,
  max_marks       int  not null default 25,
  faculty_id      uuid references public.profiles(id) on delete set null,
  faculty_name    text,
  attachment_name text,
  attachment_size text,
  total_enrolled  int  default 0,   -- unused; counts come from enrollments
  status          text not null default 'Active',
  created_at      timestamptz not null default now()
);
create index if not exists assignments_course_id_idx on public.assignments(course_id);

-- One submission per student per assignment. The optional PDF lives in the
-- bucket under submissions/<assignment_id>/<student_id>/...
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

-- course_id null = department-wide notice.
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

-- =========================================================== audit log

-- The actor always comes from the verified session.
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

-- =========================================================== free RAG

-- Text passages from uploaded PDFs with embeddings (384 numbers from the free
-- bge-small model, computed on our own server). pgvector ships with Supabase.
create extension if not exists vector with schema extensions;

create table if not exists public.material_chunks (
  id          bigint generated always as identity primary key,
  material_id uuid not null references public.materials(id) on delete cascade,
  course_id   uuid not null references public.courses(id)   on delete cascade,
  page        int  not null,
  chunk_index int  not null,
  content     text not null,
  embedding   extensions.vector(384) not null,
  created_at  timestamptz not null default now()
);
create index if not exists material_chunks_material_idx on public.material_chunks(material_id);
create index if not exists material_chunks_course_idx   on public.material_chunks(course_id);
create index if not exists material_chunks_embedding_idx
  on public.material_chunks using hnsw (embedding extensions.vector_cosine_ops);

-- Nearest passages to a question within the given courses (null = all).
create or replace function public.match_material_chunks(
  query_embedding extensions.vector(384),
  course_ids uuid[],
  match_count int default 20
)
returns table (id bigint, material_id uuid, course_id uuid, page int, content text, similarity double precision)
language sql
stable
set search_path = public, extensions
as $$
  select c.id, c.material_id, c.course_id, c.page, c.content,
         1 - (c.embedding <=> query_embedding) as similarity
  from public.material_chunks c
  where course_ids is null or c.course_id = any(course_ids)
  order by c.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 50);
$$;
revoke execute on function public.match_material_chunks(extensions.vector, uuid[], int) from public, anon, authenticated;
grant execute on function public.match_material_chunks(extensions.vector, uuid[], int) to service_role;

-- =========================================================== lock-down

do $$
declare
  t text;
  p record;
begin
  foreach t in array array[
    'profiles', 'courses', 'course_faculty', 'enrollments', 'materials',
    'assignments', 'submissions', 'announcements', 'audit_logs', 'material_chunks'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;

  -- No policies: RLS then denies everything to anon/authenticated.
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'courses', 'course_faculty', 'enrollments', 'materials',
                        'assignments', 'submissions', 'announcements', 'audit_logs', 'material_chunks')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- =========================================================== storage

-- Private bucket, PDF only, 10 MB per file.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('academic-materials', 'academic-materials', false, 10485760, array['application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- No storage policies for this bucket: anon/authenticated cannot list,
-- read, upload or delete objects. Remove any that might exist.
do $$
declare
  p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (coalesce(qual, '') ilike '%academic-materials%'
           or coalesce(with_check, '') ilike '%academic-materials%')
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

-- Checks (each should return no rows, and public = false):
-- select tablename, policyname from pg_policies where schemaname = 'public';
-- select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects';
-- select id, public from storage.buckets where id = 'academic-materials';

-- 000: starting schema for a NEW, empty Supabase project.
-- Creates the tables the app uses today, a private storage bucket for PDFs,
-- and sample data for the demo.
-- Run once in Supabase Dashboard -> SQL Editor -> New query -> paste -> Run.
-- (After this, 001_materials_storage_path.sql is not needed; it would do nothing.)
--
-- Security: Row Level Security is ON for every table with no policies, so the
-- public (anon / publishable) key can read or write nothing. Only the Express
-- server, using the server-only SECRET key, can reach the data.
-- Phase 3 replaces `users` with Supabase Auth + a `profiles` table.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables

create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null unique,
  role        text not null check (role in ('admin', 'faculty', 'student')),
  department  text default 'CSE - AI & ML',
  roll_number text,
  semester    int,
  section     text,
  cgpa        numeric(4,2),
  created_at  timestamptz not null default now()
);

create table if not exists public.courses (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  name       text not null,
  semester   int  not null check (semester between 1 and 8),
  section    text not null default 'A',
  credits    int  not null default 3,
  created_at timestamptz not null default now()
);

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
  uploaded_by  uuid references public.users(id) on delete set null,
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
  due_date        date not null,
  max_marks       int  not null default 25,
  faculty_id      uuid references public.users(id) on delete set null,
  faculty_name    text,
  attachment_name text,
  attachment_size text,
  total_enrolled  int  default 0,
  status          text not null default 'Active',
  created_at      timestamptz not null default now()
);
create index if not exists assignments_course_id_idx on public.assignments(course_id);

-- Lock the tables: no policies means no access with the public key.
alter table public.users       enable row level security;
alter table public.courses     enable row level security;
alter table public.materials   enable row level security;
alter table public.assignments enable row level security;

-- ---------------------------------------------------------------- storage

-- Private bucket: files are only reachable through short-lived signed URLs
-- that the server creates. PDFs only, 10 MB max.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('academic-materials', 'academic-materials', false, 10485760, array['application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------- sample data

insert into public.courses (code, name, semester, section, credits) values
  ('CS202', 'Database Management Systems',     6, 'A', 4),
  ('AI204', 'Artificial Neural Networks',      6, 'A', 4),
  ('CS301', 'Computer Networks',               6, 'A', 3),
  ('AI302', 'Data Science & Visual Analytics', 6, 'A', 3)
on conflict (code) do nothing;

-- Demo users (login is still the one-click demo login until Phase 3).
insert into public.users (name, email, role, department, roll_number, semester, section, cgpa) values
  ('Prof. Demo Head', 'admin@dac.test',    'admin',   'CSE - AI & ML', null,          null, null, null),
  ('Dr. Demo Faculty A',     'faculty.a@dac.test',   'faculty', 'CSE - AI & ML', null,          null, null, null),
  ('Dr. Demo Faculty B',   'faculty.b@dac.test',   'faculty', 'CSE - AI & ML', null,          null, null, null),
  ('Demo Student A',       'student.a@dac.test',    'student', 'CSE - AI & ML', 'DEMO-S001', 6,   'A',  8.70),
  ('Demo Student B',         'student.b@dac.test',     'student', 'CSE - AI & ML', 'DEMO-S002', 6,   'A',  9.10),
  ('Demo Student C',        'student.c@dac.test',    'student', 'CSE - AI & ML', 'DEMO-S003', 6,   'A',  7.95)
on conflict (email) do nothing;

-- Quick check after running: you should see 4 courses and 6 users.
-- select (select count(*) from public.courses) as courses, (select count(*) from public.users) as users;

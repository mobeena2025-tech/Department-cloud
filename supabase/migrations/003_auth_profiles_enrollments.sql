-- 003: real accounts. Every user is a Supabase Auth user (auth.users) with
-- one row in public.profiles holding their role. Adds who-teaches-what
-- (course_faculty) and who-is-enrolled-where (enrollments).
-- Safe to run more than once. Run in Supabase Dashboard -> SQL Editor.
--
-- Roles: 'admin' (HOD / department admin), 'faculty', 'student'.
-- No trigger creates profiles automatically: a sign-up without a profile
-- row has no role and the API refuses it. Profiles are created by the seed
-- script or by an admin.

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
  created_at  timestamptz not null default now()
);

create table if not exists public.course_faculty (
  course_id  uuid not null references public.courses(id)  on delete cascade,
  faculty_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_id, faculty_id)
);
create index if not exists course_faculty_faculty_idx on public.course_faculty(faculty_id);

create table if not exists public.enrollments (
  course_id  uuid not null references public.courses(id)  on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_id, student_id)
);
create index if not exists enrollments_student_idx on public.enrollments(student_id);

-- materials.uploaded_by and assignments.faculty_id used to point at the old
-- demo `users` table. Re-point them at profiles. Old demo ids cannot match a
-- real account, so they are cleared.
alter table public.materials   drop constraint if exists materials_uploaded_by_fkey;
alter table public.assignments drop constraint if exists assignments_faculty_id_fkey;

update public.materials   set uploaded_by = null
  where uploaded_by is not null and uploaded_by not in (select id from public.profiles);
update public.assignments set faculty_id = null
  where faculty_id is not null and faculty_id not in (select id from public.profiles);

alter table public.materials
  add constraint materials_uploaded_by_fkey
  foreign key (uploaded_by) references public.profiles(id) on delete set null;
alter table public.assignments
  add constraint assignments_faculty_id_fkey
  foreign key (faculty_id) references public.profiles(id) on delete set null;

-- The old one-click demo login read from public.users. It is no longer used.
drop table if exists public.users;

-- Lock the new tables (only the server's secret key can reach them).
alter table public.profiles       enable row level security;
alter table public.course_faculty enable row level security;
alter table public.enrollments    enable row level security;

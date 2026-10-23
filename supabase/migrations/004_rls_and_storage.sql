-- 004: deny the public (anon) and signed-in (authenticated) Postgres roles
-- any direct access to app data and to the academic-materials bucket.
-- The browser never talks to Supabase directly: every request goes through
-- the Express API, which uses the server-only secret key (service_role) and
-- checks the user's role and enrollments itself. service_role bypasses RLS,
-- so the API keeps working.
-- Safe to run more than once. Run in Supabase Dashboard -> SQL Editor.

-- 1. Tables: RLS on, no policies, and no table privileges for anon/authenticated.
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'courses', 'course_faculty', 'enrollments', 'materials', 'assignments'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('revoke all on table public.%I from anon, authenticated', t);
    end if;
  end loop;
end $$;

-- Remove any policies that might have been added on these tables earlier
-- (for example from the old project), so RLS denies everything.
do $$
declare
  p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'courses', 'course_faculty', 'enrollments', 'materials', 'assignments')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- 2. Storage: the bucket is private (no public URLs), PDF only, 10 MB.
update storage.buckets
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf']
where id = 'academic-materials';

-- Drop any storage policy that mentions this bucket, so anon/authenticated
-- cannot list, read, upload or delete its objects. Files are only reachable
-- through short-lived signed URLs created by the API.
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

-- 3. Check (run these after; each should return no rows / public = false):
-- select tablename, policyname from pg_policies where schemaname = 'public';
-- select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects';
-- select id, public from storage.buckets where id = 'academic-materials';

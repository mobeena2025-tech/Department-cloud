-- 001: materials stores a Storage object path (not a URL) in `storage_path`,
-- records who uploaded it, and the file size.
-- Safe to run more than once. Run in Supabase Dashboard -> SQL Editor.

do $$
begin
  -- Rename file_url -> storage_path if the old column is still there.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'materials' and column_name = 'file_url'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'materials' and column_name = 'storage_path'
  ) then
    alter table public.materials rename column file_url to storage_path;
  end if;
end $$;

alter table public.materials add column if not exists storage_path text;
alter table public.materials add column if not exists uploaded_by uuid;
alter table public.materials add column if not exists file_size bigint;

-- If any old rows hold a full URL, keep only the path inside the bucket.
-- e.g. https://<ref>.supabase.co/storage/v1/object/public/academic-materials/sem5/x.pdf?token=...
--   -> sem5/x.pdf
update public.materials
set storage_path = regexp_replace(
  split_part(storage_path, '?', 1),
  '^https?://.*/academic-materials/',
  ''
)
where storage_path ~ '^https?://';

-- Check the result: every row should show a plain path like courses/<id>/... or sem5/...
-- select id, title, storage_path, uploaded_by, file_size from public.materials order by created_at desc;

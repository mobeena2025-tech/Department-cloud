-- 006: free RAG. Text passages from uploaded PDFs with their embeddings
-- (384 numbers from the free bge-small model, computed on our own server),
-- searchable with pgvector. Safe to run more than once.
-- Run in Supabase Dashboard -> SQL Editor.

-- pgvector ships with Supabase (free plan included); this just turns it on.
create extension if not exists vector with schema extensions;

-- Indexing status per material, shown to faculty.
alter table public.materials add column if not exists index_status text not null default 'pending';
alter table public.materials add column if not exists index_error  text;
alter table public.materials add column if not exists indexed_at   timestamptz;
alter table public.materials add column if not exists page_count   int;
alter table public.materials add column if not exists chunk_count  int;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'materials_index_status_check') then
    alter table public.materials add constraint materials_index_status_check
      check (index_status in ('pending', 'indexing', 'indexed', 'no_text', 'failed'));
  end if;
end $$;

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

-- Nearest passages to a question, limited to the given courses
-- (null = all courses, used for admins). Called only by the server.
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

-- Same lock-down as every other table: nothing for the public key.
alter table public.material_chunks enable row level security;
revoke all on table public.material_chunks from anon, authenticated;
revoke execute on function public.match_material_chunks(extensions.vector, uuid[], int) from public, anon, authenticated;
grant execute on function public.match_material_chunks(extensions.vector, uuid[], int) to service_role;

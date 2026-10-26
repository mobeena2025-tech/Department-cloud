-- Search only the student's own courses, exactly.
-- The HNSW index looks at ~40 nearest passages across ALL courses and filters
-- afterwards, so one big PDF in another course (e.g. an 800-page textbook)
-- could leave a student with no results at all. Measuring the distance to
-- every passage of the student's courses is exact and still fast at this size.
-- Safe to run more than once.
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
  with candidates as materialized (
    select c.id, c.material_id, c.course_id, c.page, c.content,
           c.embedding <=> query_embedding as distance
    from public.material_chunks c
    where course_ids is null or c.course_id = any(course_ids)
  )
  select id, material_id, course_id, page, content, 1 - distance as similarity
  from candidates
  order by distance
  limit least(greatest(match_count, 1), 50);
$$;

revoke execute on function public.match_material_chunks(extensions.vector, uuid[], int) from public, anon, authenticated;
grant execute on function public.match_material_chunks(extensions.vector, uuid[], int) to service_role;

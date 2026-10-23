-- 002: course description/department, and assignment due dates with a time.
-- Safe to run more than once. Run in Supabase Dashboard -> SQL Editor.

alter table public.courses add column if not exists description text;
alter table public.courses add column if not exists department  text default 'CSE - AI & ML';

-- The "Create Assignment" form sends a date AND time (e.g. 2026-10-30T23:59).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'assignments'
      and column_name = 'due_date' and data_type = 'date'
  ) then
    alter table public.assignments
      alter column due_date type timestamptz using due_date::timestamptz;
  end if;
end $$;

-- Short descriptions for the sample courses (only where none is set yet).
update public.courses set description = 'Relational model, SQL, normalization (1NF to BCNF), transactions, concurrency control and query optimization.'
  where code = 'CS202' and description is null;
update public.courses set description = 'Perceptrons, multilayer networks, backpropagation, CNNs and training techniques for deep networks.'
  where code = 'AI204' and description is null;
update public.courses set description = 'Network layers, TCP/IP, routing protocols (RIP, OSPF), congestion control and network security basics.'
  where code = 'CS301' and description is null;
update public.courses set description = 'Data wrangling, exploratory analysis, statistical modelling and visual analytics with Python.'
  where code = 'AI302' and description is null;

-- The department is AI & DS (Artificial Intelligence & Data Science).
-- Optional tidy-up: the app already sets the department on every new row;
-- this only changes the database's fallback value. Safe to run more than once.
alter table public.profiles alter column department set default 'AI & DS';
alter table public.courses  alter column department set default 'AI & DS';
update public.profiles set department = 'AI & DS' where department is distinct from 'AI & DS';
update public.courses  set department = 'AI & DS' where department is distinct from 'AI & DS';

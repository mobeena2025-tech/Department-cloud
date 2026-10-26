-- Labs carry 1.5 credits (Semester V syllabus), so credits must allow halves.
-- Safe to run more than once.
alter table public.courses alter column credits type numeric(3,1) using credits::numeric;
alter table public.courses alter column credits set default 3;
update public.courses set credits = 1.5 where code in ('AAN-LAB', 'IDS-LAB');

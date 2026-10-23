-- Sample courses for the demo. Run after supabase/schema.sql.
-- Safe to run more than once.
--
-- Login accounts (1 admin, 2 faculty, 3 students), who-teaches-what and
-- enrollments are created by `npm run seed`, because accounts must be made
-- through the Supabase Auth admin API (passwords are hashed by Supabase).

insert into public.courses (code, name, semester, section, credits, description) values
  ('CS202', 'Database Management Systems', 6, 'A', 4,
   'Relational model, SQL, normalization (1NF to BCNF), transactions, concurrency control and query optimization.'),
  ('AI204', 'Artificial Neural Networks', 6, 'A', 4,
   'Perceptrons, multilayer networks, backpropagation, CNNs and training techniques for deep networks.'),
  ('CS301', 'Computer Networks', 6, 'A', 3,
   'Network layers, TCP/IP, routing protocols (RIP, OSPF), congestion control and network security basics.'),
  ('AI302', 'Data Science & Visual Analytics', 6, 'A', 3,
   'Data wrangling, exploratory analysis, statistical modelling and visual analytics with Python.')
on conflict (code) do nothing;

-- A sample assignment per course with a due date two weeks out.
insert into public.assignments (course_id, title, description, unit_number, due_date, max_marks)
select c.id, a.title, a.description, a.unit_number, now() + interval '14 days', 25
from (values
  ('CS202', 'Normalization worksheet', 'Decompose the given relations to BCNF.', 3),
  ('AI204', 'Backpropagation by hand', 'Compute one backward pass for the 2-layer network given in class.', 2),
  ('CS301', 'Subnetting exercise', 'Design a subnet plan for the department network.', 2)
) as a(code, title, description, unit_number)
join public.courses c on c.code = a.code
where not exists (
  select 1 from public.assignments x where x.course_id = c.id and x.title = a.title
);

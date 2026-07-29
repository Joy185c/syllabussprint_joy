-- =============================================
-- SyllabusSprint — Full Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Syllabus Files
create table if not exists public.syllabus_files (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  filename text not null,
  storage_url text not null,
  raw_text text not null,
  uploaded_at timestamptz not null default now()
);

-- 2. Courses
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  syllabus_id uuid references public.syllabus_files(id) on delete cascade,
  title text not null,
  course_code text not null default '',
  semester text not null default '',
  instructor text not null default '',
  credits integer not null default 3,
  description text not null default '',
  created_at timestamptz not null default now()
);

-- 3. Topics (Weekly Schedule)
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade not null,
  week integer not null default 1,
  topic text not null,
  reading text not null default '',
  notes text not null default ''
);

-- 4. Assignments
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  description text not null default '',
  deadline timestamptz,
  weight numeric not null default 0,
  status text not null default 'pending' check (status in ('pending','in_progress','completed','overdue')),
  priority text not null default 'medium' check (priority in ('low','medium','high'))
);

-- 5. Exams
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade not null,
  type text not null,
  date timestamptz,
  weight numeric not null default 0
);

-- 6. Study Tasks
create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.assignments(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  date timestamptz,
  completed boolean not null default false
);

-- 7. Kanban Cards
create table if not exists public.kanban_cards (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  description text not null default '',
  status text not null default 'todo' check (status in ('todo','doing','done')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  due_date timestamptz,
  position integer not null default 0
);

-- 8. Timeline Events
create table if not exists public.timeline (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade not null,
  date timestamptz not null,
  title text not null,
  type text not null default 'task' check (type in ('assignment','exam','task','deadline')),
  description text not null default ''
);

-- =============================================
-- Indexes for performance
-- =============================================
create index if not exists idx_courses_workspace on public.courses(workspace_id);
create index if not exists idx_kanban_course on public.kanban_cards(course_id);
create index if not exists idx_timeline_course on public.timeline(course_id);
create index if not exists idx_assignments_course on public.assignments(course_id);
create index if not exists idx_syllabus_workspace on public.syllabus_files(workspace_id);

-- =============================================
-- Disable RLS (MVP — no auth)
-- =============================================
alter table public.syllabus_files disable row level security;
alter table public.courses disable row level security;
alter table public.topics disable row level security;
alter table public.assignments disable row level security;
alter table public.exams disable row level security;
alter table public.study_tasks disable row level security;
alter table public.kanban_cards disable row level security;
alter table public.timeline disable row level security;

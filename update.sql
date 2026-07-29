create table if not exists public.workspace_analytics (
  workspace_id text primary key,
  ai_insights jsonb default '{}'::jsonb,
  analytics_hash text default '',
  is_generating boolean default false,
  updated_at timestamptz default now()
);

alter table public.courses add column if not exists ai_exam_readiness integer default null;
alter table public.courses add column if not exists ai_exam_readiness_explanation text default '';

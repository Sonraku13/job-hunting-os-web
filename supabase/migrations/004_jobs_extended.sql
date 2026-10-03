-- Extended saved_jobs table untuk mapping field Zapi response

alter table public.saved_jobs
  add column if not exists external_job_id text,
  add column if not exists company_logo_url text,
  add column if not exists company_size text,
  add column if not exists company_industry text,
  add column if not exists posted_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists function_category text,
  add column if not exists employment_type_id text,
  add column if not exists work_arrangement text,
  add column if not exists classification_id text,
  add column if not exists apply_url text,
  add column if not exists is_remote boolean default false,
  add column if not exists is_hybrid boolean default false,
  add column if not exists is_onsite boolean default false,
  add column if not exists company_slug text,
  add column if not exists company_website text,
  add column if not exists screening_questions jsonb default '[]'::jsonb,
  add column if not exists has_role_requirements boolean default false;

-- Index untuk eksternal job id unik
create unique index if not exists saved_jobs_user_external_idx
  on public.saved_jobs(user_id, external_job_id, source)
  where external_job_id is not null;
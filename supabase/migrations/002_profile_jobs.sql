-- Migrasi database: user_profiles & saved_jobs

-- Tabel profil user untuk menyimpan CV dan preferensi
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  
  -- CV & Identitas
  full_name text,
  job_title text,
  summary text,
  skills jsonb default '[]'::jsonb,
  
  -- Pengalaman & Portofolio
  experience jsonb default '[]'::jsonb,  -- [{title, company, start_date, end_date, description}]
  education jsonb default '[]'::jsonb,     -- [{degree, institution, year}]
  portfolio_url text,
  
  -- Preferensi Karir
  target_job_titles text[],
  remote_only boolean default false,
  salary_range text,
  preferred_locations text[],
  
  updated_at timestamptz not null default now(),
  
  constraint user_profiles_user_id_key unique (user_id)
);

-- Tabel lowongan tersimpan dari hasil scraping
create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  
  -- Informasi dasar lowongan
  job_title text not null,
  company_name text not null,
  company_logo_url text,
  job_url text,
  location text,
  job_type text,  -- full-time, contract, part-time, etc.
  employment_type text,
  
  -- Gaji (opsional)
  salary_range text,
  salary_currency text default 'IDR',
  
  -- Kualifikasi & Deskripsi
  job_description text,
  requirements jsonb default '[]'::jsonb,  -- gi/requirements, soft_skills, experience_years
  description_cleaned JSONB,  -- Hasil AI pipeline
  
  -- Metadata
  source text not null,  -- 'linkedin' or 'jobstreet'
  scraped_at timestamptz not null default now(),
  is_disliked boolean default false,
  is_applied boolean default false,
  applied_date timestamptz,
  
  -- Match Score (placeholder, dihitung oleh backend nanti)
  match_score numeric default 0.1,
  
  created_at timestamptz not null default now(),
  
  constraint saved_jobs_user_id_key unique (user_id, job_url)
);

-- INDEX Tambahan
create index if not exists saved_jobs_user_created_idx
  on public.saved_jobs(user_id, created_at desc);

create index if not exists saved_jobs_source_idx
  on public.saved_jobs(source);

-- RLS (Row-Level Security)
alter table public.user_profiles enable row level security;
alter table public.saved_jobs enable row level security;

-- Policy: User hanya bisa baca profil & lowongan milik dirinya sendiri
create policy "Users can read own profile"
  on public.user_profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can update own profile"
  on public.user_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read own saved jobs"
  on public.saved_jobs for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own saved jobs"
  on public.saved_jobs for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own saved jobs"
  on public.saved_jobs for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Function Trigger untuk auto-update updated_at
create or replace function public.handle_user_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_user_profile_updated
  after update on public.user_profiles
  for each row
  execute procedure public.handle_user_profile_update();
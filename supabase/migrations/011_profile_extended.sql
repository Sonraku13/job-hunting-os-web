-- Tambahan kolom untuk skill, experience, education, dan kontak pada user_profiles

alter table public.user_profiles
  add column if not exists phone_number text;

alter table public.user_profiles
  add column if not exists email_address text;

alter table public.user_profiles
  add column if not exists skills jsonb default '[]'::jsonb;

alter table public.user_profiles
  add column if not exists experience jsonb default '[]'::jsonb;

alter table public.user_profiles
  add column if not exists education jsonb default '[]'::jsonb;

alter table public.user_profiles
  add column if not exists ui_preferred_language text default 'Indonesian';

-- Index untuk pencarian berbasis skill
create index if not exists user_profiles_skills_idx
  on public.user_profiles using gin(skills);
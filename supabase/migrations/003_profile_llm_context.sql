-- Tambahan kolom penting untuk LLM personalization & Jobstreet/LinkedIn mapping

alter table public.user_profiles
  add column if not exists target_locations text[] default array['Indonesia']::text[],
  add column if not exists target_classifications text[],
  add column if not exists target_employment_types text[],
  add column if not exists target_work_arrangements text[],
  add column if not exists min_salary numeric,
  add column if not exists max_salary numeric,
  add column if not exists linkedin_geo_id text,
  add column if not exists jobstreet_location_id text,
  add column if not exists years_of_experience integer default 0,
  add column if not exists current_role text,
  add column if not exists career_goals text,
  add column if not exists spoken_languages text[] default array['Indonesian']::text[],
  add column if not exists llm_context text;

comment on column public.user_profiles.llm_context is 'Ringkasan naratif personal untuk prompt LLM: latar belakang, motivasi, gaya bahasa, dan target karir yang sangat personal';
comment on column public.user_profiles.target_locations is 'Daftar lokasi pencarian yang didukung API (LinkedIn location / Jobstreet locationId)';
comment on column public.user_profiles.target_classifications is 'Klasifikasi Jobstreet (e.g. Information & Communication Technology)';
comment on column public.user_profiles.target_employment_types is 'fullTime, partTime, contract, casual';
comment on column public.user_profiles.target_work_arrangements is 'onsite, hybrid, remote';

-- Index untuk pencarian lokasi
create index if not exists user_profiles_target_locations_idx
  on public.user_profiles using gin(target_locations);

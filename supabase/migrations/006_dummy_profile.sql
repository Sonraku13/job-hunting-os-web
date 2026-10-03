-- SQL Helper untuk mengisi dummy profile akun user yang sedang login di Supabase
-- Anda dapat menjalankan ini di Supabase SQL Editor

insert into public.user_profiles (
  id,
  user_id,
  full_name,
  job_title,
  summary,
  portfolio_url,
  target_job_titles,
  target_locations,
  target_employment_types,
  target_work_arrangements,
  min_salary,
  max_salary,
  years_of_experience,
  "current_role",
  career_goals,
  spoken_languages,
  llm_context
)
select
  p.id,
  p.id,
  coalesce(p.full_name, 'Alex Pratama'),
  'Full Stack Software Engineer',
  'Software Engineer dengan 4 tahun pengalaman membangun web application berskala tinggi menggunakan React, Next.js, Node.js, dan PostgreSQL. Terbiasa memimpin perancangan REST API dan integrasi sistem cloud.',
  'https://alexpratama.dev',
  array['Full Stack Engineer', 'Frontend Developer', 'Backend Developer'],
  array['Jakarta', 'Bandung', 'Indonesia'],
  array['fullTime', 'contract'],
  array['remote', 'hybrid'],
  15000000,
  25000000,
  4,
  'Senior Full Stack Developer @ Tech Nusantara',
  'Menjadi Principal Engineer atau Technical Lead dengan fokus pada high-concurrency microservices dan modern cloud architecture.',
  array['Indonesian', 'English'],
  'Gaya komunikasi profesional namun bersahabat. Fokus pada impact bisnis, efisiensi kode, dan kemampuan problem solving. Hindari bahasa bertele-tele dan klise.'
from public.profiles p
on conflict (user_id) do update set
  full_name = excluded.full_name,
  job_title = excluded.job_title,
  summary = excluded.summary,
  portfolio_url = excluded.portfolio_url,
  target_job_titles = excluded.target_job_titles,
  target_locations = excluded.target_locations,
  target_employment_types = excluded.target_employment_types,
  target_work_arrangements = excluded.target_work_arrangements,
  min_salary = excluded.min_salary,
  max_salary = excluded.max_salary,
  years_of_experience = excluded.years_of_experience,
  "current_role" = excluded."current_role",
  career_goals = excluded.career_goals,
  spoken_languages = excluded.spoken_languages,
  llm_context = excluded.llm_context;

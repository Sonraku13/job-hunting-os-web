-- Tambahan kolom untuk menyimpan hasil Cover Letter dan Email Draft per lowongan
alter table public.saved_jobs
  add column if not exists cover_letter text,
  add column if not exists email_draft text;

comment on column public.saved_jobs.cover_letter is 'Hasil Cover Letter buatan AI yang sudah di-generate';
comment on column public.saved_jobs.email_draft is 'Hasil Email Draft buatan AI yang sudah di-generate';

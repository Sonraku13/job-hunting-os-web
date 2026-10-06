-- Add fields for Quick Paste / Universal Job Input feature
alter table public.saved_jobs
add column if not exists contact_email text,
add column if not exists contact_whatsapp text,
add column if not exists apply_url text,
add column if not exists source_url text;

-- Optional: Add index for faster contact lookups
create index if not exists saved_jobs_contact_email_idx
  on public.saved_jobs(contact_email);
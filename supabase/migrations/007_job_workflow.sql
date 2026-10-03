-- Migrasi untuk menambahkan status lowongan, match score detail, dan kolom tambahan deskripsi

-- 1. Enum status alur kerja (PostgreSQL tidak support CREATE TYPE IF NOT EXISTS untuk enum)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE public.job_status AS ENUM (
      'discover',    -- baru ditemukan dari scraping
      'analyze',     -- sedang dianalisis / matchscore
      'apply',       -- sudah dilamar
      'refuse',      -- ditolak / tidak cocok
      'archive'      -- diarsipkan
    );
  END IF;
END$$;

-- 2. Tambah kolom status, match_score_breakdown, deskripsi bersih ke saved_jobs
ALTER TABLE public.saved_jobs
  ADD COLUMN IF NOT EXISTS status public.job_status DEFAULT 'discover',
  ADD COLUMN IF NOT EXISTS match_score NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS match_score_breakdown JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description_cleaned TEXT,
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 3. Index untuk filtering status
CREATE INDEX IF NOT EXISTS saved_jobs_status_idx ON public.saved_jobs(status);
CREATE INDEX IF NOT EXISTS saved_jobs_user_status_idx ON public.saved_jobs(user_id, status);

-- 4. Update constraint unique untuk allow same job_url different status? Keep as is.
-- Fix: izinkan UPDATE saved_jobs milik sendiri + selaraskan enum status analyse/analyze
-- RLS sebelumnya hanya punya select/insert/delete, sehingga UPDATE cover_letter/email/match_score
-- gagal diam-diam (API tetap return success tapi DB tidak berubah -> data hilang saat pindah halaman).

-- 1. Policy UPDATE untuk saved_jobs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'saved_jobs' AND policyname = 'Users can update own saved jobs'
  ) THEN
    CREATE POLICY "Users can update own saved jobs"
      ON public.saved_jobs FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END$$;

-- 2. Selaraskan enum: UI memakai 'analyse', migrasi 007 memakai 'analyze'.
-- Tambahkan 'analyse' sebagai nilai valid agar tidak error saat update status.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'job_status' AND e.enumlabel = 'analyse'
    ) THEN
      ALTER TYPE public.job_status ADD VALUE 'analyse';
    END IF;
  END IF;
END$$;

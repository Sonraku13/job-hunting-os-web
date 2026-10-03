-- Menambahkan konfigurasi jadwal scraping ke user_profiles

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS scrape_active boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS scrape_days integer[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Senin, 7=Minggu
  ADD COLUMN IF NOT EXISTS scrape_hours integer[] DEFAULT '{9}', -- Jam 0-23
  ADD COLUMN IF NOT EXISTS last_scraped_at timestamptz;

-- Index untuk mempercepat query cron job
CREATE INDEX IF NOT EXISTS user_profiles_scrape_active_idx ON public.user_profiles(scrape_active) WHERE scrape_active = true;
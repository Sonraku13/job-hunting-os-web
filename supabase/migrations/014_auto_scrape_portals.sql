-- 014_auto_scrape_portals.sql
-- Menambahkan konfigurasi portal untuk scraping manual dan auto-schedule.
--
-- Portal disimpan sebagai text[] agar user bisa memilih lebih dari satu portal.
-- Satu aturan biayanya (lihat lib/constants/portal-locations.ts):
--   1 lokasi x 1 portal = 1 credit = 1 halaman scraping
--   Dealls  -> 1 credit per KOTA (API menolak multi-kota dalam 1 panggilan)
--   Glints  -> 1 credit flat per sesi (panggilan nasional)

alter table public.user_profiles
  add column if not exists target_portals text[] default '{linkedin}'::text[],
  add column if not exists auto_portals text[] default '{linkedin}'::text[],
  add column if not exists auto_location text;

comment on column public.user_profiles.target_portals is 'Portal yang dipakai saat scraping manual';
comment on column public.user_profiles.auto_portals is 'Portal yang dipakai oleh cron auto-scrape';
comment on column public.user_profiles.auto_location is 'Lokasi prioritas untuk cron; FREE plan dipaksa ke 1 lokasi';

-- Baris lama belum punya nilai, pastikan tidak null.
update public.user_profiles
set target_portals = '{linkedin}'::text[]
where target_portals is null;

update public.user_profiles
set auto_portals = '{linkedin}'::text[]
where auto_portals is null;
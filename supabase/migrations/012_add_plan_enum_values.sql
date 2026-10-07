-- LANGKAH 1 dari 2
-- Jalankan file ini DULU, lalu RUN sampai selesai (commit).
-- PostgreSQL tidak mengizinkan nilai enum baru dipakai di transaksi yang sama
-- saat nilai itu ditambahkan, jadi langkah ini harus dipisah.

-- Tambah tier baru: PRO, VIP, ADMIN ke enum plan_type
-- ADMIN hanya untuk backend/internal, tidak ditampilkan di UI
ALTER TYPE public.plan_type ADD VALUE IF NOT EXISTS 'PRO';
ALTER TYPE public.plan_type ADD VALUE IF NOT EXISTS 'VIP';
ALTER TYPE public.plan_type ADD VALUE IF NOT EXISTS 'ADMIN';

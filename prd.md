# PRD - Job Hunting OS (Web)

| Field | Nilai |
| --- | --- |
| Nama Produk | Job Hunting OS (Web App) |
| Versi Dokumen | 1.0 |
| Tanggal | 2026-10-09 |
| Status | Draft - Source of Truth untuk Phase berikutnya |
| Pemilik | Product Owner (internal) |
| Stack | Next.js 16 (App Router), TypeScript strict, Tailwind CSS 4, Supabase (Auth + Postgres), Vercel |
| Repository | GitHub private |

> Dokumen ini adalah acuan tunggal (single source of truth) untuk penyempurnaan produk agar **sempurna, bebas bug, fleksibel, dan responsif**. Semua perubahan kode harus merujuk ke ID requirement (`FR-*`, `NFR-*`) atau ID bug (`BUG-*`) di dokumen ini.

---

## 1. Ringkasan Eksekutif

Job Hunting OS adalah SaaS ringan yang membantu pencari kerja di Indonesia mengubah proses "lamaran massal" menjadi **kurasi terstruktur berbasis kuota harian**. Produk menggabungkan:

1. **Scraping multi-portal** (LinkedIn, Jobstreet, Indeed, Glints, Dealls) untuk menemukan lowongan 24 jam terakhir.
2. **Asisten AI** untuk mengekstrak lowongan, menghitung match score, membuat cover letter, dan draft email lamaran.
3. **Input universal "Quick Paste"** dari teks/chat/gambar poster (OCR + LLM).
4. **Manajemen pipeline** status lowongan (discover, analyse, apply, refuse, archive).
5. **Monetisasi manual** dengan kuota harian yang ditegakkan di database (FREE, PRO, VIP, ADMIN).

Nilai utama: transparan, hemat waktu, tanpa langganan otomatis, dan menjaga fokus pelamar dengan pembatasan kuota harian.

---

## 2. Latar Belakang & Masalah

Pelamar kerja kehilangan banyak waktu karena:
- Membaca iklan lowongan yang panjang dan berulang.
- Menyebar lamaran identik ke banyak perusahaan tanpa relevansi.
- Kehilangan jejak lowongan mana yang sudah dilamar/ditolak.
- Tidak tahu batas realistis jumlah lamaran per hari.

Produk ini menjawab dengan alur kerja ringkas dan AI yang dibatasi kuota, sehingga setiap lamaran lebih kontekstual dan terukur.

---

## 3. Tujuan, Non-Tujuan, dan Prinsip

### 3.1 Tujuan
- Menyediakan alur end-to-end: temukan -> analisis -> lamar -> arsipkan.
- Menegakkan kuota harian secara adil dan anti-abuse.
- Memberikan pengalaman responsif (mobile-first) dan dapat diandalkan.
- Menjadi basis yang mudah diperluas (portal, provider AI, plan) tanpa refactor besar.

### 3.2 Non-Tujuan (saat ini)
- Payment gateway / webhook otomatis (tetap manual + WhatsApp).
- OAuth Google Drive/Sheets.
- Email sending otomatis (email hanya draft).
- Admin dashboard UI.
- Multi-tenant Google Sheet sync.
- Background queue/Redis/Prisma/tRPC/Zustand/Redux/shadcn.

### 3.3 Prinsip Pengembangan ("Lazy Development")
- Gunakan fitur native platform (Next.js API Routes + Supabase) sebelum menambah dependency.
- Satu sumber kebenaran untuk aturan bisnis (kuota, plan, harga).
- Migrasi idempotent, aman dijalankan berulang.
- TypeScript strict, tanpa `any`, tanpa mematikan lint/build.

---

## 4. Metrik Keberhasilan

| Metrik | Target |
| --- | --- |
| Login -> dashboard sukses | >= 99% |
| API AI/scrape merespons < 15s (p95) | >= 95% request |
| Kuota tampil = kuota ditegakkan DB | 100% konsisten |
| Error yang mengorbankan kuota user | 0 |
| Halaman inti LCP (mobile 4G) | < 2.5s |
| Aksesibilitas kontras (WCAG AA) | Lulus |
| Build & lint | Selalu hijau |

---

## 5. Persona & Use Case

| Persona | Kebutuhan | Fitur Kunci |
| --- | --- | --- |
| Fresh Graduate (FREE) | Coba cepat, tanpa biaya | Quick Paste, 3 AI/hari, 1 portal/hari |
| Job Seeker Aktif (PRO) | Volume sedang, kualitas tinggi | Auto-scrape, 30 AI/hari, multi-portal |
| Mass Apply (VIP) | Volume besar | 100 AI/hari, 25 scrape/hari, prioritas |
| Internal Admin (ADMIN) | Operasional tanpa batas | Kuota unlimited, verifikasi manual |

---

## 6. Lingkup Fase Ini

### 6.1 Termasuk
- Auth Google (Supabase), dashboard terproteksi, profil, settings, billing manual, kuota.
- Scraping manual 5 portal + cron harian (Vercel Hobby: 1x/hari).
- Quick Paste (teks + gambar) dengan OCR (Vleee) dan LLM multi-provider fallback.
- AI: parse, match score, cover letter, email draft, dengan caching di DB.
- Pipeline status lowongan.
- Multibahasa ID/EN (i18n).
- Design system Pepelsbey (light-only).

### 6.2 Tidak Termasuk (fase ini)
Lihat 3.2 di atas.

---

## 7. Arsitektur & Stack

```
Browser (React 19 / Server + Client Components)
   |
   | fetch /api/*  (cookie session Supabase)
   v
Next.js 16 App Router (Vercel, Node runtime)
   |-- /api/ai/*        -> lib/ai/llm.ts -> Gemini Direct | Zapi Copilot | Zapi ChatEx | Zapi ChatGPT
   |-- /api/jobs/parse  -> lib/ai/ocr.ts (Vleee) -> llm.ts
   |-- /api/scrape/run  -> Zapi API (jobs:linkedin|jobstreet|indeed|glints|dealls)
   |-- /api/cron/scrape -> Zapi API (service role, Vercel Cron)
   |-- /api/usage/consume -> RPC consume_usage
   v
Supabase Postgres (RLS + RPC consume_usage)
   |-- auth.users -> trigger handle_new_user -> profiles
   |-- profiles, usage_events, user_profiles, saved_jobs
```

**Prinsip arsitektur:**
- Semua mutasi kuota WAJIB lewat RPC `consume_usage`.
- Semua endpoint API memvalidasi input dan memeriksa user.
- AI provider dipilih lewat fallback berurutan; model harus dapat dikonfigurasi (lihat BUG-014).
- Scraping portal mengikuti pola adapter/registry (lihat NFR-15).

---

## 8. Peta Rute & Halaman

| Rute | Akses | Deskripsi |
| --- | --- | --- |
| `/` | Publik | Landing + pricing ringkas; user login diarahkan ke `/dashboard` |
| `/metode` | Publik | Dokumentasi metode kerja |
| `/login` | Publik | Google login; user login diarahkan ke `/dashboard` |
| `/auth/callback` | Publik | Tukar kode OAuth jadi session |
| `/dashboard` | Terproteksi | Analytics + daftar lowongan + aksi scrape/AI |
| `/profile` | Terproteksi | CV, kontak, skills, pengalaman, pendidikan, bahasa AI, LLM context |
| `/settings` | Terproteksi | Target posisi/lokasi, preferensi kerja, jadwal auto-scrape, tampilan |
| `/billing` | Terproteksi | Kuota, status paket, pembayaran manual (BCA/QRIS) + WhatsApp |
| `/api/usage/consume` | Terproteksi | Catat pemakaian kuota (validasi action server-side) |
| `/api/ai/process` | Terproteksi | AI_EXTRACT / AI_GENERATE generik |
| `/api/ai/match-score` | Terproteksi | Hitung match score (cached) |
| `/api/ai/cover-letter` | Terproteksi | Buat cover letter (cached) |
| `/api/ai/email-draft` | Terproteksi | Buat draft email (cached) |
| `/api/jobs/parse` | Terproteksi | Quick Paste: ekstraksi terstruktur (teks/gambar) |
| `/api/jobs/save` | Terproteksi | Simpan lowongan manual/quick paste |
| `/api/jobs/list` | Terproteksi | Daftar lowongan user |
| `/api/jobs/{id}` | Terproteksi | Hapus lowongan |
| `/api/jobs/{id}/status` | Terproteksi | Ubah status pipeline |
| `/api/profile/update` | Terproteksi | GET/PUT profil |
| `/api/scrape/run` | Terproteksi | Scraping manual per portal + simpan |
| `/api/scrape/{portal}` | Terproteksi | (Kandidat dihapus) proxy mentah |
| `/api/cron/scrape` | Cron Secret | Auto-scrape harian |

---

## 9. Model Data (Ringkas)

### 9.1 `profiles`
| Kolom | Tipe | Catatan |
| --- | --- | --- |
| id | uuid PK -> auth.users | |
| email, full_name, avatar_url | text | dari OAuth |
| plan | enum `plan_type` (FREE, PRO, VIP, ADMIN, legacy PAID) | ditulis hanya oleh admin/RPC |
| paid_until | timestamptz | wajib untuk PRO/VIP |
| approved_at | timestamptz | jejak approval manual |
| created_at, updated_at | timestamptz | |

### 9.2 `usage_events`
`id`, `user_id`, `action` (enum `usage_action`), `portal`, `created_at`, `metadata`. Sumber kebenaran kuota.

### 9.3 `user_profiles`
Identitas/CV, kontak, skills/experience/education (jsonb), kontak, preferensi target (titles/locations/classification/employment/work arrangement), salary min/max, `linkedin_geo_id`, `jobstreet_location_id`, `ui_preferred_language`, `llm_context`, konfigurasi scrape (`scrape_active`, `scrape_days`, `scrape_hours`, `last_scraped_at`).

### 9.4 `saved_jobs`
Info lowongan, kontak (email/WhatsApp/apply_url/source_url), `source`, `external_job_id`, `status` (enum `job_status`), `match_score`, `match_score_breakdown`, `cover_letter`, `email_draft`, `applied_at`, `archived_at`, `created_at`. Unique: `(user_id, job_url)`; index unik `(user_id, external_job_id, source)`.

---

## 10. Aturan Bisnis & Kuota (Source of Truth)

| Plan | AI / hari | Scrape / hari | Portal | Harga |
| --- | --- | --- | --- | --- |
| FREE | 3 | 1 | 1 portal/hari | Gratis |
| PRO | 30 | 10 | Multi | Rp 49.000/bln atau Rp 129.000/3bln |
| VIP | 100 | 25 | Multi | Rp 99.000/bln atau Rp 249.000/3bln |
| ADMIN | Unlimited | Unlimited | Multi | Internal |

**Aturan implementasi:**
- Batas ditegakkan di RPC `consume_usage` (bukan hanya UI).
- Reset harian mengikuti zona waktu `Asia/Jakarta` (WIB).
- FREE: hanya 1 portal scraping per hari.
- PRO/VIP yang `paid_until` lewat otomatis downgrade ke FREE.
- Frontend tidak boleh menulis `plan`, `paid_until`, `approved_at`.
- Semua AI action (EXTRACT + GENERATE) berbagi kuota AI; semua scrape action berbagi kuota scrape.
- Output AI yang tersimpan (match score, cover letter, email) bersifat cache: tidak memotong kuota lagi.

> **Catatan konsistensi:** `PROJECT_LOG.txt` masih menyebut harga Rp 25.000/bulan (usang). Harga resmi mengikuti `/billing` dan tabel ini. Perbarui log agar tidak menyesatkan (BUG-023).

---

## 11. Requirement Fungsional (FR)

### 11.1 Autentikasi & Akses

| ID | Requirement | Prioritas | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-01 | Login Google via Supabase | P0 | Klik login -> OAuth -> `/auth/callback` -> `/dashboard`; gagal menampilkan pesan |
| FR-02 | Halaman publik (`/`, `/metode`) dapat diakses tanpa login | P0 | Anonim membuka `/` melihat landing + harga; tidak di-redirect |
| FR-03 | User login membuka `/` diarahkan ke `/dashboard` | P0 | Redirect 302/307 |
| FR-04 | Rute terproteksi mengarah ke `/login` bila belum login | P0 | `/dashboard`, `/profile`, `/settings`, `/billing` redirect |
| FR-05 | API terproteksi mengembalikan `401 JSON` bila belum login | P0 | Bukan redirect HTML |
| FR-06 | Logout menghapus session dan kembali ke `/login` | P0 | Session bersih |

### 11.2 Dashboard & Pipeline Lowongan

| ID | Requirement | Prioritas | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-07 | Menampilkan analytics: jumlah lowongan, lamaran, rata-rata match | P1 | Angka sesuai data user; label & periode akurat |
| FR-08 | Daftar lowongan dengan filter status (all/discover/analyse/apply/refuse/archive) | P0 | Filter + hitungan per tab benar |
| FR-09 | Ubah status lowongan dengan optimistic update + rollback bila gagal | P1 | UI kembali ke status lama saat API gagal |
| FR-10 | Detail lowongan dalam modal (deskripsi, kontak, link) | P1 | Modal responsif, bisa ditutup (klik luar/ESC/close) |
| FR-11 | Hapus lowongan | P0 | Konfirmasi + list ter-update |
| FR-12 | Aksi scrap manual per portal dengan indikator loading | P0 | Kuota dicek; pesan sukses/gagal jelas |
| FR-13 | Menampilkan kontak terdeteksi (email/WA/form/sumber) sebagai tombol aksi | P1 | Tombol `mailto:`, `wa.me`, form, sumber muncul hanya bila ada |

### 11.3 Quick Paste (Input Universal)

| ID | Requirement | Prioritas | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-14 | Modal Quick Paste menerima teks/caption (wajib salah satu) + link + gambar | P0 | Validasi teks-atau-gambar |
| FR-15 | Upload/paste gambar (JPG/PNG/WebP, maks 5MB) + drag & drop | P1 | Preview muncul; tipe/ukuran tidak valid ditolak dengan pesan |
| FR-16 | Ekstraksi AI: posisi, perusahaan, lokasi, tipe, gaji, deskripsi, kontak | P0 | Hasil terstruktur; kuota AI terpotong sekali |
| FR-17 | Simpan hasil ke `saved_jobs` tanpa memotong kuota kedua kali | P0 | `is_parsed=true` tidak memotong kuota saat save |
| FR-18 | Kegagalan ekstraksi tidak boleh menghabiskan kuota | P0 | Kuota di-refund (lihat BUG-004) |

### 11.4 AI (Match Score, Cover Letter, Email)

| ID | Requirement | Prioritas | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-19 | Match score 0-100 + ringkasan + strengths + gaps | P0 | Tersimpan di DB; klik ulang memakai cache tanpa kuota |
| FR-20 | Cover letter personal 1-2 paragraf, menyertakan portfolio, tanpa markdown | P0 | Tersimpan; dapat dicetak/PDF & disalin |
| FR-21 | Draft email lamaran (subject + body ringkas) | P1 | Tersimpan; dapat dicetak/PDF & disalin |
| FR-22 | Anti-halusinasi: hanya fakta profil, tanggal benar | P0 | Tidak mengarang perusahaan/tahun/sertifikat |
| FR-23 | Preferensi bahasa dokumen (ID/EN) dihormati | P1 | Output sesuai `ui_preferred_language` |
| FR-24 | Fallback provider AI (Gemini -> Zapi Copilot -> ChatEx -> ChatGPT) | P1 | Jika provider pertama gagal, lanjut ke berikutnya |
| FR-25 | Model AI dapat dikonfigurasi via env & tidak hardcode | P0 | Ganti model tanpa ubah kode (BUG-014) |

### 11.5 Profil & Settings

| ID | Requirement | Prioritas | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-26 | CRUD profil: identitas, kontak, skills, pengalaman, pendidikan | P0 | Tersimpan via `/api/profile/update` dengan whitelist field |
| FR-27 | Target pencarian: job titles, lokasi multi-select (38 provinsi + luar negeri), klasifikasi, tipe, arragement, remote, geo/location id | P0 | Tersimpan sebagai array; tampil ulang dengan benar |
| FR-28 | Jadwal auto-scrape: aktif/nonaktif + hari (WIB) | P1 | Tersimpan; konsisten dengan cron |
| FR-29 | Tidak ada duplikasi opsi lokasi / React key warning | P0 | Daftar opsi unik |
| FR-30 | Pengalaman/pendidikan diedit via form inline (bukan `prompt()`) | P1 | Modal/form dengan validasi (BUG-015) |
| FR-31 | Pengaturan tampilan/bahasa | P1 | Bahasa berganti tanpa reload; tema sesuai keputusan (lihat BUG-006) |

### 11.6 Billing & Kuota

| ID | Requirement | Prioritas | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-32 | Menampilkan kuota AI & scrape hari ini (terpakai/limit), portal terpakai | P0 | Sama persis dengan nilai RPC |
| FR-33 | Menampilkan status paket & tanggal berakhir | P0 | Label & format tanggal Indonesia |
| FR-34 | Instruksi pembayaran BCA + QRIS + tombol konfirmasi WhatsApp | P0 | Nomor/QRIS benar; pesan WhatsApp terisi email akun |
| FR-35 | Harga PRO/VIP 1 & 3 bulan tampil konsisten di landing, billing, dokumen | P1 | Tidak ada angka usang |
| FR-36 | Halaman billing tidak pernah macet di "Loading..." | P0 | Error/redirect ditangani (BUG-012) |

### 11.7 Cron / Auto-Scrape

| ID | Requirement | Prioritas | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-37 | Endpoint cron terlindungi `CRON_SECRET` | P0 | 401 tanpa bearer valid |
| FR-38 | Hanya memproses user `scrape_active=true` dan hari cocok | P0 | Query `.contains('scrape_days',[hari])` |
| FR-39 | Upsert anti-duplikat + update `last_scraped_at` | P0 | Tidak ada duplikat (BUG-011) |
| FR-40 | Kegagalan per user tidak menghentikan user lain | P1 | Loop dengan try/catch per user |

### 11.8 Multibahasa (i18n)

| ID | Requirement | Prioritas | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-41 | Semua copy UI melalui `t(key)` | P1 | Tidak ada teks hardcoded di komponen (BUG-028) |
| FR-42 | Bahasa default `id`, tersimpan di localStorage, SSR-safe | P0 | Tidak ada hydration mismatch |
| FR-43 | Atribut `<html lang>` mengikuti bahasa aktif | P2 | `lang="id"` default |

---

## 12. Requirement Non-Fungsional (NFR)

### 12.1 Keamanan
| ID | Requirement |
| --- | --- |
| NFR-01 | Tidak ada secret server di kode klien; hanya `NEXT_PUBLIC_*` yang boleh terekspos |
| NFR-02 | `SUPABASE_SERVICE_ROLE_KEY` hanya di server (cron), tidak pernah di bundle klien |
| NFR-03 | Semua endpoint API memvalidasi `user` dan input (whitelist action/status) |
| NFR-04 | Mutasi kuota hanya via RPC `consume_usage` |
| NFR-05 | Update profil memakai whitelist field (anti mass-assignment) |
| NFR-06 | Rate limiting per user/IP untuk endpoint AI & scrape |
| NFR-07 | Security headers di `next.config.ts` (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) |
| NFR-08 | Tidak ada `any`; strict TypeScript; lint & build hijau |
| NFR-09 | RLS aktif dan diuji untuk semua tabel |

### 12.2 Performa
| ID | Requirement |
| --- | --- |
| NFR-10 | Dashboard memakai server component + hanya data user (tidak over-fetch) |
| NFR-11 | Aksi AI/scrape menampilkan loading; request punya timeout (missal 45s untuk OCR) |
| NFR-12 | Cache hasil AI di DB untuk menghindari pemanggilan ulang |
| NFR-13 | Hindari full page reload; refetch/optimistic update (BUG-016) |

### 12.3 Responsif
| ID | Requirement |
| --- | --- |
| NFR-14 | Mobile-first: layout benar mulai 320px sampai 1440px+ |
| NFR-15 | Breakpoint standar: `sm` 640, `md` 768, `lg` 1024, `xl` 1280 |
| NFR-16 | Target sentuh minimal 44x44px |
| NFR-17 | Tabel/daftar kompleks berubah menjadi kartu di layar kecil |
| NFR-18 | Modal `max-h` + `overflow-y-auto`; full-height di mobile |
| NFR-19 | Navigasi horizontal scrollable dengan indikator, tanpa memecah layout |
| NFR-20 | Tidak ada horizontal overflow (scroll-x) tak diinginkan |
| NFR-21 | Mendukung safe-area inset perangkat (notch) |

### 12.4 Aksesibilitas
| ID | Requirement |
| --- | --- |
| NFR-22 | Kontras teks WCAG 2.1 AA pada tema terang |
| NFR-23 | Fokus terlihat (focus-visible ring) pada semua kontrol |
| NFR-24 | Semua gambar/ikon dekoratif `aria-hidden`; tombol punya `aria-label` |
| NFR-25 | Semua field form punya `<label>` terkait |
| NFR-26 | Modal dapat ditutup dengan ESC dan menahan fokus awal |
| NFR-27 | Struktur heading hierarkis (h1 -> h2 -> h3) |

### 12.5 Fleksibilitas & Pemeliharaan
| ID | Requirement |
| --- | --- |
| NFR-28 | Konfigurasi plan/kuota terpusat (idealnya DB-driven), bukan duplikat di banyak file |
| NFR-29 | Portal scraping mengikuti registry/adapter agar portal baru cukup 1 definisi |
| NFR-30 | Provider & model AI dapat dikonfigurasi env tanpa perubahan kode |
| NFR-31 | Migrasi idempotent, berurutan, dan terdokumentasi |
| NFR-32 | Komponen kecil, reusable, dan bebas dead code |
| NFR-33 | Error boundary + loading + not-found untuk UX yang jelas |
| NFR-34 | Logging server terstruktur untuk kegagalan AI/scrape |

---

## 13. Spesifikasi Responsif per Halaman

| Halaman | Mobile (<640) | Tablet (640-1023) | Desktop (>=1024) |
| --- | --- | --- | --- |
| Landing `/` | 1 kolom, hero 3xl, pricing bertumpuk, CTA penuh | pricing 3 kolom | max-width 6xl, hero 5xl |
| Navbar dashboard | 2 baris: logo+quota+toggle di atas, nav scroll di bawah | 1 baris, nav scroll + aksi kanan | 1 baris penuh |
| Dashboard | Analytics 1 kolom, action bar scroll-x, job card: action bar wrap | analytics 3 kolom, card lebih lega | max-width 6xl |
| Job card | Tag & aksi wrap, judul penuh | aksi sejajar | aksi sejajar kanan |
| Modal detail/score/letter | Full-width, tinggi <= 90vh, konten scroll | max-w-2xl | max-w-2xl |
| Profile form | Semua section 1 kolom | grid 2 kolom | grid 2-3 kolom |
| Settings | Lokasi dropdown `max-h-60`, chip wrap | 2 kolom | 2 kolom |
| Billing | Paket & metode bertumpuk | 2 kolom | 2 kolom |

**Kriteria uji perangkat:** iPhone SE (375), Android umum (360-412), iPad (768), laptop (1366), desktop (1440+). Uji juga orientasi landscape.

---

## 14. Register Bug & Risiko

Skala prioritas: **P0 = blocker/keamanan/data**, **P1 = fungsional penting**, **P2 = kualitas/UX**, **P3 = kosmetik**.

### P0

| ID | Judul | Lokasi | Dampak | Akar Masalah | Rekomendasi |
| --- | --- | --- | --- | --- | --- |
| BUG-001 | Landing & `/metode` tidak dapat diakses publik | `lib/supabase/middleware.ts` | Marketing & harga tak terlihat; CTA mati | Middleware redirect semua non-login/non-auth ke `/login` | Whitelist rute publik (`/`, `/metode`, `/login`, `/auth`); API kembalikan 401 JSON (lihat BUG-010); redirect user login dari `/` ke `/dashboard` |
| BUG-002 | Kuota konseptual `getTodayUsage` hanya 2 portal | `lib/quota/usage.ts` | Hitungan portal baru salah (fungsi saat ini dead code) | Filter hanya LinkedIn & Jobstreet; tidak filter `user_id` | Gunakan `SCRAPE_ACTIONS` dari `lib/quota/limits.ts` + `.eq('user_id', user.id)` |
| BUG-003 | Endpoint proxy scrape tanpa kuota | `app/api/scrape/{linkedin,jobstreet,indeed,glints,dealls}/route.ts` | Penyalahgunaan kuota Zapi (biaya) | Hanya cek auth; tak panggil `consume_usage` | Hapus endpoint (UI memakai `/api/scrape/run`) atau tambahkan kuota + rate limit |
| BUG-004 | Kuota tidak kembali saat AI/DB gagal | `api/jobs/parse`, `api/ai/match-score`, `cover-letter`, `email-draft`, `api/jobs/save` | User kehilangan kuota saat error | Consume kuota sebelum operasi; rollback hanya di `/api/ai/process` | Buat helper `withQuota(action, fn)` yang otomatis refund (hapus `usage_events` terakhir) saat `fn` gagal |
| BUG-005 | Perhitungan awal hari WIB salah di server UTC | `app/(dashboard)/layout.tsx`, `billing/page.tsx` | Angka kuota UI berbeda dari DB | Formula `(jakartaOffset + localOffset)` + `setHours` bergantung TZ server (Vercel = UTC) | Buat helper `getJakartaDayStartISO()`: jika UTC, kurangi 7 jam dari tengah malam UTC hari Jakarta |
| BUG-024 | Tidak ada security headers | `next.config.ts` | Rentan klikjacking/XSS/MIME sniffing | Config kosong | Tambah `headers()` global |
| BUG-026 | Insert manual tanpa `onConflict` | `api/jobs/save` | Error 500 saat duplikat `job_url` | Unique constraint `(user_id, job_url)` | Gunakan `upsert(..., { onConflict: 'user_id, job_url' })` atau tangani error duplikat dengan pesan ramah |

### P1

| ID | Judul | Lokasi | Dampak | Rekomendasi |
| --- | --- | --- | --- | --- |
| BUG-006 | Dark mode tak ada tapi UI menampilkan toggle | `theme-provider.tsx`, `theme-toggle.tsx`, `display-settings-card.tsx`, `(dashboard)/layout.tsx` | Kartu "Mode Tampilan" dengan kontrol tak terlihat | Hapus toggle & provider dari UI, atau implementasikan dark variant |
| BUG-007 | Kontras rendah pada komponen bergaya dark | `quota-card.tsx`, `profile-form.tsx`, `ai-tools.tsx`, `usage-test-buttons.tsx` | Teks sulit dibaca (gagal WCAG) | Ganti ke token light (`text-zinc-700`, `text-[#0C0B1E]`, `bg-[#F1F0FF]`) |
| BUG-008 | Update profil mass-assignment | `api/profile/update/route.ts` | Field sembarang bisa ditulis | Whitelist field yang diizinkan |
| BUG-010 | API tanpa auth di-redirect ke `/login` (HTML) | `lib/supabase/middleware.ts` | Klien menerima HTML, bukan 401 | Kecualikan `/api/*` dari redirect; biarkan route mengembalikan 401 |
| BUG-011 | Cron `insert` bukan `upsert`; `job_url` bisa null | `api/cron/scrape/route.ts` | Duplikat/data ganda | `upsert` dengan `onConflict`, canonical URL, tangani error |
| BUG-014 | Model & provider AI hardcode | `lib/ai/llm.ts` (`gemini-3.5-flash-lite`), `lib/ai/ocr.ts` | Model invalidd/berubah menyebabkan gagal total | Baca model dari env (mis. `GEMINI_MODEL`, `OCR_MODELS`) + validasi |
| BUG-016 | Full page reload setelah scrape | `components/dashboard/job-list.tsx` | Kehilangan state, UX lambat | Refetch data via `/api/jobs/list` atau router.refresh |
| BUG-019 | Tidak ada rate limiting | semua endpoint AI/scrape | Abuse biaya & kuota | Rate limit per user/IP (in-memory atau Supabase) |
| BUG-020 | Race condition kuota | RPC `consume_usage` | Bisa melebihi kuota saat request paralel | `pg_advisory_xact_lock(hashtext(user_id))` atau constraint per hari/action |
| BUG-022 | Label "Lamaran Minggu Ini" tanpa filter minggu | `app/(dashboard)/dashboard/page.tsx` | Angka tidak sesuai label | Filter `applied_at` 7 hari terakhir atau ubah label |
| BUG-025 | Fallback QRIS via manipulasi DOM `onError` | `billing-payment-card.tsx` | Rawan, tidak idiomatik | Gunakan state React untuk fallback gambar |
| BUG-028 | i18n bocor (teks hardcoded) | `job-list.tsx`, `billing`, `landing`, `metode`, form | Mode EN tetap menampilkan Indonesia | Pindahkan ke `translations.ts` (FR-41) |

### P2

| ID | Judul | Lokasi | Dampak | Rekomendasi |
| --- | --- | --- | --- | --- |
| BUG-009 | `.env.example` tidak lengkap | `.env.example` | Setup gagal; cron 401; fitur silent fail | Tambah `ZAPI_API_KEY`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` + deskripsi |
| BUG-012 | Billing macet "Loading..." bila profil null | `billing/page.tsx` | Dead-end UI | Redirect/error state |
| BUG-013 | `html lang="en"` & default theme 'dark' | `app/layout.tsx`, `theme-provider.tsx` | SEO/a11y & kontrak tema salah | `lang="id"`, default 'light' |
| BUG-015 | `prompt()` untuk pengalaman/pendidikan | `profile-form.tsx` | Tidak mobile-friendly, tak bisa validasi/edit | Form inline + modal |
| BUG-017 | Tidak ada error/loading/not-found page | `app/` | UX error default Next.js | Tambah `error.tsx`, `loading.tsx`, `not-found.tsx` |
| BUG-018 | Spinner tak terlihat di tombol terang | `components/ui/spinner.tsx` | Indikator loading hilang | Hapus `border-white/20`, gunakan `border-current/opacity` |
| BUG-021 | Duplikasi nomor migrasi & enum ganda | `supabase/migrations` | Kebingungan urutan; enum `analyze` vs `analyse` | Dokumentasikan urutan; jangan hapus nilai enum, cukup pakai `analyse` |
| BUG-023 | Harga usang di `PROJECT_LOG.txt` (Rp 25.000) | `PROJECT_LOG.txt` | Info menyesatkan | Selaraskan dengan tabel harga resmi |
| BUG-027 | `archived_at` tidak dibersihkan saat pindah dari archive | `api/jobs/{id}/status` | Metadata status tidak konsisten | Reset field timestamp sesuai transisi status |
| BUG-029 | Limit kuota ganda (client const vs DB) | `lib/quota/limits.ts` & RPC | Potensi drift | Jadikan RPC/DB sebagai sumber, client hanya untuk label |
| BUG-030 | Parameter Zapi tidak konsisten (`withinDays` vs `postedWithinDays`) | `api/scrape/run` & `api/scrape/jobstreet` | Hasil filter 24 jam bisa tidak seragam | Samakan kontrak parameter & uji live |
| BUG-031 | Dead code | `ai-tools.tsx`, `usage-test-buttons.tsx`, `account-summary.tsx`, `getTodayUsage` | Bundle & kebingungan | Hapus atau gunakan |

---

## 15. Backlog Remediasi (Urutan Eksekusi)

1. **Fase Aman & Publik (P0)** - BUG-001, BUG-010, BUG-024, BUG-003, BUG-019.
2. **Integritas Kuota (P0)** - BUG-004, BUG-005, BUG-020, BUG-002.
3. **Data & Duplikasi (P0/P1)** - BUG-026, BUG-011, BUG-030.
4. **Fleksibilitas AI (P1)** - BUG-014, BUG-008, BUG-012.
5. **UX & Responsif (P1)** - BUG-006, BUG-007, BUG-016, BUG-028.
6. **Kualitas (P2)** - BUG-009, BUG-013, BUG-015, BUG-017, BUG-018, BUG-021, BUG-023, BUG-025, BUG-027, BUG-029, BUG-031.

**Definisi selesai tiap item:** ada test/manual repro, lint & build hijau, tidak ada regresi, dokumentasi (bila perlu) diperbarui.

---

## 16. QA & Test Plan

### 16.1 Matriks Uji Wajib
- Auth: anonim buka `/` & `/metode`; user login buka `/`; logout.
- Kuota: habiskan AI/scrape FREE; cek batas portal tunggal; cek reset WIB.
- Quick Paste: teks saja, gambar saja, keduanya, file >5MB, tipe tidak didukung.
- AI: cache hit (tidak potong kuota), provider fallback, error -> kuota kembali.
- Pipeline: transisi status semua arah; filter; hapus.
- Settings: multi-lokasi (tidak ada key duplikat), simpan-ulang, jadwal.
- Billing: harga & kuota; tombol WhatsApp; QRIS fallback.
- Cron: 401 tanpa secret; hanya user cocok; tidak ada duplikat.
- Responsif: 320/375/414/768/1024/1440; landscape.

### 16.2 Regresi Otomatis (disarankan)
- Unit: helper kuota WIB, whitelist profil, parser jumlah portal.
- Integrasi API: mock Supabase RPC; assert rollback kuota pada error.
- E2E ringan (opsional): Playwright untuk login & Quick Paste.

---

## 17. Kriteria Penerimaan Rilis

- `npm run lint` sukses.
- `npm run build` sukses.
- Rute terproteksi redirect benar; rute publik terbuka.
- Dashboard memuat profil + kuota user yang login.
- Tombol uji kuota menghormati batas; error tidak mengorbankan kuota.
- Tidak ada secret ter-commit.
- Semua BUG P0 selesai; P1 terjadwal.
- Audit responsif lulus pada 6 ukuran layar.
- Tidak ada teks UI hardcoded (100% i18n) untuk halaman inti.

---

## 18. Roadmap (Setelah Remediasi)

| Fase | Item |
| --- | --- |
| Phase A | Bookmarklet "simpan dari web mana saja", Kanban drag & drop |
| Phase B | Bulk delete/auto-archive, notifikasi email (opsional), dark theme |
| Phase C | Admin dashboard ringan, analytics agregat, plan DB-driven penuh |
| Phase D | Observability (log & metrik), uji beban, hardening API |

---

## 19. Lampiran

### 19.1 Environment Variables
| Nama | Scope | Wajib | Keterangan |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Klien + Server | Ya | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Klien + Server | Ya | Anon/publishable key |
| `GEMINI_API_KEY` | Server | Ya | Provider AI utama |
| `ZAPI_API_KEY` | Server | Ya | Scraping + provider AI fallback |
| `VLEEE_API_KEY` | Server | Untuk OCR | OCR gambar Quick Paste |
| `SUPABASE_SERVICE_ROLE_KEY` | Server (cron) | Untuk cron | Jangan pernah ke klien |
| `CRON_SECRET` | Server | Untuk cron | Validasi Bearer cron |
| `GEMINI_MODEL` | Server | Disarankan | Model Gemini konfigurable (BUG-014) |
| `OCR_MODELS` | Server | Disarankan | Daftar model OCR konfigurable |

### 19.2 Design Tokens (Pepelsbey Light)
- Background: `#FFFFFF`
- Foreground / Ink Navy: `#0C0B1E`
- Accent / Neon Lime: `#C1EF7B`
- Muted / Tint: `#F1F0FF`
- Radius: `rounded-sm` (2px)
- Font: Geist Sans / Geist Mono

### 19.3 Glosarium
- **Kuota AI**: gabungan `AI_EXTRACT` + `AI_GENERATE` per hari.
- **Kuota Scrape**: gabungan semua `SCRAPE_*` per hari.
- **Quick Paste**: input lowongan bebas (teks/gambar) yang diekstrak AI.
- **Match Score**: skor 0-100 kecocokan profil-lowongan.
- **Pipeline**: alur status `discover -> analyse -> apply / refuse -> archive`.

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-zinc-800 selection:text-white">
      {/* Top Bar Editorial */}
      <header className="border-b border-[var(--border)] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span className="font-mono text-sm tracking-wider uppercase text-zinc-400">
              JOB HUNTING OS
            </span>
            <span className="rounded border border-zinc-700 bg-zinc-900/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
              STABLE MVP
            </span>
          </Link>
          <div>
            {user ? (
              <Link
                href="/dashboard"
                className="font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-300"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-300"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section: High Impact Typography, Instant Understanding (< 10 detik) */}
      <section className="border-b border-[var(--border)] px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-6">
            ALAT BANTU PELACAKAN DAN KURASI KERJA
          </p>
          <h1 className="text-3xl font-medium tracking-tight sm:text-5xl sm:leading-[1.15] text-zinc-100">
            Hentikan mengirim lamaran massal yang sia-sia.
            <span className="block text-zinc-500">
              Gunakan sistem kurasi terstruktur dan ekstrak lowongan berbasis kuota terukur.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Job Hunting OS dirancang untuk pencari kerja dan profesional yang menghargai ketelitian.
            Ekstraksi kualifikasi lowongan dari LinkedIn & Jobstreet, susun cover letter kontekstual
            dengan AI, dan pantau batas aplikasi harian Anda tanpa distraksi.
          </p>

          <div className="mt-10">
            <Link
              href={user ? '/dashboard' : '/login'}
              className="inline-flex h-12 items-center justify-center rounded bg-zinc-100 px-7 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-950 transition-colors hover:bg-zinc-300"
            >
              {user ? 'Buka Dashboard' : 'Mulai Sekarang'}
            </Link>
          </div>
        </div>
      </section>

      {/* Metode Section — Compact variant (external page-ready) */}
      <section className="border-b border-[var(--border)] px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
              01 / METODE KERJA
            </span>
            <h2 className="mt-3 mx-auto max-w-xl text-xl font-medium tracking-tight text-zinc-100">
              Disiplin kuota harian menghasilkan kualitas lamaran yang lebih tinggi.
            </h2>
            <Link
              href="/metode"
              className="mt-4 inline-block font-mono text-xs text-zinc-500 underline decoration-zinc-700 underline-offset-4 transition-colors hover:text-zinc-300"
            >
              Pelajari cara kerja sistem
            </Link>
          </div>

          <div className="mx-auto max-w-3xl divide-y divide-[var(--border)] rounded border border-[var(--border)] bg-[var(--card)]">
            {/* Feature toggle — ponytail: upgrade to <details> accordion when >3 items */}
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-900/50 [&::-webkit-details-marker]:hidden">
                <span>AI Job Parser</span>
                <span className="font-mono text-xs text-zinc-600 transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="px-5 pb-5 text-xs leading-relaxed text-zinc-400">
                Membedah deskripsi panjang menjadi poin ringkas: posisi, rentang gaji, tech
                stack utama, dan syarat pengalaman mutlak.
              </div>
            </details>

            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-900/50 [&::-webkit-details-marker]:hidden">
                <span>Portal Agregator</span>
                <span className="font-mono text-xs text-zinc-600 transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="px-5 pb-5 text-xs leading-relaxed text-zinc-400">
                Satu portal pilihan per hari untuk paket Gratis (LinkedIn atau Jobstreet) —
                menjaga fokus dan mencegah kejenuhan pencarian.
              </div>
            </details>

            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-900/50 [&::-webkit-details-marker]:hidden">
                <span>Draft Cover Letter Kontekstual</span>
                <span className="font-mono text-xs text-zinc-600 transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="px-5 pb-5 text-xs leading-relaxed text-zinc-400">
                Menghasilkan draf surat pengantar yang langsung mengaitkan pengalaman relevan
                dengan kebutuhan riil perusahaan tujuan.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Model Transparansi: Free vs Pro */}
      <section className="border-b border-[var(--border)] px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
              02 / AKSES & KUOTA
            </span>
            <h2 className="mt-2 text-xl font-medium text-zinc-200">
              Transparan sejak awal. Tanpa jebakan langganan otomatis.
            </h2>
          </div>

          <div className="grid gap-px bg-[var(--border)] sm:grid-cols-2">
            <div className="bg-[var(--card)] p-8">
              <span className="font-mono text-xs text-zinc-500">PAKET DASAR</span>
              <h3 className="mt-2 text-2xl font-medium text-zinc-100">Gratis Selamanya</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Cukup login dengan Google untuk mulai menata pencarian kerja harian.
              </p>
              <ul className="mt-6 space-y-2 border-t border-[var(--border)] pt-6 font-mono text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="text-zinc-500">&mdash;</span> 3x kuota ekstraksi & draf AI / hari
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-zinc-500">&mdash;</span> 1 portal scraping / hari
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-zinc-500">&mdash;</span> Reset otomatis setiap tengah malam (WIB)
                </li>
              </ul>
            </div>

            <div className="bg-[var(--card)] p-8 border border-[var(--border)]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-500">PAKET INTENSIF</span>
                <span className="rounded-sm bg-[#C1EF7B] px-2 py-0.5 font-mono text-[10px] text-[#0C0B1E] font-semibold border border-[#a5df48]">
                  VERIFIKASI MANUAL
                </span>
              </div>
              <h3 className="mt-2 text-2xl font-medium text-[var(--foreground)]">Pro Plan</h3>
              <p className="mt-2 text-sm text-zinc-500">
                Untuk periode aktif pencarian kerja intensif dengan kuota berlipat.
              </p>
              <ul className="mt-6 space-y-2 border-t border-[var(--border)] pt-6 font-mono text-xs text-zinc-600">
                <li className="flex items-center gap-2">
                  <span className="text-[#C1EF7B]">&mdash;</span> 30x kuota pemrosesan AI / hari
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#C1EF7B]">&mdash;</span> 10x scraping lintas semua portal
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#C1EF7B]">&mdash;</span> Aktivasi manual via QRIS / transfer langsung
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Minimalis */}
      <footer className="px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 font-mono text-xs text-zinc-500 sm:flex-row sm:items-center">
          <div>JOB HUNTING OS &bull; DIRANCANG DENGAN PRINSIP PRAKTIS</div>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-zinc-300">
              Masuk
            </Link>
            <Link href="/billing" className="hover:text-zinc-300">
              Struktur Billing
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

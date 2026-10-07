import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[#C1EF7B] selection:text-[#0C0B1E]">
      {/* Top Bar Editorial */}
      <header className="border-b border-[var(--border)] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span className="font-mono text-sm tracking-wider uppercase text-zinc-700 font-semibold">
              JOB HUNTING OS
            </span>
            <span className="rounded-sm border border-zinc-300 bg-[#F1F0FF] px-1.5 py-0.5 font-mono text-[10px] text-[#0C0B1E] font-medium">
              STABLE MVP
            </span>
          </Link>
          <div>
            {user ? (
              <Link
                href="/dashboard"
                className="font-mono text-xs text-zinc-700 transition-colors hover:text-[#0C0B1E] font-medium"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="font-mono text-xs text-zinc-700 transition-colors hover:text-[#0C0B1E] font-medium"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-[var(--border)] px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-600 font-semibold mb-6">
            ALAT BANTU PELACAKAN DAN KURASI KERJA
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl sm:leading-[1.15] text-[#0C0B1E]">
            Hentikan mengirim lamaran massal yang sia-sia.
            <span className="block text-zinc-600 mt-2 font-normal text-2xl sm:text-3xl">
              Gunakan sistem kurasi terstruktur dan ekstrak lowongan berbasis kuota terukur.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-700 sm:text-lg">
            Job Hunting OS dirancang untuk pencari kerja dan profesional yang menghargai ketelitian.
            Ekstraksi kualifikasi lowongan dari LinkedIn & Jobstreet, susun cover letter kontekstual
            dengan AI, dan pantau batas aplikasi harian Anda tanpa distraksi.
          </p>

          <div className="mt-10">
            <Link
              href={user ? '/dashboard' : '/login'}
              className="inline-flex h-12 items-center justify-center rounded-sm bg-[#0C0B1E] px-7 font-mono text-xs font-semibold uppercase tracking-wider text-[#C1EF7B] transition-colors hover:bg-[#1a1936] shadow-sm"
            >
              {user ? 'Buka Dashboard' : 'Mulai Sekarang'}
            </Link>
          </div>
        </div>
      </section>

      {/* Metode Section */}
      <section className="border-b border-[var(--border)] px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-600 font-semibold">
              01 / METODE KERJA
            </span>
            <h2 className="mt-3 mx-auto max-w-xl text-xl font-bold tracking-tight text-[#0C0B1E]">
              Disiplin kuota harian menghasilkan kualitas lamaran yang lebih tinggi.
            </h2>
            <Link
              href="/metode"
              className="mt-4 inline-block font-mono text-xs text-zinc-700 underline decoration-zinc-400 underline-offset-4 transition-colors hover:text-[#0C0B1E]"
            >
              Pelajari cara kerja sistem
            </Link>
          </div>

          <div className="mx-auto max-w-3xl divide-y divide-[var(--border)] rounded-sm border border-[var(--border)] bg-[var(--card)]">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-sm font-semibold text-[#0C0B1E] transition-colors hover:bg-[#F1F0FF] [&::-webkit-details-marker]:hidden">
                <span>AI Job Parser</span>
                <span className="font-mono text-xs text-zinc-700 transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="px-5 pb-5 text-xs leading-relaxed text-zinc-700 font-mono">
                Membedah deskripsi panjang menjadi poin ringkas: posisi, rentang gaji, tech
                stack utama, dan syarat pengalaman mutlak.
              </div>
            </details>

            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-sm font-semibold text-[#0C0B1E] transition-colors hover:bg-[#F1F0FF] [&::-webkit-details-marker]:hidden">
                <span>Portal Agregator</span>
                <span className="font-mono text-xs text-zinc-700 transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="px-5 pb-5 text-xs leading-relaxed text-zinc-700 font-mono">
                Satu portal pilihan per hari untuk paket Gratis (LinkedIn atau Jobstreet) —
                menjaga fokus dan mencegah kejenuhan pencarian.
              </div>
            </details>

            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-sm font-semibold text-[#0C0B1E] transition-colors hover:bg-[#F1F0FF] [&::-webkit-details-marker]:hidden">
                <span>Draft Cover Letter Kontekstual</span>
                <span className="font-mono text-xs text-zinc-700 transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="px-5 pb-5 text-xs leading-relaxed text-zinc-700 font-mono">
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
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-600 font-semibold">
              02 / AKSES & KUOTA
            </span>
            <h2 className="mt-2 text-xl font-bold text-[#0C0B1E]">
              Transparan sejak awal. Tanpa jebakan langganan otomatis.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-[var(--card)] p-8 border border-[var(--border)] rounded-sm">
              <span className="font-mono text-xs text-zinc-600 font-semibold">PAKET DASAR</span>
              <h3 className="mt-2 text-2xl font-bold text-[#0C0B1E]">Gratis Selamanya</h3>
              <p className="mt-2 text-sm text-zinc-700">
                Cukup login dengan Google untuk mulai menata pencarian kerja harian.
              </p>
              <ul className="mt-6 space-y-2 border-t border-[var(--border)] pt-6 font-mono text-xs text-zinc-700">
                <li className="flex items-center gap-2">
                  <span className="text-[#0C0B1E] font-bold">&mdash;</span> 3x kuota ekstraksi & draf AI / hari
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#0C0B1E] font-bold">&mdash;</span> 1 portal scraping / hari
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#0C0B1E] font-bold">&mdash;</span> Reset otomatis setiap tengah malam (WIB)
                </li>
              </ul>
            </div>

            <div className="bg-[var(--card)] p-8 border border-[var(--border)] rounded-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-600 font-semibold">PAKET INTENSIF</span>
                <span className="rounded-sm bg-[#C1EF7B] px-2 py-0.5 font-mono text-[10px] text-[#0C0B1E] font-semibold border border-[#a5df48]">
                  PALING LARIS
                </span>
              </div>
              <h3 className="mt-2 text-2xl font-bold text-[#0C0B1E]">Pro Plan</h3>
              <p className="mt-2 text-sm text-zinc-700">
                Mulai Rp 49.000/bln (atau Rp 129.000/3 bln) untuk pencarian kerja harian.
              </p>
              <ul className="mt-6 space-y-2 border-t border-[var(--border)] pt-6 font-mono text-xs text-zinc-700">
                <li className="flex items-center gap-2">
                  <span className="text-[#0C0B1E] font-bold">&mdash;</span> 30x kuota pemrosesan AI / hari
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#0C0B1E] font-bold">&mdash;</span> 10x scraping di semua 5 portal
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#0C0B1E] font-bold">&mdash;</span> Auto-scraping via Cron aktif
                </li>
              </ul>
            </div>

            <div className="bg-[var(--card)] p-8 border border-[var(--border)] rounded-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-600 font-semibold">PAKET POWER</span>
                <span className="rounded-sm bg-purple-100 px-2 py-0.5 font-mono text-[10px] text-purple-900 font-semibold border border-purple-300">
                  MASS APPLY
                </span>
              </div>
              <h3 className="mt-2 text-2xl font-bold text-[#0C0B1E]">VIP Plan</h3>
              <p className="mt-2 text-sm text-zinc-700">
                Mulai Rp 99.000/bln (atau Rp 249.000/3 bln) untuk pelamar super agresif.
              </p>
              <ul className="mt-6 space-y-2 border-t border-[var(--border)] pt-6 font-mono text-xs text-zinc-700">
                <li className="flex items-center gap-2">
                  <span className="text-[#0C0B1E] font-bold">&mdash;</span> 100x kuota pemrosesan AI / hari
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#0C0B1E] font-bold">&mdash;</span> 25x scraping di semua portal
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#0C0B1E] font-bold">&mdash;</span> Prioritas cron & support WhatsApp
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Minimalis */}
      <footer className="px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 font-mono text-xs text-zinc-700 sm:flex-row sm:items-center">
          <div>JOB HUNTING OS &bull; DIRANCANG DENGAN PRINSIP PRAKTIS</div>
          <div className="flex gap-6 font-medium">
            <Link href="/login" className="hover:text-[#0C0B1E]">
              Masuk
            </Link>
            <Link href="/billing" className="hover:text-[#0C0B1E]">
              Struktur Billing
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

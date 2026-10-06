import Link from 'next/link';

export default function MetodePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)] px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="font-mono text-xs text-zinc-700 hover:text-[#0C0B1E] font-medium">
            &larr; Kembali ke Utama
          </Link>
          <span className="font-mono text-xs text-zinc-700 font-semibold">DOKUMENTASI SISTEM</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <span className="font-mono text-xs uppercase tracking-wider text-zinc-600 font-semibold">METODE KERJA</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0C0B1E]">
          Prinsip Kuantitas Terkontrol vs. Lamaran Massal
        </h1>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-800">
          <p>
            Mayoritas pelamar gagal bukan karena kurangnya kualifikasi, melainkan karena kelelahan
            mengirim puluhan lamaran yang tidak disesuaikan.
          </p>
          <p>
            Job Hunting OS memaksa pendekatan berbasis riset ringkas:
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-700 font-mono text-xs">
            <li>Ekstraksi poin kualifikasi tanpa membaca paragraf iklan yang berbelit.</li>
            <li>Pembatasan 1 portal per hari agar fokus tidak terpecah antara LinkedIn dan Jobstreet.</li>
            <li>Pembuatan draft cover letter khusus yang hanya menyorot relevansi pengalaman utama.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

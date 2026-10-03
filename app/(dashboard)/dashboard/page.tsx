import { requireUser } from '@/lib/auth/require-user';

export default async function DashboardPage() {
  await requireUser();

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-zinc-400">Lowongan yang telah berhasil dikumpulkan</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
        <div className="mx-auto max-w-md">
          <svg 
            className="mx-auto h-16 w-16 text-zinc-700 dark:text-zinc-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-zinc-100">Belum Ada Lowongan Tersimpan</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Hasil scraping dari LinkedIn dan Jobstreet akan otomatis tampil di sini.
            Mulai dengan mengklik tombol scraping di halaman Billing atau gunakan AI Tools.
          </p>
        </div>
      </div>
    </div>
  );
}
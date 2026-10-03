import { requireUser } from '@/lib/auth/require-user';
import { SignOutButton } from '@/components/dashboard/sign-out-button';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-zinc-950">
        <header className="sticky top-0 z-50 mx-auto w-full max-w-7xl border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
                Job Hunting OS
              </Link>
              <nav className="flex gap-1">
                <Link 
                  href="/dashboard" 
                  className="rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-zinc-800/50"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/profile" 
                  className="rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-zinc-800/50"
                >
                  Profil
                </Link>
                <Link 
                  href="/billing" 
                  className="rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-zinc-800/50"
                >
                  Billing
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <SignOutButton />
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}

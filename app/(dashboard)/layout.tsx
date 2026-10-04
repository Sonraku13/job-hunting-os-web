import { requireUser } from '@/lib/auth/require-user';
import { SignOutButton } from '@/components/dashboard/sign-out-button';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { NavLinks } from '@/components/dashboard/nav-links';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors">
        <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl transition-colors">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-3 space-y-3 sm:space-y-0 sm:py-0 sm:min-h-16 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div className="flex items-center justify-between gap-3">
              <Link href="/dashboard" className="text-base sm:text-lg font-semibold tracking-tight whitespace-nowrap">
                Job Hunting OS
              </Link>
              <div className="flex sm:hidden items-center gap-1">
                <ThemeToggle />
                <SignOutButton />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 overflow-x-auto no-scrollbar">
                <NavLinks />
              </div>
              <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                <ThemeToggle />
                <SignOutButton />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}

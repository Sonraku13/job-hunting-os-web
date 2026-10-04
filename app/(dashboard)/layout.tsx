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
        <header className="sticky top-0 z-50 mx-auto w-full max-w-7xl border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl transition-colors">
          <div className="flex h-16 sm:h-20 flex-wrap items-center justify-between px-4 sm:px-6 lg:px-8 gap-4 py-2 sm:py-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 overflow-hidden w-full sm:w-auto">
              <div className="flex items-center justify-between w-full sm:w-auto">
                <Link href="/dashboard" className="text-base sm:text-lg font-semibold tracking-tight whitespace-nowrap">
                  Job Hunting OS
                </Link>
                <div className="flex sm:hidden items-center gap-2">
                  <ThemeToggle />
                  <SignOutButton />
                </div>
              </div>
              <div className="overflow-x-auto pb-1 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
                <NavLinks />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <ThemeToggle />
              <SignOutButton />
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

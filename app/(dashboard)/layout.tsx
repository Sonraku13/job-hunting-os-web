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
      <div className="min-h-screen flex flex-col bg-zinc-950">
        <header className="sticky top-0 z-50 mx-auto w-full max-w-7xl border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 sm:gap-6 overflow-hidden">
              <Link href="/dashboard" className="text-base sm:text-lg font-semibold tracking-tight whitespace-nowrap">
                Job Hunting OS
              </Link>
              <NavLinks />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
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

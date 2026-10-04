import { requireUser } from '@/lib/auth/require-user';
import { createClient } from '@/lib/supabase/server';
import { SignOutButton } from '@/components/dashboard/sign-out-button';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { NavLinks } from '@/components/dashboard/nav-links';
import { QuotaBadge } from '@/components/dashboard/quota-badge';
import { PlanType } from '@/lib/quota/limits';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const today = new Date();
  const jakartaOffset = 7 * 60;
  const localOffset = today.getTimezoneOffset();
  const jakartaTime = new Date(today.getTime() + (jakartaOffset + localOffset) * 60000);
  jakartaTime.setHours(0, 0, 0, 0);

  const { data: events } = await supabase
    .from('usage_events')
    .select('action')
    .eq('user_id', user.id)
    .gte('created_at', jakartaTime.toISOString());

  const scrapeUsed =
    events?.filter((e) => e.action === 'SCRAPE_LINKEDIN' || e.action === 'SCRAPE_JOBSTREET')
      .length || 0;

  const plan = (profile?.plan as PlanType) || 'FREE';

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors">
        <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl transition-colors">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-3 space-y-3 sm:space-y-0 sm:py-0 sm:min-h-16 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div className="flex items-center justify-between gap-3">
              <Link href="/dashboard" className="text-base sm:text-lg font-semibold tracking-tight whitespace-nowrap">
                Job Hunting OS
              </Link>
              <div className="flex sm:hidden items-center gap-2">
                <QuotaBadge plan={plan} usedToday={scrapeUsed} />
                <LanguageToggle />
                <ThemeToggle />
                <SignOutButton />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 overflow-x-auto no-scrollbar">
                <NavLinks />
              </div>
              <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                <QuotaBadge plan={plan} usedToday={scrapeUsed} />
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

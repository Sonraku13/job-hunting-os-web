import { requireUser } from '@/lib/auth/require-user';
import { SignOutButton } from '@/components/dashboard/sign-out-button';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold">Job Hunting OS</h1>
              <nav className="flex gap-4">
                <Link href="/dashboard" className="text-sm hover:text-blue-400">
                  Dashboard
                </Link>
                <Link href="/billing" className="text-sm hover:text-blue-400">
                  Billing
                </Link>
              </nav>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

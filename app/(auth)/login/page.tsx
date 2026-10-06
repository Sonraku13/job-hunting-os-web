import { GoogleLoginButton } from '@/components/auth/google-login-button';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-[#0C0B1E]">Job Hunting OS</h1>
          <p className="mt-2 text-zinc-700">Kelola peluang kerja dengan strategi terbaik</p>
        </div>
        <div className="rounded-sm border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
          <GoogleLoginButton />
        </div>
      </div>
    </div>
  );
}

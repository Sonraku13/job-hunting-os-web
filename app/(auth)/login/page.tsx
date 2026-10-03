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
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Job Hunting OS</h1>
          <p className="text-gray-400">Masuk untuk melanjutkan</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
          <GoogleLoginButton />
        </div>
      </div>
    </div>
  );
}

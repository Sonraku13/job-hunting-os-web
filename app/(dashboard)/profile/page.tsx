import { requireUser } from '@/lib/auth/require-user';
import { createClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/components/dashboard/profile-form';
import Link from 'next/link';

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profil Profesional</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Kelola data diri, riwayat karir, dan konteks AI untuk personalisasi cover letter & analisa lowongan.
          </p>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 rounded-lg px-3 py-2 transition-colors self-start sm:self-auto"
        >
          ⚙️ Pengaturan Scraping →
        </Link>
      </div>

      <ProfileForm initialProfile={userProfile || { full_name: user.user_metadata?.full_name || '' }} />
    </div>
  );
}

import { requireUser } from '@/lib/auth/require-user';
import { createClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/components/dashboard/profile-form';

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil & Preferensi Karir</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Data ini menjadi acuan AI untuk menyesuaikan cover letter, match score, dan kurasi lowongan
        </p>
      </div>

      <ProfileForm initialProfile={userProfile || { full_name: user.user_metadata?.full_name || '' }} />
    </div>
  );
}

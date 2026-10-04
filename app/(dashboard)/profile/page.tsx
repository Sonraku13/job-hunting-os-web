import { requireUser } from '@/lib/auth/require-user';
import { createClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/components/dashboard/profile-form';
import { ProfileHeader } from '@/components/dashboard/profile-header';

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="max-w-4xl space-y-6">
      <ProfileHeader />
      <ProfileForm initialProfile={userProfile || {}} userFullName={user.user_metadata?.full_name} />
    </div>
  );
}

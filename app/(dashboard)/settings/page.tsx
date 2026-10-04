import { requireUser } from '@/lib/auth/require-user';
import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from '@/components/dashboard/settings-form';
import { SettingsHeader } from '@/components/dashboard/settings-header';
import { DisplaySettingsCard } from '@/components/dashboard/display-settings-card';

export const metadata = {
  title: 'Pengaturan | Job Hunting OS',
};

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="max-w-4xl space-y-6">
      <SettingsHeader />
      <DisplaySettingsCard />
      <SettingsForm initialSettings={userProfile || {}} />
    </div>
  );
}

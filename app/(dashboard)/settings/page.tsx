import { requireUser } from '@/lib/auth/require-user';
import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from '@/components/dashboard/settings-form';

export const metadata = {
  title: 'Pengaturan Pencarian | Job Hunting OS',
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
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan Pencarian & Scraping</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Atur kriteria lowongan incaran Anda dan jadwal otomatisasi pengambilan lowongan baru.
        </p>
      </div>

      <SettingsForm initialSettings={userProfile || {}} />
    </div>
  );
}

import { requireUser } from '@/lib/auth/require-user';
import { createClient } from '@/lib/supabase/server';
import { JobList, type SavedJob } from '@/components/dashboard/job-list';

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from('saved_jobs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Daftar lowongan kerja yang telah dikurasi dan tersimpan di database Anda
        </p>
      </div>

      <JobList initialJobs={(jobs as SavedJob[]) || []} />
    </div>
  );
}

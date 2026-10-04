import { requireUser } from '@/lib/auth/require-user';
import { createClient } from '@/lib/supabase/server';
import { JobList, type SavedJob } from '@/components/dashboard/job-list';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

export const dynamic = 'force-dynamic';

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
      <DashboardHeader />
      <JobList initialJobs={(jobs as SavedJob[]) || []} />
    </div>
  );
}

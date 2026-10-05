import { requireUser } from '@/lib/auth/require-user';
import { createClient } from '@/lib/supabase/server';
import { JobList, type SavedJob } from '@/components/dashboard/job-list';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { AnalyticsCards } from '@/components/dashboard/analytics-cards';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from('saved_jobs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const jobList = (jobs as SavedJob[]) || [];
  const jobsFound = jobList.length;
  const jobsApplied = jobList.filter((j) => j.status === 'apply').length;
  
  const scoredJobs = jobList.filter((j) => typeof j.match_score === 'number' && j.match_score > 0);
  const avgMatchScore =
    scoredJobs.length > 0
      ? scoredJobs.reduce((acc, curr) => acc + (curr.match_score || 0), 0) / scoredJobs.length
      : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      <DashboardHeader />
      <AnalyticsCards
        jobsFound={jobsFound}
        jobsApplied={jobsApplied}
        avgMatchScore={avgMatchScore}
      />
      <JobList initialJobs={jobList} />
    </div>
  );
}

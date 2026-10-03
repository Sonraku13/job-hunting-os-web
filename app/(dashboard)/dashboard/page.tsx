import { requireUser } from '@/lib/auth/require-user';
import { createClient } from '@/lib/supabase/server';
import { AccountSummary } from '@/components/dashboard/account-summary';
import { QuotaCard } from '@/components/dashboard/quota-card';
import { UsageTestButtons } from '@/components/dashboard/usage-test-buttons';
import { AITools } from '@/components/dashboard/ai-tools';
import { QUOTA_LIMITS, type PlanType } from '@/lib/quota/limits';

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return <div>Loading...</div>;
  }

  const today = new Date();
  const jakartaOffset = 7 * 60;
  const localOffset = today.getTimezoneOffset();
  const jakartaTime = new Date(today.getTime() + (jakartaOffset + localOffset) * 60000);
  jakartaTime.setHours(0, 0, 0, 0);

  const { data: events } = await supabase
    .from('usage_events')
    .select('action, portal')
    .eq('user_id', user.id)
    .gte('created_at', jakartaTime.toISOString())
    .order('created_at', { ascending: true });

  const aiUsed =
    events?.filter((e) => e.action === 'AI_EXTRACT' || e.action === 'AI_GENERATE').length || 0;

  const scrapeUsed =
    events?.filter((e) => e.action === 'SCRAPE_LINKEDIN' || e.action === 'SCRAPE_JOBSTREET')
      .length || 0;

  const portal =
    events?.find((e) => e.action === 'SCRAPE_LINKEDIN' || e.action === 'SCRAPE_JOBSTREET')
      ?.portal || null;

  const plan: PlanType = profile.plan as PlanType;
  const limits = QUOTA_LIMITS[plan];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <AccountSummary
          email={profile.email || user.email || ''}
          fullName={profile.full_name || ''}
          plan={plan}
          paidUntil={profile.paid_until}
        />
        <div className="space-y-4">
          <QuotaCard title="AI Quota" used={aiUsed} limit={limits.AI} />
          <QuotaCard title="Scraping Quota" used={scrapeUsed} limit={limits.SCRAPE} portal={portal} />
        </div>
      </div>
      <AITools />
      <UsageTestButtons />
    </div>
  );
}

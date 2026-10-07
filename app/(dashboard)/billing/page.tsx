import { requireUser } from '@/lib/auth/require-user';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { QuotaCard } from '@/components/dashboard/quota-card';
import { BillingPaymentCard } from '@/components/dashboard/billing-payment-card';
import { QUOTA_LIMITS, SCRAPE_ACTIONS, type PlanType } from '@/lib/quota/limits';

export default async function BillingPage() {
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

  const rawPlan = profile.plan as string;
  const plan: PlanType = (rawPlan === 'PAID' ? 'PRO' : rawPlan) as PlanType;
  const limits = QUOTA_LIMITS[plan] || QUOTA_LIMITS.FREE;
  const planLabel =
    plan === 'ADMIN'
      ? 'ADMIN (UNLIMITED)'
      : plan === 'VIP'
      ? 'VIP PLAN'
      : plan === 'PRO'
      ? 'PRO PLAN'
      : 'FREE PLAN';

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
    events?.filter((e) => SCRAPE_ACTIONS.includes(e.action as import('@/lib/quota/limits').UsageAction)).length || 0;

  const portal =
    events?.find((e) => SCRAPE_ACTIONS.includes(e.action as import('@/lib/quota/limits').UsageAction))
      ?.portal || null;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0C0B1E]">Billing & Batasan Kuota</h1>
        <p className="mt-2 text-zinc-700">Pantau pemakaian harian dan kelola paket langganan Anda</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuotaCard title="AI Quota" used={aiUsed} limit={limits.AI} />
        <QuotaCard title="Scraping Quota" used={scrapeUsed} limit={limits.SCRAPE} portal={portal} />
      </div>

      <Card>
        <h2 className="text-xl font-semibold mb-6 text-[#0C0B1E]">Status Paket</h2>
        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between border-b border-[var(--border)] pb-3">
            <span className="text-zinc-700 font-semibold">PAKET</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-sm border ${
                plan === 'VIP'
                  ? 'bg-purple-200 text-purple-900 border-purple-300'
                  : plan === 'PRO'
                  ? 'bg-[#C1EF7B] text-[#0C0B1E] border-[#a5df48]'
                  : plan === 'ADMIN'
                  ? 'bg-purple-200 text-purple-900 border-purple-300'
                  : 'bg-[#F1F0FF] text-[#0C0B1E] border-zinc-200'
              }`}
            >
              {planLabel}
            </span>
          </div>
          {(plan === 'PRO' || plan === 'VIP' || plan === 'ADMIN') && profile.paid_until && (
            <div className="flex justify-between border-b border-[var(--border)] pb-3">
              <span className="text-zinc-700 font-semibold">BERLAKU HINGGA</span>
              <span className="text-[#0C0B1E] font-medium">
                {new Date(profile.paid_until).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      </Card>

      {plan === 'FREE' ? (
        <BillingPaymentCard userEmail={user.email || ''} />
      ) : (
        <>
          <BillingPaymentCard userEmail={user.email || ''} />
          <p className="text-xs text-zinc-700 font-mono text-center">
            Anda saat ini memakai paket {planLabel} — tampilan pembayaran di atas dapat digunakan untuk perpanjang atau upgrade.
          </p>
        </>
      )}
    </div>
  );
}
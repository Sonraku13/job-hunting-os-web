import { requireUser } from '@/lib/auth/require-user';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { QuotaCard } from '@/components/dashboard/quota-card';
import { BillingPaymentCard } from '@/components/dashboard/billing-payment-card';
import { QUOTA_LIMITS, type PlanType } from '@/lib/quota/limits';

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

  const plan: PlanType = profile.plan as PlanType;
  const limits = QUOTA_LIMITS[plan] || QUOTA_LIMITS.FREE;
  const planLabel = plan === 'ADMIN' ? 'ADMIN (UNLIMITED)' : plan === 'PAID' ? 'PRO PLAN' : 'FREE PLAN';

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

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Batasan Kuota</h1>
        <p className="mt-2 text-zinc-400">Pantau pemakaian harian dan kelola paket langganan Anda</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuotaCard title="AI Quota" used={aiUsed} limit={limits.AI} />
        <QuotaCard title="Scraping Quota" used={scrapeUsed} limit={limits.SCRAPE} portal={portal} />
      </div>

      <Card>
        <h2 className="text-xl font-semibold mb-6">Status Paket</h2>
        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between border-b border-zinc-800/60 pb-3">
            <span className="text-zinc-500">PAKET</span>
            <span
              className={`font-semibold ${
                plan === 'PAID' ? 'text-emerald-400' : plan === 'ADMIN' ? 'text-purple-400' : 'text-blue-400'
              }`}
            >
              {planLabel}
            </span>
          </div>
          {(plan === 'PAID' || plan === 'ADMIN') && profile.paid_until && (
            <div className="flex justify-between border-b border-zinc-800/60 pb-3">
              <span className="text-zinc-500">BERLAKU HINGGA</span>
              <span className="text-zinc-200">
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
          <p className="text-xs text-zinc-500 font-mono text-center">
            Anda saat ini memakai paket {planLabel} — tampilan pembayaran di atas hanya untuk pratinjau / upgrade user FREE.
          </p>
        </>
      )}
    </div>
  );
}
import { requireUser } from '@/lib/auth/require-user';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { QuotaCard } from '@/components/dashboard/quota-card';
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
  const limits = QUOTA_LIMITS[plan];

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
                plan === 'PAID' ? 'text-emerald-400' : 'text-blue-400'
              }`}
            >
              {plan === 'FREE' ? 'FREE PLAN' : 'PRO PLAN'}
            </span>
          </div>
          {plan === 'PAID' && profile.paid_until && (
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

      {plan === 'FREE' && (
        <Card>
          <h2 className="text-xl font-semibold mb-6">Upgrade ke Paket Pro</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-3 text-sm">Keuntungan Paket Pro:</h3>
              <ul className="list-disc list-inside text-xs text-zinc-400 space-y-2 font-mono">
                <li>AI Quota: 30 penggunaan per hari (vs 3 di Free)</li>
                <li>Scraping Quota: 10 penggunaan per hari (vs 1 di Free)</li>
                <li>Akses ke semua portal scraping tanpa batasan</li>
              </ul>
            </div>
            <div className="border-t border-[var(--border)] pt-4">
              <h3 className="font-medium mb-3 text-sm">Cara Pembayaran (Manual):</h3>
              <ol className="list-decimal list-inside text-xs text-zinc-400 space-y-2 font-mono">
                <li>Transfer pembayaran ke rekening yang diberikan via email</li>
                <li>Atau scan QRIS yang dikirim via WhatsApp</li>
                <li>Kirim bukti pembayaran ke admin</li>
                <li>Admin akan mengaktifkan paket Pro secara manual</li>
                <li>Proses aktivasi: 1-24 jam kerja</li>
              </ol>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
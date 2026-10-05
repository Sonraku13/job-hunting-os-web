import { Card } from '@/components/ui/card';
import type { PlanType } from '@/lib/quota/limits';

interface AccountSummaryProps {
  email: string;
  fullName: string;
  plan: PlanType;
  paidUntil: string | null;
}

export function AccountSummary({ email, fullName, plan, paidUntil }: AccountSummaryProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold mb-4 tracking-tight">Akun Saya</h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Nama</span>
          <span className="text-sm font-medium">{fullName || email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Email</span>
          <span className="text-sm text-[var(--foreground)]">{email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Paket</span>
          <span
            className={`font-semibold uppercase tracking-wide text-xs px-2 py-0.5 rounded-sm ${
              plan === 'PAID' ? 'bg-[var(--accent)] text-[var(--foreground)]' : 'bg-[var(--card-muted)] text-[var(--foreground)]'
            }`}
          >
            {plan === 'FREE' ? 'Free' : 'Pro'}
          </span>
        </div>
        {plan === 'PAID' && paidUntil && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Berlaku hingga</span>
            <span className="text-sm font-medium">
              {new Date(paidUntil).toLocaleDateString('id-ID')}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

import { Card } from '@/components/ui/card';
import type { PlanType } from '@/lib/quota/limits';

interface AccountSummaryProps {
  email: string;
  fullName: string;
  plan: PlanType;
  paidUntil: string | null;
}

export function AccountSummary({ email, fullName, plan, paidUntil }: AccountSummaryProps) {
  const displayPlan = (plan as string) === 'PAID' ? 'PRO' : plan;

  return (
    <Card>
      <h2 className="text-lg font-semibold mb-4 tracking-tight">Akun Saya</h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-700 font-medium">Nama</span>
          <span className="text-sm font-semibold text-[#0C0B1E]">{fullName || email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-700 font-medium">Email</span>
          <span className="text-sm font-mono text-[#0C0B1E]">{email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-700 font-medium">Paket</span>
          <span
            className={`font-semibold uppercase tracking-wide text-xs px-2 py-0.5 rounded-sm border ${
              displayPlan === 'VIP'
                ? 'bg-purple-200 text-purple-900 border-purple-300'
                : displayPlan === 'PRO'
                ? 'bg-[#C1EF7B] text-[#0C0B1E] border-[#a5df48]'
                : displayPlan === 'ADMIN'
                ? 'bg-purple-200 text-purple-900 border-purple-300'
                : 'bg-[#F1F0FF] text-[#0C0B1E] border-zinc-200'
            }`}
          >
            {displayPlan}
          </span>
        </div>
        {(displayPlan === 'PRO' || displayPlan === 'VIP' || displayPlan === 'ADMIN') && paidUntil && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-700 font-medium">Berlaku hingga</span>
            <span className="text-sm font-medium text-[#0C0B1E]">
              {new Date(paidUntil).toLocaleDateString('id-ID')}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

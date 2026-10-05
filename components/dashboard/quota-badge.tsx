import Link from 'next/link';
import { PlanType, QUOTA_LIMITS } from '@/lib/quota/limits';

interface QuotaBadgeProps {
  plan: PlanType;
  usedToday: number;
}

export function QuotaBadge({ plan, usedToday }: QuotaBadgeProps) {
  const isUnlimited = plan === 'ADMIN';
  const limit = QUOTA_LIMITS[plan]?.SCRAPE ?? 1;

  return (
    <Link
      href="/billing"
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--muted)] px-2.5 py-1 text-xs font-mono transition-colors hover:border-zinc-500"
      title="Lihat rincian kuota di Billing"
    >
      <span
        className={`h-2 w-2 rounded-sm ${
          isUnlimited
            ? 'bg-purple-500'
            : usedToday >= limit
              ? 'bg-rose-500'
              : 'bg-[#C1EF7B]'
        }`}
      />
      <span className="text-[11px] text-[var(--foreground)] opacity-80">
        {isUnlimited ? '∞ Unlimited' : `${usedToday}/${limit} Scrape`}
      </span>
    </Link>
  );
}
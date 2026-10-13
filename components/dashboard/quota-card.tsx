import { Card } from '@/components/ui/card';

interface QuotaCardProps {
  title: string;
  used: number;
  limit: number;
  portal?: string | null;
}

export function QuotaCard({ title, used, limit, portal }: QuotaCardProps) {
  const isUnlimited = limit >= 999999;
  const percentage = isUnlimited ? 0 : (used / limit) * 100;
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isFull = !isUnlimited && percentage >= 100;
  const barClass = isUnlimited
    ? 'bg-[var(--foreground)]'
    : isFull
      ? 'bg-rose-500'
      : isNearLimit
        ? 'bg-amber-400'
        : 'bg-[var(--accent)]';

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-5 tracking-tight">{title}</h3>
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-sm text-zinc-600">Penggunaan hari ini</span>
            <span className={`font-mono text-sm font-semibold tabular-nums ${isFull ? 'text-rose-700' : isNearLimit ? 'text-amber-700' : 'text-[var(--foreground)]'}`}>
              {used} {isUnlimited ? '/ \u221E (Unlimited)' : `/ ${limit}`}
            </span>
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-[var(--muted)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${barClass}`}
                style={{ width: isUnlimited ? '100%' : `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-zinc-600">
              {isUnlimited ? 'Tanpa Batasan Harian' : `Batas harian: ${limit} penggunaan`}
            </span>
          </div>
        </div>
        {portal && (
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <span className="text-xs text-zinc-600">Portal digunakan</span>
            <span className="text-xs font-mono font-medium text-zinc-800 uppercase">{portal}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

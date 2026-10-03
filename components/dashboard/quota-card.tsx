import { Card } from '@/components/ui/card';

interface QuotaCardProps {
  title: string;
  used: number;
  limit: number;
  portal?: string | null;
}

export function QuotaCard({ title, used, limit, portal }: QuotaCardProps) {
  const percentage = (used / limit) * 100;
  const isNearLimit = percentage >= 80;

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-5 tracking-tight">{title}</h3>
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-zinc-400 mb-2">Penggunaan hari ini</span>
            <span className={isNearLimit ? 'text-yellow-400' : 'text-white'}>{used}</span>
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: percentage >= 100 ? '#ef4444' : isNearLimit ? '#eab308' : '#3b82f6'
                }}
              />
            </div>
            <span className="text-xs text-zinc-500">{limit} hari</span>
          </div>
        </div>
        {portal && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">Portal digunakan</span>
            <span className="text-sm font-medium text-zinc-200">{portal}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

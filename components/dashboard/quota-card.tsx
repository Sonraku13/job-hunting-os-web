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
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Penggunaan hari ini</span>
            <span className={isNearLimit ? 'text-yellow-400' : 'text-white'}>
              {used} / {limit}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                percentage >= 100
                  ? 'bg-red-500'
                  : isNearLimit
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
        {portal && (
          <div className="text-sm">
            <span className="text-gray-400">Portal digunakan:</span>{' '}
            <span className="text-white font-medium">{portal}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

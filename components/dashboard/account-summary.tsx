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
      <h2 className="text-xl font-semibold mb-4">Akun Saya</h2>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-400">Nama:</span>{' '}
          <span className="text-white">{fullName || email}</span>
        </div>
        <div>
          <span className="text-gray-400">Email:</span>{' '}
          <span className="text-white">{email}</span>
        </div>
        <div>
          <span className="text-gray-400">Paket:</span>{' '}
          <span
            className={`font-semibold ${
              plan === 'PAID' ? 'text-green-400' : 'text-blue-400'
            }`}
          >
            {plan}
          </span>
        </div>
        {plan === 'PAID' && paidUntil && (
          <div>
            <span className="text-gray-400">Berlaku hingga:</span>{' '}
            <span className="text-white">
              {new Date(paidUntil).toLocaleDateString('id-ID')}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

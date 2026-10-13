'use client';

import { Card } from '@/components/ui/card';
import { useLanguage } from '@/lib/i18n/context';

interface AnalyticsCardsProps {
  jobsFound: number;
  jobsApplied: number;
  avgMatchScore: number;
}

export function AnalyticsCards({ jobsFound, jobsApplied, avgMatchScore }: AnalyticsCardsProps) {
  const { t } = useLanguage();

  return (
    <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr_1fr]">
      <Card className="p-5 border-[var(--border)] bg-[var(--foreground)]">
        <div className="text-xs font-mono text-[var(--accent)] font-semibold uppercase tracking-wider mb-2">
          {t('dash_stats_found')}
        </div>
        <div className="text-4xl font-bold text-[var(--accent)] tabular-nums">{jobsFound}</div>
        <p className="text-xs text-zinc-300 mt-1">{t('dash_stats_found_desc')}</p>
      </Card>

      <Card className="p-5 border-[var(--border)]">
        <div className="text-xs font-mono text-zinc-600 font-semibold uppercase tracking-wider mb-2">
          {t('dash_stats_applied')}
        </div>
        <div className="text-3xl font-bold text-[var(--foreground)] tabular-nums">{jobsApplied}</div>
        <p className="text-xs text-zinc-700 mt-1">{t('dash_stats_applied_desc')}</p>
      </Card>

      <Card className="p-5 border-[var(--border)]">
        <div className="text-xs font-mono text-zinc-600 font-semibold uppercase tracking-wider mb-2">
          {t('dash_stats_match')}
        </div>
        <div className="text-3xl font-bold text-[var(--foreground)] tabular-nums">
          {avgMatchScore > 0 ? `${avgMatchScore.toFixed(0)}%` : '-'}
        </div>
        <p className="text-xs text-zinc-700 mt-1">{t('dash_stats_match_desc')}</p>
      </Card>
    </div>
  );
}

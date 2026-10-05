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
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="p-5 border-[var(--border)]">
        <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">
          {t('dash_stats_found')}
        </div>
        <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{jobsFound}</div>
        <p className="text-xs text-zinc-500 mt-1">{t('dash_stats_found_desc')}</p>
      </Card>

      <Card className="p-5 border-[var(--border)]">
        <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">
          {t('dash_stats_applied')}
        </div>
        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">{jobsApplied}</div>
        <p className="text-xs text-zinc-500 mt-1">{t('dash_stats_applied_desc')}</p>
      </Card>

      <Card className="p-5 border-[var(--border)]">
        <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">
          {t('dash_stats_match')}
        </div>
        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-500">
          {avgMatchScore > 0 ? `${avgMatchScore.toFixed(0)}%` : '-'}
        </div>
        <p className="text-xs text-zinc-500 mt-1">{t('dash_stats_match_desc')}</p>
      </Card>
    </div>
  );
}
'use client';

import { useLanguage } from '@/lib/i18n/context';

export function DashboardHeader() {
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{t('dash_title')}</h1>
      <p className="mt-1 text-sm text-zinc-400">
        {t('dash_subtitle')}
      </p>
    </div>
  );
}

'use client';

import { useLanguage } from '@/lib/i18n/context';

export function DashboardHeader() {
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-[#0C0B1E]">{t('dash_title')}</h1>
      <p className="mt-1 text-sm text-zinc-700">
        {t('dash_subtitle')}
      </p>
    </div>
  );
}

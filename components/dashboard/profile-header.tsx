'use client';

import { useLanguage } from '@/lib/i18n/context';

export function ProfileHeader() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('prof_title')}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {t('prof_subtitle')}
        </p>
      </div>
    </div>
  );
}

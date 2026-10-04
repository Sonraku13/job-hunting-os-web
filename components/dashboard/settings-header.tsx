'use client';

import { useLanguage } from '@/lib/i18n/context';

export function SettingsHeader() {
  const { t, language } = useLanguage();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{t('nav_settings')}</h1>
      <p className="mt-1 text-sm text-zinc-400">
        {language === 'id' 
          ? 'Kelola preferensi antarmuka website, kriteria pencarian lowongan kerja, dan jadwal auto-scraping.'
          : 'Manage website interface preferences, job search criteria, and auto-scraping schedule.'}
      </p>
    </div>
  );
}

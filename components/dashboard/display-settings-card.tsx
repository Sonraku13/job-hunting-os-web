'use client';

import { useLanguage } from '@/lib/i18n/context';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Card } from '@/components/ui/card';

export function DisplaySettingsCard() {
  const { t } = useLanguage();

  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight mb-4 text-[var(--card-foreground)]">
        {t('set_display_and_language')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--card-foreground)]">{t('set_display_title')}</p>
            <p className="text-xs text-zinc-500">{t('set_display_desc')}</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--card-foreground)]">{t('set_language_title')}</p>
            <p className="text-xs text-zinc-500">{t('set_language_desc')}</p>
          </div>
          <LanguageToggle />
        </div>
      </div>
    </Card>
  );
}

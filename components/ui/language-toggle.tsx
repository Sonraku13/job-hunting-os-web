'use client';

import { useSyncExternalStore } from 'react';
import { useLanguage } from '@/lib/i18n/context';

const emptySubscribe = () => () => {};

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div className="h-8 w-14 rounded-md border border-[var(--border)] bg-[var(--card)]" />
    );
  }

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1 text-xs font-mono font-medium text-[var(--card-foreground)] shadow-sm hover:bg-[var(--muted)] transition-colors"
      title={language === 'id' ? 'Ganti ke English' : 'Switch to Bahasa Indonesia'}
      aria-label="Toggle language"
    >
      <span>{language === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}</span>
    </button>
  );
}

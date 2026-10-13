'use client';

import { useOnboarding } from '@/components/onboarding/provider';

export function OnboardingRestartButton() {
  const { start } = useOnboarding();

  return (
    <button
      type="button"
      onClick={() => start(true)}
      title="Panduan / Guide"
      aria-label="Buka panduan / Open guide"
      className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--border)] text-sm text-[var(--foreground)] opacity-70 transition-colors hover:bg-[var(--accent)] hover:opacity-100"
    >
      ?
    </button>
  );
}

'use client';

import { useTheme } from './theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-300 px-2 py-1"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '○ Light' : '● Dark'}
    </button>
  );
}

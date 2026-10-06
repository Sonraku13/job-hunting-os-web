'use client';

import { useTheme } from './theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  // ponytail: disabled temporarily, dark theme (Vadim / Pepelsbey dark variant) not yet implemented
  return null;

  /*
  return (
    <button
      onClick={toggleTheme}
      className="font-mono text-xs text-zinc-700 font-medium transition-colors hover:text-[#0C0B1E] px-2 py-1"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '○ Light' : '● Dark'}
    </button>
  );
  */
}

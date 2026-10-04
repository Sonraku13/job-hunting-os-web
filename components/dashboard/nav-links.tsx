'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';

export function NavLinks() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const links = [
    { href: '/dashboard', label: t('nav_dashboard') },
    { href: '/profile', label: t('nav_profile') },
    { href: '/settings', label: t('nav_settings') },
    { href: '/billing', label: t('nav_billing') },
  ];

  return (
    <nav className="flex items-center gap-1 overflow-x-auto py-1">
      {links.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-[var(--accent)] text-[var(--foreground)] font-semibold'
                : 'text-[var(--foreground)] opacity-70 hover:bg-[var(--accent)] hover:opacity-100'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

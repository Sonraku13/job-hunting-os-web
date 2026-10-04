'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavLinks() {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/profile', label: 'Profil' },
    { href: '/settings', label: 'Pengaturan' },
    { href: '/billing', label: 'Billing' },
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
                : 'text-[var(--foreground)] opacity-60 hover:bg-[var(--accent)] hover:opacity-100'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

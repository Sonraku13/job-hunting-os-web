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
                ? 'bg-zinc-800 text-zinc-100 font-semibold'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

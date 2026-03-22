'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/app/components/theme-toggle';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Overview' },
  { href: '/activity', label: 'Activity' },
  { href: '/repos', label: 'Repos' },
  { href: '/featured', label: 'Featured' },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color:color-mix(in_oklab,var(--background)_82%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-sm font-semibold text-emerald-950 shadow-[0_16px_32px_rgba(16,185,129,0.28)]">
              B
            </span>
            <div>
              <div className="text-xs uppercase tracking-[0.32em] text-[var(--muted-foreground)]">Build</div>
              <div className="text-sm font-medium text-[var(--foreground)]">GitHub shipping dashboard</div>
            </div>
          </Link>

          <ThemeToggle />
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

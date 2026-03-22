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
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--nav-surface)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 py-3 sm:px-5 sm:py-4 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--button-accent)] text-sm font-semibold text-[var(--button-accent-foreground)] shadow-[0_16px_32px_rgba(16,185,129,0.24)]">
              B
            </span>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Build</div>
              <div className="truncate text-sm font-medium text-[var(--foreground)]">GitHub shipping dashboard</div>
            </div>
          </Link>

          <ThemeToggle />
        </div>

        <nav className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-full px-3.5 py-2 text-sm font-medium transition sm:px-4',
                  active
                    ? 'bg-[var(--nav-active-bg)] text-[var(--nav-active-fg)] shadow-[inset_0_0_0_1px_var(--border)]'
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

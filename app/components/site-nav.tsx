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
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5 sm:pt-4 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 rounded-[28px] border border-[var(--border)] bg-[var(--nav-surface)] px-3 py-3 shadow-[var(--shadow-nav)] backdrop-blur-xl sm:px-4 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-white/25 bg-[linear-gradient(145deg,var(--button-accent),color-mix(in_oklab,var(--button-accent),white_18%))] text-sm font-semibold text-[var(--button-accent-foreground)] shadow-[0_16px_34px_rgba(16,185,129,0.28)]">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.3),transparent_55%)]" />
              <span className="relative">B</span>
            </span>

            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-emerald-500/85">Build</div>
              <div className="truncate text-sm font-semibold text-[var(--foreground)] sm:text-[15px]">GitHub shipping dashboard</div>
            </div>
          </Link>

          <ThemeToggle />
        </div>

        <nav className="grid grid-cols-2 gap-2 rounded-[22px] border border-[var(--border)] bg-[var(--nav-surface-strong)] p-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:rounded-full sm:border-transparent sm:bg-transparent sm:p-0">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'inline-flex min-h-11 items-center justify-center rounded-2xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 sm:min-h-10 sm:rounded-full sm:px-4',
                  active
                    ? 'bg-[var(--nav-active-bg)] text-[var(--nav-active-fg)] shadow-[0_12px_24px_rgba(15,23,42,0.16)] sm:shadow-[inset_0_0_0_1px_var(--border)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--accent-soft-strong)] hover:text-[var(--foreground)]',
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

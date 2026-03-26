"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Overview" },
  { href: "/activity", label: "Activity" },
  { href: "/repos", label: "Repos" },
  { href: "/featured", label: "Featured" },
];

export function SiteNav({
  githubAuthConfigured = false,
}: {
  githubAuthConfigured?: boolean;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--nav-surface)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:gap-3 sm:px-5 sm:py-4 lg:px-8">
        <div className="flex items-center justify-between gap-4 sm:gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(145deg,var(--button-accent),color-mix(in_oklab,var(--button-accent),white_18%))] text-sm font-semibold text-[var(--button-accent-foreground)] shadow-[0_16px_32px_rgba(16,185,129,0.22)]">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),transparent_55%)]" />
              <span className="relative">B</span>
            </span>

            <div className="min-w-0">
              <div className="text-[11px] font-medium tracking-[0.3em] text-emerald-400/80 uppercase">
                Build
              </div>
              <div className="truncate text-sm font-medium text-[var(--foreground)]">
                GitHub shipping dashboard
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "hidden rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide sm:inline-flex",
                githubAuthConfigured
                  ? "border-emerald-500/40 bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                  : "border-amber-500/40 bg-amber-500/12 text-amber-700 dark:text-amber-300",
              )}
            >
              {githubAuthConfigured
                ? "GitHub auth active"
                : "GitHub public mode"}
            </span>
            <ThemeToggle />
          </div>
        </div>

        <nav className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:px-0 sm:pb-0.5">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center justify-center rounded-full px-3.5 text-sm font-medium transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:outline-none motion-safe:transform-gpu motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-0.5 sm:px-4",
                  active
                    ? "bg-[var(--nav-active-bg)] shadow-[inset_0_0_0_1px_var(--border-strong)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]",
                )}
                style={
                  active ? { color: "var(--nav-active-fg, #fff)" } : undefined
                }
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

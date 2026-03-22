import Link from "next/link";
import { cn } from "@/lib/utils";

const styles = {
  primary:
    "border border-emerald-400/20 bg-[var(--button-accent)] text-white shadow-[0_16px_36px_rgba(16,185,129,0.2)] hover:bg-[var(--button-accent-hover)]",

  secondary:
    "border border-[var(--border-strong)] bg-[var(--card-muted)] text-[var(--foreground)] hover:bg-[var(--accent-soft-strong)]",
  ghost: "border border-transparent bg-transparent text-[var(--foreground)] hover:bg-[var(--accent-soft)]",
};

const shared =
  "inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 disabled:pointer-events-none disabled:opacity-50";

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ComponentProps<"button"> & { variant?: keyof typeof styles }) {
  return <button className={cn(shared, styles[variant], className)} {...props} />;
}

export function ButtonLink({
  className,
  variant = "primary",
  ...props
}: React.ComponentProps<typeof Link> & { variant?: keyof typeof styles }) {
  return <Link className={cn(shared, styles[variant], className)} {...props} />;
}

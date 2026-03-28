import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        [
          "inline-flex items-center rounded-full",
          "border border-[var(--border-strong)]",
          "bg-[var(--accent-soft)]",
          "px-3 py-1",
          "text-xs font-medium text-[var(--foreground)]",
          "transition-colors duration-300",
          "motion-safe:hover:border-[var(--border)]",
          "motion-safe:hover:bg-[var(--accent-soft-strong)]",
        ].join(" "),
        className,
      )}
      {...props}
    />
  );
}

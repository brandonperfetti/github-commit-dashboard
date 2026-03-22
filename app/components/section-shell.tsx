import { cn } from "@/lib/utils";

export function SectionShell({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-card)] backdrop-blur-sm sm:rounded-[30px] sm:p-6 lg:p-8",
        className,
      )}
      {...props}
    />
  );
}

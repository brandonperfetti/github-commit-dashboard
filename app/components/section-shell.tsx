import { cn } from '@/lib/utils';

export function SectionShell({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] sm:p-8',
        className,
      )}
      {...props}
    />
  );
}

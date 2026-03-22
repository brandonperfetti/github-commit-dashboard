import { cn } from '@/lib/utils';

export function SectionShell({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-card)] sm:rounded-[28px] sm:p-6 lg:p-8',
        className,
      )}
      {...props}
    />
  );
}

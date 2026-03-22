'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/app/components/ui/button';

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <Button variant="secondary" aria-label="Toggle theme" className="h-10 min-w-10 rounded-full border-[var(--border)] px-3 shadow-none">
        <span aria-hidden>◐</span>
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="secondary"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="h-10 min-w-10 rounded-full border-[var(--border)] px-3 shadow-none"
    >
      <span aria-hidden>{isDark ? '☀️' : '🌙'}</span>
    </Button>
  );
}

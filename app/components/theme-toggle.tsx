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
      <Button variant="secondary" aria-label="Toggle theme" className="min-w-11 rounded-2xl border-[var(--border)] px-3 shadow-none sm:rounded-full sm:px-4">
        <span aria-hidden>◐</span>
        <span className="hidden sm:inline">Theme</span>
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="secondary"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="min-w-11 gap-2 rounded-2xl border-[var(--border)] px-3 shadow-none sm:rounded-full sm:px-4"
    >
      <span aria-hidden>{isDark ? '☀️' : '🌙'}</span>
      <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
    </Button>
  );
}

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
    return <Button variant="secondary" aria-label="Toggle theme">Theme</Button>;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="secondary"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="gap-2"
    >
      <span aria-hidden>{isDark ? '☀️' : '🌙'}</span>
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </Button>
  );
}

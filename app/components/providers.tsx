"use client";

import { AppThemeProvider } from "@/app/components/theme-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppThemeProvider>{children}</AppThemeProvider>;
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  resolvedTheme: Theme;
  isResolved: boolean;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "build-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light");
    root.classList.remove("dark");
    return;
  }

  root.classList.add("dark");
  root.classList.remove("light");
}

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  return getSystemTheme();
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [userHasSetTheme, setUserHasSetTheme] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark";
  });
  const isResolved = useMounted();

  useEffect(() => {
    if (!isResolved) return;
    applyTheme(theme);
  }, [isResolved, theme]);

  useEffect(() => {
    if (!isResolved) return;

    if (userHasSetTheme) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const systemTheme = getSystemTheme();
      setThemeState(systemTheme);
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [isResolved, userHasSetTheme]);

  useEffect(() => {
    if (!isResolved) return;

    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;

      if (event.newValue === "light" || event.newValue === "dark") {
        setUserHasSetTheme(true);
        setThemeState(event.newValue);
        applyTheme(event.newValue);
        return;
      }

      setUserHasSetTheme(false);
      const systemTheme = getSystemTheme();
      setThemeState(systemTheme);
      applyTheme(systemTheme);
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [isResolved]);

  const setTheme = useCallback((nextTheme: Theme) => {
    setUserHasSetTheme(true);
    setThemeState(nextTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch (error) {
      console.warn("[theme] Failed to persist theme preference", error);
    }
    applyTheme(nextTheme);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      resolvedTheme: theme,
      isResolved,
      setTheme,
    }),
    [theme, isResolved, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within AppThemeProvider");
  }

  return context;
}

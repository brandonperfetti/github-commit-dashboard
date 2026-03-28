"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useTheme } from "@/app/components/theme-context";

type ChartColors = {
  primary: string;
  primarySoft: string;
  primaryMuted: string;
  accent: string;
  warning: string;
  pinned: string;
  unpinned: string;
  opened: string;
  closed: string;
  netBacklog: string;
};

const DARK_FALLBACK: ChartColors = {
  primary: "#10b981",
  primarySoft: "#34d399",
  primaryMuted: "#6ee7b7",
  accent: "#14b8a6",
  warning: "#f59e0b",
  pinned: "#059669",
  unpinned: "#34d399",
  opened: "#34d399",
  closed: "#10b981",
  netBacklog: "#a7f3d0",
};

const LIGHT_FALLBACK: ChartColors = {
  primary: "#059669",
  primarySoft: "#10b981",
  primaryMuted: "#6ee7b7",
  accent: "#0f766e",
  warning: "#d97706",
  pinned: "#047857",
  unpinned: "#10b981",
  opened: "#10b981",
  closed: "#059669",
  netBacklog: "#047857",
};

function readResolvedColors(fallback: ChartColors): ChartColors {
  if (typeof window === "undefined") {
    return fallback;
  }

  const styles = window.getComputedStyle(document.documentElement);
  const readVar = (name: string, defaultValue: string) =>
    styles.getPropertyValue(name).trim() || defaultValue;

  return {
    primary: readVar("--chart-primary", fallback.primary),
    primarySoft: readVar("--chart-primary-soft", fallback.primarySoft),
    primaryMuted: readVar("--chart-primary-muted", fallback.primaryMuted),
    accent: readVar("--chart-accent", fallback.accent),
    warning: readVar("--chart-warning", fallback.warning),
    pinned: readVar("--chart-pinned", fallback.pinned),
    unpinned: readVar("--chart-unpinned", fallback.unpinned),
    opened: readVar("--chart-opened", fallback.opened),
    closed: readVar("--chart-closed", fallback.closed),
    netBacklog: readVar("--chart-net-backlog", fallback.netBacklog),
  };
}

export function useResolvedChartColors(): ChartColors {
  const { resolvedTheme } = useTheme();
  const rootSignature = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};

      const root = document.documentElement;
      const observer = new MutationObserver(() => {
        onStoreChange();
      });
      observer.observe(root, {
        attributes: true,
        attributeFilter: ["class", "style"],
      });

      return () => observer.disconnect();
    },
    () => {
      if (typeof window === "undefined") return "";
      const root = document.documentElement;
      return `${root.className}|${root.getAttribute("style") ?? ""}`;
    },
    () => "",
  );

  return useMemo(() => {
    const fallback = resolvedTheme === "light" ? LIGHT_FALLBACK : DARK_FALLBACK;
    // Touch rootSignature so theme class/style mutations trigger recomputation.
    void rootSignature;
    if (typeof window === "undefined") {
      return fallback;
    }
    return readResolvedColors(fallback);
  }, [resolvedTheme, rootSignature]);
}

"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/app/components/ui/button";

const TOGGLE_SIZE_PX = 44;
const ICON_SIZE_PX = 20;

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
      <Button
        variant="secondary"
        aria-label="Toggle theme"
        className="rounded-full border-(--border) shadow-none"
        style={{
          width: TOGGLE_SIZE_PX,
          height: TOGGLE_SIZE_PX,
          padding: 3,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Moon
          strokeWidth={1.8}
          className="text-foreground! shrink-0"
          style={{
            width: ICON_SIZE_PX,
            height: ICON_SIZE_PX,
            transform: "scale(1.05)",
          }}
        />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="secondary"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-full border-(--border) shadow-none hover:cursor-pointer"
      style={{
        width: TOGGLE_SIZE_PX,
        height: TOGGLE_SIZE_PX,
        padding: 3,
        display: "grid",
        placeItems: "center",
      }}
    >
      {isDark ? (
        <Sun
          strokeWidth={1.8}
          className="text-foreground! shrink-0"
          style={{ width: ICON_SIZE_PX, height: ICON_SIZE_PX }}
        />
      ) : (
        <Moon
          strokeWidth={1.8}
          className="text-foreground! shrink-0"
          style={{
            width: ICON_SIZE_PX,
            height: ICON_SIZE_PX,
            transform: "scale(1.05)",
          }}
        />
      )}
    </Button>
  );
}

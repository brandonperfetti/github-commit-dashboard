"use client";

import { Sun, Moon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useTheme } from "@/app/components/theme-context";

const TOGGLE_SIZE_PX = 44;
const ICON_SIZE_PX = 20;

export function ThemeToggle() {
  const { resolvedTheme, setTheme, isResolved } = useTheme();

  if (!isResolved) {
    return (
      <Button
        variant="secondary"
        aria-label="Toggle theme"
        className="rounded-full border-[var(--border)] shadow-none"
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
      className="rounded-full border-[var(--border)] shadow-none hover:cursor-pointer"
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

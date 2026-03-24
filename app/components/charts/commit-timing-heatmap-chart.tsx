"use client";

import { useMemo, useState } from "react";
import type { CommitTimingHeatmapData } from "@/lib/github";

const INTENSITY_CLASSES: Record<number, string> = {
  0: "bg-[var(--card-muted)]",
  1: "bg-emerald-400/30",
  2: "bg-emerald-400/45",
  3: "bg-emerald-400/60",
  4: "bg-emerald-400/80",
};

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_BUFFER = 1;
const MIN_VISIBLE_HOURS = 10;
type CellKey = `${number}-${number}`;

function toCellKey(dayIndex: number, hour: number): CellKey {
  return `${dayIndex}-${hour}` as CellKey;
}

function formatHourLabel(hour: number) {
  const period = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalized}:00 ${period}`;
}

export function CommitTimingHeatmapChart({
  data,
}: {
  data: CommitTimingHeatmapData;
}) {
  const [hoveredCellKey, setHoveredCellKey] = useState<CellKey | null>(null);
  const lookup = useMemo(
    () =>
      new Map(
        data.cells.map(
          (cell) => [toCellKey(cell.dayIndex, cell.hour), cell] as const,
        ),
      ),
    [data.cells],
  );
  const hoveredCell = useMemo(
    () => (hoveredCellKey ? (lookup.get(hoveredCellKey) ?? null) : null),
    [hoveredCellKey, lookup],
  );
  const visibleHours = useMemo(() => {
    const activeHours = data.cells
      .filter((cell) => cell.count > 0)
      .map((cell) => cell.hour);

    if (!activeHours.length) {
      return HOURS;
    }

    let minHour = Math.max(0, Math.min(...activeHours) - HOUR_BUFFER);
    let maxHour = Math.min(23, Math.max(...activeHours) + HOUR_BUFFER);

    const currentWindow = maxHour - minHour + 1;
    if (currentWindow < MIN_VISIBLE_HOURS) {
      const remaining = MIN_VISIBLE_HOURS - currentWindow;
      const extendBefore = Math.floor(remaining / 2);
      const extendAfter = remaining - extendBefore;
      minHour = Math.max(0, minHour - extendBefore);
      maxHour = Math.min(23, maxHour + extendAfter);

      const adjustedWindow = maxHour - minHour + 1;
      if (adjustedWindow < MIN_VISIBLE_HOURS) {
        if (minHour === 0) {
          maxHour = Math.min(23, minHour + MIN_VISIBLE_HOURS - 1);
        } else if (maxHour === 23) {
          minHour = Math.max(0, maxHour - MIN_VISIBLE_HOURS + 1);
        }
      }
    }

    return HOURS.filter((hour) => hour >= minHour && hour <= maxHour);
  }, [data.cells]);
  const hourColumnTemplate = useMemo(
    () => `44px repeat(${visibleHours.length}, minmax(0,1fr))`,
    [visibleHours.length],
  );
  const labelStep = useMemo(() => {
    if (visibleHours.length <= 10) return 2;
    if (visibleHours.length <= 16) return 3;
    return 4;
  }, [visibleHours.length]);
  const activeWindowLabel = useMemo(() => {
    if (!visibleHours.length) {
      return null;
    }
    const firstHour = visibleHours[0];
    const lastHour = visibleHours[visibleHours.length - 1];
    return `Active window: ${formatHourLabel(firstHour)} – ${formatHourLabel(lastHour)}`;
  }, [visibleHours]);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-3 sm:p-4">
      {activeWindowLabel ? (
        <p className="mb-2 text-xs text-[var(--muted-foreground)]">
          {activeWindowLabel}
        </p>
      ) : null}
      <div>
        <div
          className="grid gap-1 text-[10px] text-[var(--muted-foreground)]"
          style={{ gridTemplateColumns: hourColumnTemplate }}
        >
          <div />
          {visibleHours.map((hour, index) => (
            <div key={hour} className="text-center">
              {index % labelStep === 0 || index === visibleHours.length - 1
                ? formatHourLabel(hour).replace(":00 ", " ")
                : ""}
            </div>
          ))}
        </div>

        <div className="mt-2 space-y-1">
          {DAYS.map((dayLabel, dayIndex) => (
            <div
              key={dayLabel}
              className="grid gap-1"
              style={{ gridTemplateColumns: hourColumnTemplate }}
            >
              <div className="flex items-center text-[10px] text-[var(--muted-foreground)]">
                {dayLabel}
              </div>
              {visibleHours.map((hour) => {
                const cellKey = toCellKey(dayIndex, hour);
                const cell = lookup.get(cellKey);
                const intensity = cell?.intensity ?? 0;
                const safeIntensity = Math.max(0, Math.min(4, intensity));
                const intensityClass =
                  INTENSITY_CLASSES[safeIntensity] ?? INTENSITY_CLASSES[0];
                const count = cell?.count ?? 0;
                return (
                  <div
                    key={cellKey}
                    className={`h-3 rounded-[3px] transition-colors sm:h-4 ${intensityClass}`}
                    onMouseEnter={() => setHoveredCellKey(cellKey)}
                    onMouseLeave={() => setHoveredCellKey(null)}
                    onFocus={() => setHoveredCellKey(cellKey)}
                    onBlur={() => setHoveredCellKey(null)}
                    title={`${dayLabel} ${formatHourLabel(hour)} · ${count} commit${count === 1 ? "" : "s"}`}
                    aria-label={`${dayLabel} ${formatHourLabel(hour)}: ${count} commit${count === 1 ? "" : "s"}`}
                    role="img"
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--muted-foreground)]">
        <div className="flex items-center gap-2">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((intensity) => (
            <span
              key={intensity}
              className={`h-2.5 w-2.5 rounded-full ${INTENSITY_CLASSES[intensity]}`}
            />
          ))}
          <span>More</span>
        </div>
        {hoveredCell ? (
          <span>
            {hoveredCell.dayLabel} · {formatHourLabel(hoveredCell.hour)} ·{" "}
            {hoveredCell.count} commit{hoveredCell.count === 1 ? "" : "s"}
          </span>
        ) : (
          <span>{data.totalCommits} commits in 30 days</span>
        )}
      </div>
    </div>
  );
}

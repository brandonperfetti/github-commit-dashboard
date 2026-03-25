"use client";

import { useMemo, useState } from "react";
import {
  buildCalendarCells,
  chunkWeeks,
  prettyDay,
  type ContributionDay,
} from "@/lib/github";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const levelClasses = [
  "bg-[var(--heat-0)] border-[var(--heat-0-border)]",
  "bg-[var(--heat-1)] border-[var(--heat-1-border)]",
  "bg-[var(--heat-2)] border-[var(--heat-2-border)]",
  "bg-[var(--heat-3)] border-[var(--heat-3-border)]",
  "bg-[var(--heat-4)] border-[var(--heat-4-border)]",
];

export function HeatmapLegend() {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
      <span className="font-medium">Less</span>
      {levelClasses.map((levelClass) => (
        <span
          key={levelClass}
          className={`h-3.5 w-3.5 rounded-full border ${levelClass}`}
        />
      ))}
      <span className="font-medium">More</span>
    </div>
  );
}

export default function ContributionHeatmap({
  days,
}: {
  days: ContributionDay[];
}) {
  const calendarCells = useMemo(() => buildCalendarCells(days), [days]);
  const weeks = useMemo(() => chunkWeeks(calendarCells), [calendarCells]);
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(
    days[days.length - 1]?.date ?? null,
  );
  const selectedDay = useMemo(
    () =>
      (selectedDayDate
        ? days.find((day) => day.date === selectedDayDate)
        : null) ??
      days[days.length - 1] ??
      null,
    [days, selectedDayDate],
  );

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-3 sm:p-4">
      <div className="mb-3 flex flex-col gap-2.5 sm:mb-4 md:flex-row md:items-center md:justify-between">
        <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] shadow-md">
          {selectedDay ? (
            <>
              <span className="font-medium">{prettyDay(selectedDay.date)}</span>
              <span className="mx-2 text-[var(--muted-foreground)]">·</span>
              <span className="font-medium">{selectedDay.count}</span>{" "}
              <span className="text-[var(--muted-foreground)]">
                contributions
              </span>
            </>
          ) : (
            <span className="text-[var(--muted-foreground)]">
              No contribution data available.
            </span>
          )}
        </div>

        <div className="text-xs text-[var(--muted-foreground)] md:text-right">
          Hover on desktop or tap on mobile for details.
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card)]/35 px-2 py-3 sm:gap-3 sm:px-3">
        <div className="grid grid-rows-7 gap-2 pt-1 text-[10px] text-[var(--muted-foreground)] sm:gap-3 sm:text-[11px]">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="flex h-[18px] items-center pr-1 sm:pr-2 md:h-6"
            >
              {label}
            </div>
          ))}
        </div>

        <div
          className="grid min-w-0 flex-1 gap-3 pr-1"
          style={{
            gridTemplateColumns: `repeat(${weeks.length}, minmax(38px, 1fr))`,
          }}
        >
          {weeks.map((week, weekIndex) => (
            <div
              key={`week-${weekIndex}`}
              className="grid gap-2 sm:gap-3"
              style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}
            >
              {week.map((day, dayIndex) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${weekIndex}-${dayIndex}`}
                      className="h-4 rounded-[5px] bg-transparent sm:h-[18px] sm:rounded-[6px] md:h-6"
                    />
                  );
                }

                const isSelected = selectedDay?.date === day.date;

                return (
                  <button
                    key={`${day.date}-${weekIndex}-${dayIndex}`}
                    type="button"
                    onMouseEnter={() => setSelectedDayDate(day.date)}
                    onFocus={() => setSelectedDayDate(day.date)}
                    onClick={() => setSelectedDayDate(day.date)}
                    className={`h-4 rounded-[5px] border transition motion-safe:transform-gpu motion-safe:transition-transform motion-safe:duration-200 sm:h-[18px] sm:rounded-[6px] md:h-6 ${levelClasses[day.level]} ${
                      isSelected
                        ? "ring-2 ring-emerald-400/70 ring-offset-1 ring-offset-[var(--card)] motion-safe:scale-105"
                        : "hover:ring-1 hover:ring-emerald-400/40 motion-safe:scale-100"
                    }`}
                    aria-label={`${day.count} contributions on ${prettyDay(day.date)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type { CommitTimingHeatmapData } from "@/lib/github";
import { sanitizeTimezone } from "@/lib/timezone";
import { CommitTimingHeatmapChart } from "@/app/components/charts/commit-timing-heatmap-chart";

export function CommitTimingHeatmapLocalized({
  initialData,
}: {
  initialData: CommitTimingHeatmapData;
}) {
  const [data, setData] = useState<CommitTimingHeatmapData>(initialData);
  const [isRefreshingTimezone, setIsRefreshingTimezone] = useState(false);

  useEffect(() => {
    const viewerTimezone = sanitizeTimezone(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    if (!viewerTimezone || viewerTimezone === initialData.timezone) {
      return;
    }

    let active = true;
    const controller = new AbortController();

    const loadLocalizedData = async () => {
      setIsRefreshingTimezone(true);
      try {
        const response = await fetch(
          `/api/activity/commit-timing?timezone=${encodeURIComponent(viewerTimezone)}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok || !active) {
          return;
        }

        const nextData = (await response.json()) as CommitTimingHeatmapData;
        if (active) {
          setData(nextData);
        }
      } catch {
        // Keep initial server-rendered timezone data when localized fetch fails.
      } finally {
        if (active) {
          setIsRefreshingTimezone(false);
        }
      }
    };

    void loadLocalizedData();

    return () => {
      active = false;
      controller.abort();
    };
  }, [initialData.timezone]);

  const subtitle = useMemo(
    () =>
      `When coding happened by weekday and hour over the last 30 days (${data.timezone}).`,
    [data.timezone],
  );

  return (
    <>
      <div className="mt-1 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <span>{subtitle}</span>
        {isRefreshingTimezone ? (
          <span className="text-xs text-[var(--muted-foreground)]/80">
            Syncing local timezone...
          </span>
        ) : null}
      </div>
      <div className="mt-4">
        <CommitTimingHeatmapChart data={data} />
      </div>
    </>
  );
}

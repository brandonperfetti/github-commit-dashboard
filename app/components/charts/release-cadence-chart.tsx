"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useChartSize } from "@/app/components/charts/use-chart-size";
import { useResolvedChartColors } from "@/app/components/charts/use-resolved-chart-colors";
import type { ReleaseCadencePoint } from "@/lib/github";

type ReleaseCadenceTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: ReleaseCadencePoint }>;
};

function ReleaseCadenceTooltip({
  active,
  payload,
}: ReleaseCadenceTooltipProps) {
  const point = payload?.[0]?.payload as ReleaseCadencePoint | undefined;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="max-w-[220px] rounded-xl border border-[var(--border-strong)] bg-[var(--background)] px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-[var(--foreground)]">
        {point.label}
      </p>
      <p className="mt-1 text-sm text-[var(--foreground)]">
        Releases: {point.releases}
      </p>
    </div>
  );
}

export function ReleaseCadenceChart({ data }: { data: ReleaseCadencePoint[] }) {
  const { ref, size, ready } = useChartSize<HTMLDivElement>();
  const chartColors = useResolvedChartColors();
  const totalReleases = data.reduce((sum, point) => sum + point.releases, 0);

  if (!data.length) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] text-sm text-[var(--muted-foreground)]">
        No release cadence data available.
      </div>
    );
  }
  if (totalReleases === 0) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] px-4 text-center">
        <p className="text-sm font-medium text-[var(--foreground)]">
          No published releases in the current 6-month window.
        </p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          The chart will populate automatically once repos publish GitHub
          Releases.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-3 sm:p-4">
      <div ref={ref} className="h-full w-full min-w-0 overflow-hidden">
        {ready ? (
          <BarChart
            accessibilityLayer={false}
            width={size.width}
            height={size.height}
            data={data}
            margin={{ top: 16, right: 16, left: 8, bottom: 18 }}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              width={24}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--accent-soft)" }}
              content={<ReleaseCadenceTooltip />}
              wrapperStyle={{ outline: "none", zIndex: 20 }}
              allowEscapeViewBox={{ x: false, y: false }}
            />
            <Bar
              dataKey="releases"
              name="Releases"
              fill={chartColors.primary}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        ) : (
          <div className="h-full w-full rounded-xl bg-[var(--card)]/70" />
        )}
      </div>
    </div>
  );
}

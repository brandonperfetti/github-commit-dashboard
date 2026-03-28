"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useChartSize } from "@/app/components/charts/use-chart-size";
import { useResolvedChartColors } from "@/app/components/charts/use-resolved-chart-colors";
import type { RepoFreshnessPoint } from "@/lib/github";

type FreshnessTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: RepoFreshnessPoint }>;
};

type RepoFreshnessBarShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: { fill?: string; fillOpacity?: number };
};

const FRESH_THRESHOLD_DAYS = 3;
const WARM_THRESHOLD_DAYS = 7;

function freshnessBand(days: number) {
  if (days <= FRESH_THRESHOLD_DAYS) {
    return {
      label: `Fresh (0-${FRESH_THRESHOLD_DAYS} days)`,
      opacity: 0.9,
    };
  }

  if (days <= WARM_THRESHOLD_DAYS) {
    return {
      label: `Warm (${FRESH_THRESHOLD_DAYS + 1}-${WARM_THRESHOLD_DAYS} days)`,
      opacity: 0.6,
    };
  }

  return {
    label: `Stale (${WARM_THRESHOLD_DAYS + 1}+ days)`,
    opacity: 0.4,
  };
}

function RepoFreshnessBarShape({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  payload,
}: RepoFreshnessBarShapeProps) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={5}
      ry={5}
      fill={payload?.fill ?? "var(--chart-primary)"}
      fillOpacity={payload?.fillOpacity ?? 1}
    />
  );
}

function FreshnessTooltip({ active, payload }: FreshnessTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  const band = freshnessBand(point.daysSincePush);

  return (
    <div className="max-w-[220px] rounded-xl border border-[var(--border-strong)] bg-[var(--background)] p-2.5 text-xs shadow-md">
      <p
        className="truncate font-medium text-[var(--foreground)]"
        title={point.fullName}
      >
        {point.fullName}
      </p>
      <p className="mt-0.5 text-[var(--muted-foreground)]">
        {point.lastPushLabel}
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-[var(--foreground)]">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{
            backgroundColor: "var(--chart-primary)",
            opacity: band.opacity,
          }}
        />
        <span className="truncate">
          {band.label} • {point.daysSincePush}{" "}
          {point.daysSincePush === 1 ? "day" : "days"}
        </span>
      </div>
    </div>
  );
}

export function RepoFreshnessChart({ data }: { data: RepoFreshnessPoint[] }) {
  const { ref, size, ready } = useChartSize<HTMLDivElement>();
  const chartColors = useResolvedChartColors();
  const yAxisWidth = useMemo(() => {
    const longestNameLength = data.reduce(
      (longest, point) => Math.max(longest, point.name.length),
      0,
    );
    const estimatedWidth = longestNameLength * 7 + 20;
    const maxWidth = size.width > 0 ? size.width * 0.45 : 200;

    return Math.max(110, Math.min(estimatedWidth, maxWidth));
  }, [data, size.width]);

  const chartData = useMemo(
    () =>
      data.map((row) => {
        const band = freshnessBand(row.daysSincePush);
        return {
          ...row,
          fill: chartColors.primary,
          fillOpacity: band.opacity,
        };
      }),
    [data, chartColors],
  );

  if (!data.length) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] text-sm text-[var(--muted-foreground)]">
        No freshness data available.
      </div>
    );
  }

  return (
    <div className="h-[220px] w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-3 sm:p-4">
      <div
        ref={ref}
        className="h-[calc(100%-30px)] w-full min-w-0 overflow-hidden"
      >
        {ready ? (
          <BarChart
            width={size.width}
            height={size.height}
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 16, left: 6, bottom: 10 }}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, "dataMax + 1"]}
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={yAxisWidth}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--accent-soft)" }}
              content={<FreshnessTooltip />}
              wrapperStyle={{ outline: "none", zIndex: 20 }}
              allowEscapeViewBox={{ x: false, y: false }}
            />
            <Bar
              dataKey="daysSincePush"
              barSize={12}
              radius={[0, 5, 5, 0]}
              isAnimationActive={false}
              shape={RepoFreshnessBarShape}
            />
          </BarChart>
        ) : (
          <div className="h-full w-full rounded-xl bg-[var(--card)]/70" />
        )}
      </div>
      <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-[var(--muted-foreground)]">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: chartColors.primary, opacity: 0.9 }}
          />
          {`Fresh (0-${FRESH_THRESHOLD_DAYS}d)`}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: chartColors.primary, opacity: 0.6 }}
          />
          {`Warm (${FRESH_THRESHOLD_DAYS + 1}-${WARM_THRESHOLD_DAYS}d)`}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: chartColors.primary, opacity: 0.4 }}
          />
          {`Stale (${WARM_THRESHOLD_DAYS + 1}+d)`}
        </span>
      </div>
    </div>
  );
}

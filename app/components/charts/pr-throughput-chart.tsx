"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useResolvedChartColors } from "@/app/components/charts/use-resolved-chart-colors";
import { useChartSize } from "@/app/components/charts/use-chart-size";
import type { PullRequestThroughputPoint } from "@/lib/github";

type PrThroughputTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ payload?: PullRequestThroughputPoint }>;
};

function PrThroughputTooltip({
  active,
  label,
  payload,
}: PrThroughputTooltipProps) {
  const point = payload?.[0]?.payload as PullRequestThroughputPoint | undefined;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="max-w-[300px] rounded-xl border border-[var(--border-strong)] bg-[var(--background)] px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
      <p className="text-xs text-[var(--muted-foreground)]">{point.range}</p>
      <div className="mt-2 space-y-1 text-sm text-[var(--foreground)]">
        <p>Opened: {point.opened}</p>
        <p>Merged: {point.merged}</p>
        <p>Closed: {point.closed}</p>
      </div>
    </div>
  );
}

export function PrThroughputChart({
  data,
}: {
  data: PullRequestThroughputPoint[];
}) {
  const { ref, size, ready } = useChartSize<HTMLDivElement>();
  const chartColors = useResolvedChartColors();

  if (!data.length) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] text-sm text-[var(--muted-foreground)]">
        No pull request data available.
      </div>
    );
  }

  return (
    <div className="h-[220px] w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-3 sm:p-4">
      <div ref={ref} className="h-full w-full min-w-0 overflow-hidden">
        {ready ? (
          <BarChart
            accessibilityLayer={false}
            width={size.width}
            height={size.height}
            data={data}
            margin={{ top: 10, right: 14, left: 6, bottom: 10 }}
            barGap={3}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              minTickGap={18}
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
              content={<PrThroughputTooltip />}
              wrapperStyle={{ outline: "none", zIndex: 20 }}
              allowEscapeViewBox={{ x: false, y: false }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="opened"
              name="Opened"
              fill={chartColors.primary}
              fillOpacity={0.95}
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="merged"
              name="Merged"
              fill={chartColors.primarySoft}
              fillOpacity={0.85}
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="closed"
              name="Closed"
              fill={chartColors.primaryMuted}
              fillOpacity={0.8}
              radius={[3, 3, 0, 0]}
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

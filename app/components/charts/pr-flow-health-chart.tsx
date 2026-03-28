"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartSize } from "@/app/components/charts/use-chart-size";
import { useResolvedChartColors } from "@/app/components/charts/use-resolved-chart-colors";
import type { PullRequestHealthPoint } from "@/lib/github";

type PrFlowHealthTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ payload?: PullRequestHealthPoint }>;
};

function PrFlowHealthTooltip({
  active,
  label,
  payload,
}: PrFlowHealthTooltipProps) {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="max-w-[320px] rounded-xl border border-[var(--border-strong)] bg-[var(--background)] px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
      <p className="text-xs text-[var(--muted-foreground)]">{point.range}</p>
      <div className="mt-2 space-y-1 text-sm text-[var(--foreground)]">
        <p>Merge rate: {point.mergeRate}%</p>
        <p>Reopen rate: {point.reopenRate}%</p>
        <p>
          Closed: {point.closed} · Reopened: {point.reopened}
        </p>
      </div>
    </div>
  );
}

export function PrFlowHealthChart({
  data,
}: {
  data: PullRequestHealthPoint[];
}) {
  const { ref, size, ready } = useChartSize<HTMLDivElement>();
  const chartColors = useResolvedChartColors();

  if (!data.length) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] text-sm text-[var(--muted-foreground)]">
        No PR flow-health data available.
      </div>
    );
  }

  return (
    <div className="h-[220px] w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-3 sm:p-4">
      <div
        ref={ref}
        className="h-full w-full max-w-full min-w-0 overflow-hidden"
      >
        {ready ? (
          <LineChart
            width={size.width}
            height={size.height}
            data={data}
            margin={{ top: 10, right: 12, left: 4, bottom: 10 }}
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
              width={28}
              domain={[0, 100]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ stroke: chartColors.accent, strokeOpacity: 0.35 }}
              content={<PrFlowHealthTooltip />}
              wrapperStyle={{ outline: "none", zIndex: 20 }}
              allowEscapeViewBox={{ x: false, y: false }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="mergeRate"
              name="Merge rate"
              stroke={chartColors.primary}
              strokeWidth={2}
              dot={{
                r: 3,
                fill: chartColors.primary,
                stroke: chartColors.primary,
                strokeWidth: 1,
              }}
              activeDot={{
                r: 5,
                fill: chartColors.primary,
                stroke: chartColors.primary,
                strokeWidth: 1.5,
              }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="reopenRate"
              name="Reopen rate"
              stroke={chartColors.primaryMuted}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={{
                r: 3,
                fill: "var(--card-muted)",
                stroke: chartColors.primaryMuted,
                strokeWidth: 1.5,
              }}
              activeDot={{
                r: 5,
                fill: "var(--card-muted)",
                stroke: chartColors.primaryMuted,
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
          </LineChart>
        ) : (
          <div className="h-full w-full rounded-xl bg-[var(--card)]/70" />
        )}
      </div>
    </div>
  );
}

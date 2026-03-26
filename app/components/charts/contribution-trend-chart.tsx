"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartSize } from "@/app/components/charts/use-chart-size";
import { useResolvedChartColors } from "@/app/components/charts/use-resolved-chart-colors";
import type { ContributionTrendPoint } from "@/lib/github";

type ContributionTrendTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ payload?: ContributionTrendPoint }>;
};

function ContributionTrendTooltip(props: ContributionTrendTooltipProps) {
  const { active, label, payload } = props;
  const point = payload?.[0]?.payload as ContributionTrendPoint | undefined;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="max-w-[260px] rounded-xl border border-[var(--border-strong)] bg-[var(--background)] px-3 py-2 shadow-md">
      <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
        {point.count} contributions
      </p>
    </div>
  );
}

export function ContributionTrendChart({
  data,
  compact = false,
}: {
  data: ContributionTrendPoint[];
  compact?: boolean;
}) {
  const { ref, size, ready } = useChartSize<HTMLDivElement>();
  const chartColors = useResolvedChartColors();
  const chartHeight = compact ? 204 : 240;
  const gradientId = `contribTrendFill-${useId().replace(/:/g, "")}`;

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] text-sm text-[var(--muted-foreground)]"
        style={{ height: chartHeight }}
      >
        No contribution data available.
      </div>
    );
  }

  return (
    <div
      className="w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-3 sm:p-4"
      style={{ height: chartHeight }}
    >
      <div ref={ref} className="h-full w-full min-w-0 overflow-hidden">
        {ready ? (
          <AreaChart
            accessibilityLayer={false}
            width={size.width}
            height={size.height}
            data={data}
            margin={
              compact
                ? { top: 8, right: 6, left: 6, bottom: 8 }
                : { top: 8, right: 8, left: 8, bottom: 2 }
            }
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={chartColors.primary}
                  stopOpacity={0.45}
                />
                <stop
                  offset="100%"
                  stopColor={chartColors.primary}
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              minTickGap={22}
              tickMargin={compact ? 10 : 8}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              width={28}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ stroke: "var(--accent-strong)", strokeOpacity: 0.35 }}
              content={<ContributionTrendTooltip />}
              wrapperStyle={{ outline: "none", zIndex: 20 }}
              allowEscapeViewBox={{ x: false, y: false }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke={chartColors.primary}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        ) : (
          <div className="h-full w-full rounded-xl bg-[var(--card)]/70" />
        )}
      </div>
    </div>
  );
}

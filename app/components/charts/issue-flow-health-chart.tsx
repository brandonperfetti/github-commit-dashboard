"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useResolvedChartColors } from "@/app/components/charts/use-resolved-chart-colors";
import { useChartSize } from "@/app/components/charts/use-chart-size";
import type { IssueFlowHealthPoint } from "@/lib/github";

type IssueFlowTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ payload?: IssueFlowHealthPoint }>;
};

function IssueFlowTooltip({ active, label, payload }: IssueFlowTooltipProps) {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="max-w-[280px] rounded-xl border border-[var(--border-strong)] bg-[var(--background)] px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
      <p className="text-xs text-[var(--muted-foreground)]">{point.range}</p>
      <div className="mt-2 space-y-1 text-sm text-[var(--foreground)]">
        <p>Opened: {point.opened}</p>
        <p>Closed: {point.closed}</p>
        <p>Net backlog delta: {point.backlogDelta}</p>
      </div>
    </div>
  );
}

export function IssueFlowHealthChart({
  data,
}: {
  data: IssueFlowHealthPoint[];
}) {
  const { ref, size, ready } = useChartSize<HTMLDivElement>();
  const chartColors = useResolvedChartColors();
  const openedColor = chartColors.primarySoft;
  const closedColor = chartColors.primary;
  const backlogColor = chartColors.accent;

  if (!data.length) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] text-sm text-[var(--muted-foreground)]">
        No issue flow data available.
      </div>
    );
  }

  return (
    <div className="h-[220px] w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-3 sm:p-4">
      <div ref={ref} className="h-full w-full min-w-0 overflow-hidden">
        {ready ? (
          <ComposedChart
            accessibilityLayer={false}
            width={size.width}
            height={size.height}
            data={data}
            margin={{ top: 12, right: 16, left: 8, bottom: 12 }}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              minTickGap={16}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              yAxisId="counts"
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              width={24}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              yAxisId="backlog"
              orientation="right"
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              width={28}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--accent-soft)" }}
              content={<IssueFlowTooltip />}
              wrapperStyle={{ outline: "none", zIndex: 20 }}
              allowEscapeViewBox={{ x: false, y: false }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              yAxisId="counts"
              dataKey="opened"
              name="Opened"
              fill={openedColor}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              yAxisId="counts"
              dataKey="closed"
              name="Closed"
              fill={closedColor}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
            <Line
              yAxisId="backlog"
              type="monotone"
              dataKey="backlogDelta"
              name="Net backlog"
              stroke={backlogColor}
              strokeWidth={2}
              dot={{
                r: 3,
                fill: backlogColor,
              }}
              activeDot={{
                r: 5,
                fill: backlogColor,
              }}
              isAnimationActive={false}
            />
          </ComposedChart>
        ) : (
          <div className="h-full w-full rounded-xl bg-[var(--card)]/70" />
        )}
      </div>
    </div>
  );
}

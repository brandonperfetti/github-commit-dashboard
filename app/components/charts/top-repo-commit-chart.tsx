"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useChartSize } from "@/app/components/charts/use-chart-size";
import { useResolvedChartColors } from "@/app/components/charts/use-resolved-chart-colors";

type TopRepoCommitPoint = {
  name: string;
  fullName: string;
  commits: number;
};

const CHARACTER_PIXEL_WIDTH = 7;
const LABEL_PADDING = 20;

type TopRepoCommitTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: TopRepoCommitPoint }>;
  color?: string;
};

function TopRepoCommitTooltip({
  active,
  payload,
  color,
}: TopRepoCommitTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="max-w-[220px] rounded-xl border border-[var(--border-strong)] bg-[var(--background)] p-2.5 text-xs shadow-md">
      <p
        className="truncate font-medium text-[var(--foreground)]"
        title={point.fullName}
      >
        {point.fullName}
      </p>
      <div className="mt-2 inline-flex items-center gap-1.5 text-[var(--foreground)]">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color ?? "var(--chart-primary)" }}
        />
        Commits: {point.commits}
      </div>
    </div>
  );
}

export function TopRepoCommitChart({ data }: { data: TopRepoCommitPoint[] }) {
  const { ref, size, ready } = useChartSize<HTMLDivElement>();
  const chartColors = useResolvedChartColors();
  const yAxisWidth = useMemo(() => {
    const longestNameLength = data.reduce(
      (longest, point) => Math.max(longest, point.name.length),
      0,
    );
    const estimatedWidth =
      longestNameLength * CHARACTER_PIXEL_WIDTH + LABEL_PADDING;
    const maxWidth = size.width > 0 ? size.width * 0.45 : 200;

    return Math.max(110, Math.min(estimatedWidth, maxWidth));
  }, [data, size.width]);

  if (!data.length) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] text-sm text-[var(--muted-foreground)]">
        No commit distribution data available.
      </div>
    );
  }

  return (
    <div className="h-[220px] w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-3 sm:p-4">
      <div ref={ref} className="h-full w-full min-w-0 overflow-hidden">
        {ready ? (
          <BarChart
            width={size.width}
            height={size.height}
            data={data}
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
              content={<TopRepoCommitTooltip color={chartColors.primary} />}
              wrapperStyle={{ outline: "none", zIndex: 20 }}
              allowEscapeViewBox={{ x: false, y: false }}
            />
            <Bar
              dataKey="commits"
              fill={chartColors.primary}
              fillOpacity={0.9}
              barSize={12}
              radius={[0, 5, 5, 0]}
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

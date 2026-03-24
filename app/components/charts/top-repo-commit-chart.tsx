"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useChartSize } from "@/app/components/charts/use-chart-size";

type TopRepoCommitPoint = {
  name: string;
  fullName: string;
  commits: number;
};

type TopRepoCommitTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: TopRepoCommitPoint }>;
};

function TopRepoCommitTooltip({ active, payload }: TopRepoCommitTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload as TopRepoCommitPoint | undefined;
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
        <span className="h-2 w-2 rounded-full bg-emerald-500/90" />
        Commits: {point.commits}
      </div>
    </div>
  );
}

export function TopRepoCommitChart({ data }: { data: TopRepoCommitPoint[] }) {
  const { ref, size, ready } = useChartSize<HTMLDivElement>();

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
            accessibilityLayer={false}
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
              width={110}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--accent-soft)" }}
              content={<TopRepoCommitTooltip />}
              wrapperStyle={{ outline: "none", zIndex: 20 }}
              allowEscapeViewBox={{ x: false, y: false }}
            />
            <Bar
              dataKey="commits"
              fill="#10b981"
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

"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useChartSize } from "@/app/components/charts/use-chart-size";
import { useResolvedChartColors } from "@/app/components/charts/use-resolved-chart-colors";
import type { RepoPushCadencePoint } from "@/lib/github";

type CadenceTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: RepoPushCadencePoint }>;
};

function CadenceTooltip({ active, payload }: CadenceTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="max-w-[220px] rounded-xl border border-[var(--border-strong)] bg-[var(--background)] p-2.5 text-xs shadow-md">
      <p className="font-medium text-[var(--foreground)]">{point.range}</p>
      <div className="mt-2 inline-flex items-center gap-1.5 text-[var(--foreground)]">
        <span className="h-2 w-2 rounded-full bg-[var(--chart-primary)]/90" />
        Weekly commits: {point.value}
      </div>
    </div>
  );
}

export function RepoPushCadenceChart({
  data,
}: {
  data: RepoPushCadencePoint[];
}) {
  const { ref, size, ready } = useChartSize<HTMLDivElement>();
  const chartColors = useResolvedChartColors();

  if (!data.length) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] text-sm text-[var(--muted-foreground)]">
        No push cadence data available.
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-3 sm:p-4">
      <div ref={ref} className="h-full w-full min-w-0 overflow-hidden">
        {ready ? (
          <BarChart
            width={size.width}
            height={size.height}
            data={data}
            margin={{ top: 20, right: 24, left: 24, bottom: 24 }}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              minTickGap={22}
              padding={{ left: 12, right: 12 }}
              tickMargin={10}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              domain={[0, "dataMax + 1"]}
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              width={30}
              tickMargin={6}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--accent-soft)" }}
              content={<CadenceTooltip />}
              wrapperStyle={{ outline: "none", zIndex: 20 }}
              allowEscapeViewBox={{ x: false, y: false }}
            />
            <Bar
              dataKey="value"
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

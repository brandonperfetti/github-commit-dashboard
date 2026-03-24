"use client";

import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartSize } from "@/app/components/charts/use-chart-size";

type RepoFreshnessPoint = {
  name: string;
  fullName: string;
  daysSincePush: number;
  lastPushLabel: string;
};

type FreshnessTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: RepoFreshnessPoint }>;
};

function freshnessBand(days: number) {
  if (days <= 3) {
    return {
      label: "Fresh (0-3 days)",
      fill: "#10b981",
      opacity: 0.9,
    };
  }

  if (days <= 7) {
    return {
      label: "Warm (4-7 days)",
      fill: "#10b981",
      opacity: 0.62,
    };
  }

  return {
    label: "Stale (8+ days)",
    fill: "#10b981",
    opacity: 0.38,
  };
}

function FreshnessTooltip({ active, payload }: FreshnessTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload as RepoFreshnessPoint | undefined;
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
          style={{ backgroundColor: band.fill, opacity: band.opacity }}
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
              content={<FreshnessTooltip />}
              wrapperStyle={{ outline: "none", zIndex: 20 }}
              allowEscapeViewBox={{ x: false, y: false }}
            />
            <Bar
              dataKey="daysSincePush"
              barSize={12}
              radius={[0, 5, 5, 0]}
              isAnimationActive={false}
            >
              {data.map((row) => {
                const band = freshnessBand(row.daysSincePush);
                return (
                  <Cell
                    key={`${row.fullName}-${row.daysSincePush}`}
                    fill={band.fill}
                    fillOpacity={band.opacity}
                  />
                );
              })}
            </Bar>
          </BarChart>
        ) : (
          <div className="h-full w-full rounded-xl bg-[var(--card)]/70" />
        )}
      </div>
      <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-[var(--muted-foreground)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500/90" />
          Fresh (0-3d)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500/60" />
          Warm (4-7d)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500/40" />
          Stale (8+d)
        </span>
      </div>
    </div>
  );
}

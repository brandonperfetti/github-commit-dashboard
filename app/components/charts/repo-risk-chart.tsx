"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartSize } from "@/app/components/charts/use-chart-size";
import type { RepoRiskBucket, RepoRiskSnapshot } from "@/lib/github";

const RISK_COLORS = ["#10b981", "#34d399", "#6ee7b7", "#f59e0b"];
const MOBILE_LABEL_BREAKPOINT = 520;

function compactRiskLabel(label: string) {
  return label.replace(/\s*\([^)]*\)/g, "").trim();
}

type RepoRiskTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: RepoRiskBucket }>;
};

function RepoRiskTooltip({ active, payload }: RepoRiskTooltipProps) {
  const point = payload?.[0]?.payload as RepoRiskBucket | undefined;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="max-w-[220px] rounded-xl border border-[var(--border-strong)] bg-[var(--background)] px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-[var(--foreground)]">
        {point.label}
      </p>
      <p className="mt-1 text-sm text-[var(--foreground)]">
        {point.count} repos
      </p>
    </div>
  );
}

export function RepoRiskChart({ snapshot }: { snapshot: RepoRiskSnapshot }) {
  const { ref, size, ready } = useChartSize<HTMLDivElement>();
  const visibleBuckets = snapshot.buckets.filter(
    (bucket) => !bucket.label.toLowerCase().includes("archived"),
  );
  const useCompactLabels =
    size.width > 0 && size.width <= MOBILE_LABEL_BREAKPOINT;

  if (!visibleBuckets.length) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] text-sm text-[var(--muted-foreground)]">
        No risk snapshot data available.
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-3 sm:p-4">
      <div ref={ref} className="h-full w-full min-w-0 overflow-hidden">
        {ready ? (
          <BarChart
            accessibilityLayer={false}
            width={size.width}
            height={size.height}
            data={visibleBuckets}
            margin={{ top: 14, right: 16, left: 8, bottom: 34 }}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              interval={0}
              tickFormatter={(value) =>
                useCompactLabels
                  ? compactRiskLabel(String(value))
                  : String(value)
              }
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              width={26}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--accent-soft)" }}
              content={<RepoRiskTooltip />}
              wrapperStyle={{ outline: "none", zIndex: 20 }}
              allowEscapeViewBox={{ x: false, y: false }}
            />
            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            >
              {visibleBuckets.map((bucket, index) => (
                <Cell
                  key={`${bucket.label}-${bucket.count}`}
                  fill={RISK_COLORS[index % RISK_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <div className="h-full w-full rounded-xl bg-[var(--card)]/70" />
        )}
      </div>
    </div>
  );
}

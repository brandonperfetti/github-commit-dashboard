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

type RepoScatterPoint = {
  name: string;
  fullName: string;
  commits30d: number;
  daysSincePush: number;
  sourceLabel: "Pinned" | "Non-pinned";
  pinned: boolean;
};

type ScatterTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: RepoScatterPoint }>;
};

function ScatterTooltip({ active, payload }: ScatterTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload as RepoScatterPoint | undefined;
  if (!point) return null;

  return (
    <div className="max-w-[260px] rounded-xl border border-[var(--border-strong)] bg-[var(--background)] p-2.5 text-xs shadow-md">
      <p
        className="truncate font-medium text-[var(--foreground)]"
        title={point.fullName}
      >
        {point.fullName}
      </p>
      <div className="mt-2 space-y-1 text-[var(--foreground)]">
        <p>{point.sourceLabel}</p>
        <p>Commits (30d): {point.commits30d}</p>
        <p>{point.daysSincePush}d since push</p>
      </div>
    </div>
  );
}

export function ReposScatterChart({ data }: { data: RepoScatterPoint[] }) {
  const { ref, size, ready } = useChartSize<HTMLDivElement>();

  if (!data.length) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] text-sm text-[var(--muted-foreground)]">
        No repository metrics available.
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-3 sm:p-4">
      <div ref={ref} className="h-full w-full min-w-0 overflow-hidden">
        {ready ? (
          <div className="relative h-full w-full">
            <BarChart
              accessibilityLayer={false}
              width={size.width}
              height={size.height}
              data={data}
              layout="vertical"
              barCategoryGap={18}
              barGap={3}
              margin={{ top: 20, right: 24, left: 24, bottom: 42 }}
            >
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, "dataMax + 1"]}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                padding={{ left: 12, right: 12 }}
                tickMargin={10}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: "var(--accent-soft)" }}
                content={<ScatterTooltip />}
                wrapperStyle={{ outline: "none", zIndex: 20 }}
                allowEscapeViewBox={{ x: false, y: false }}
              />
              <Bar
                dataKey="commits30d"
                fill="#10b981"
                fillOpacity={0.95}
                barSize={16}
                radius={[0, 5, 5, 0]}
                isAnimationActive={false}
              >
                {data.map((point, index) => (
                  <Cell
                    key={`repo-momentum-${point.fullName}-${index}`}
                    fill={point.pinned ? "#059669" : "#34d399"}
                  />
                ))}
              </Bar>
            </BarChart>
            <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-center gap-4 text-xs text-[var(--muted-foreground)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" />
                Pinned
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                Non-pinned
              </span>
            </div>
          </div>
        ) : (
          <div className="h-full w-full rounded-xl bg-[var(--card)]/70" />
        )}
      </div>
    </div>
  );
}

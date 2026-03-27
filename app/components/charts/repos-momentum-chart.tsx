"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useChartSize } from "@/app/components/charts/use-chart-size";
import { useResolvedChartColors } from "@/app/components/charts/use-resolved-chart-colors";

type RepoMomentumPoint = {
  name: string;
  fullName: string;
  commits30d: number;
  daysSincePush: number;
  sourceLabel: "Pinned" | "Non-pinned";
  pinned: boolean;
};

type MomentumTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: RepoMomentumPoint }>;
};

function MomentumTooltip({ active, payload }: MomentumTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
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
        <p>
          {point.pinned
            ? point.daysSincePush > 0
              ? `Pinned - ${point.daysSincePush}d since push`
              : "Pinned"
            : `${point.daysSincePush}d since push`}
        </p>
      </div>
    </div>
  );
}

export function ReposMomentumChart({ data }: { data: RepoMomentumPoint[] }) {
  const { ref, size, ready } = useChartSize<HTMLDivElement>();
  const chartColors = useResolvedChartColors();

  if (!data.length) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] text-sm text-[var(--muted-foreground)]">
        No repository metrics available.
      </div>
    );
  }

  const chartData = data.map((point) => ({
    ...point,
    fill: point.pinned ? chartColors.pinned : chartColors.unpinned,
  }));

  return (
    <div className="h-[320px] w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-3 sm:p-4">
      <div ref={ref} className="h-full w-full min-w-0 overflow-hidden">
        {ready ? (
          <div className="relative h-full w-full">
            <BarChart
              width={size.width}
              height={size.height}
              data={chartData}
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
                content={<MomentumTooltip />}
                wrapperStyle={{ outline: "none", zIndex: 20 }}
                allowEscapeViewBox={{ x: false, y: false }}
              />
              <Bar
                dataKey="commits30d"
                fill={chartColors.primary}
                fillOpacity={0.95}
                barSize={16}
                radius={[0, 5, 5, 0]}
                isAnimationActive={false}
                shape={(props: {
                  x?: number;
                  y?: number;
                  width?: number;
                  height?: number;
                  payload?: { fill?: string };
                }) => {
                  const {
                    x = 0,
                    y = 0,
                    width = 0,
                    height = 0,
                    payload,
                  } = props;
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      rx={5}
                      ry={5}
                      fill={payload?.fill ?? chartColors.primary}
                    />
                  );
                }}
              />
            </BarChart>
            <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-center gap-4 text-xs text-[var(--muted-foreground)]">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: chartColors.pinned }}
                />
                Pinned
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: chartColors.unpinned }}
                />
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

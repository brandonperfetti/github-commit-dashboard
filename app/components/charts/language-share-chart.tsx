"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { useChartSize } from "@/app/components/charts/use-chart-size";
import { cn } from "@/lib/utils";

type LanguageSharePoint = {
  name: string;
  value: number;
};

type LanguageShareTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: LanguageSharePoint; color?: string }>;
};

const LANGUAGE_COLORS = [
  "#10b981",
  "#34d399",
  "#6ee7b7",
  "#2dd4bf",
  "#14b8a6",
  "#99f6e4",
];

function LanguageShareTooltip({ active, payload }: LanguageShareTooltipProps) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const point = entry.payload as LanguageSharePoint | undefined;
  if (!point) return null;

  const color = entry.color ?? "#10b981";

  return (
    <div className="max-w-[220px] rounded-xl border border-[var(--border-strong)] bg-[var(--background)] px-3 py-2 text-xs shadow-md">
      <p
        className="truncate font-medium text-[var(--foreground)]"
        title={point.name}
      >
        {point.name}
      </p>
      <div className="mt-1.5 inline-flex items-center gap-1.5 text-[var(--foreground)]">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span>
          {point.value} {point.value === 1 ? "repo" : "repos"}
        </span>
      </div>
    </div>
  );
}

export function LanguageShareChart({
  data,
  frameless = false,
}: {
  data: LanguageSharePoint[];
  frameless?: boolean;
}) {
  const { ref, size, ready } = useChartSize<HTMLDivElement>();
  const isDense = data.length >= 6;
  const legendGapClass = isDense ? "gap-1.5" : "gap-2";
  const legendItemPaddingClass = isDense ? "px-2.5 py-1.5" : "px-2.5 py-2";

  if (!data.length) {
    return (
      <div
        className={cn(
          "flex h-[240px] items-center justify-center rounded-2xl text-sm text-[var(--muted-foreground)]",
          frameless
            ? "bg-transparent"
            : "border border-[var(--border)] bg-[var(--card-muted)]",
        )}
      >
        No language data available.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-2xl sm:h-[240px]",
        frameless
          ? "bg-transparent p-0"
          : "border border-[var(--border)] bg-[var(--card-muted)] p-3 sm:p-4",
      )}
    >
      <div className="grid gap-3 sm:h-full sm:grid-cols-[1fr_0.95fr] sm:gap-4">
        <div ref={ref} className="h-[150px] min-w-0 overflow-hidden sm:h-full">
          {ready ? (
            <PieChart
              accessibilityLayer={false}
              width={size.width}
              height={size.height}
            >
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={46}
                outerRadius={76}
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`language-${entry.name}`}
                    fill={LANGUAGE_COLORS[index % LANGUAGE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={<LanguageShareTooltip />}
                wrapperStyle={{ outline: "none", zIndex: 20 }}
                allowEscapeViewBox={{ x: false, y: false }}
              />
            </PieChart>
          ) : (
            <div className="h-full w-full rounded-xl bg-[var(--card)]/70" />
          )}
        </div>
        <div
          className={cn(
            "flex h-full min-w-0 flex-col justify-center pt-2 pb-3",
            legendGapClass,
          )}
        >
          {data.map((item, index) => (
            <div
              key={`legend-${item.name}`}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs",
                legendItemPaddingClass,
              )}
            >
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      LANGUAGE_COLORS[index % LANGUAGE_COLORS.length],
                  }}
                />
                <span className="truncate">{item.name}</span>
              </div>
              <span className="font-medium text-[var(--foreground)]">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

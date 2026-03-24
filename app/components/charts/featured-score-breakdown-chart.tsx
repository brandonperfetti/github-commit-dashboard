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

type FeaturedScorePoint = {
  name: string;
  stars: number;
  daysSincePush: number;
  commits30d: number;
  pinned: boolean;
  sourceLabel: "Pinned" | "Star-ranked";
  pinnedBoost: number;
  starsScore: number;
  recencyScore: number;
  commitScore: number;
  relevanceScore: number;
};

type FeaturedScoreTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ payload?: FeaturedScorePoint }>;
};

function FeaturedScoreTooltip({
  active,
  label,
  payload,
}: FeaturedScoreTooltipProps) {
  const point = payload?.[0]?.payload as FeaturedScorePoint | undefined;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="max-w-[320px] rounded-xl border border-[var(--border-strong)] bg-[var(--background)] px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-[var(--foreground)]">
        Repo: {label}
      </p>
      <p className="mt-1 text-sm leading-5 text-[var(--foreground)]">
        Relevance: {point.relevanceScore}/100
      </p>
      <p className="text-sm leading-5 text-[var(--muted-foreground)]">
        {point.sourceLabel} • {point.stars}★ • {point.commits30d} commits (30d)
      </p>
      <p className="text-sm leading-5 text-[var(--muted-foreground)]">
        {point.daysSincePush}d since push
      </p>
    </div>
  );
}

export function FeaturedScoreBreakdownChart({
  data,
}: {
  data: FeaturedScorePoint[];
}) {
  const { ref, size, ready } = useChartSize<HTMLDivElement>();

  if (!data.length) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] text-sm text-[var(--muted-foreground)]">
        No featured scoring data available.
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-3 sm:p-4">
      <div ref={ref} className="h-full w-full min-w-0 overflow-hidden">
        {ready ? (
          <BarChart
            accessibilityLayer={false}
            width={size.width}
            height={size.height}
            data={data}
            layout="vertical"
            margin={{ top: 18, right: 18, left: 18, bottom: 18 }}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="relevanceScore"
              domain={[0, 100]}
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              padding={{ right: 8 }}
              tickMargin={10}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--accent-soft)" }}
              content={<FeaturedScoreTooltip />}
              wrapperStyle={{
                outline: "none",
                zIndex: 20,
              }}
              allowEscapeViewBox={{ x: false, y: false }}
            />
            <Bar
              dataKey="relevanceScore"
              name="Relevance"
              fill="#10b981"
              radius={[0, 6, 6, 0]}
              isAnimationActive={false}
            >
              {data.map((point, index) => (
                <Cell
                  key={`featured-star-${point.name}`}
                  fill={point.pinned ? "#10b981" : "#34d399"}
                  fillOpacity={index === 0 ? 1 : 0.9}
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

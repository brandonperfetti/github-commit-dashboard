import ContributionHeatmap, {
  HeatmapLegend,
} from "@/app/components/contribution-heatmap";
import { CommitTimingHeatmapLocalized } from "@/app/components/charts/commit-timing-heatmap-localized";
import { ContributionTrendChart } from "@/app/components/charts/contribution-trend-chart";
import { IssueFlowHealthChart } from "@/app/components/charts/issue-flow-health-chart";
import { PrCycleTimeChart } from "@/app/components/charts/pr-cycle-time-chart";
import { PrFlowHealthChart } from "@/app/components/charts/pr-flow-health-chart";
import { PrThroughputChart } from "@/app/components/charts/pr-throughput-chart";
import { AnimatedHeadline } from "@/app/components/motion/animated-headline";
import { ScrollReveal } from "@/app/components/motion/scroll-reveal";
import { SectionShell } from "@/app/components/section-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  buildWeeklyTotals,
  currentStreak,
  DAYS,
  longestStreak,
  prettyDay,
  prettyLongDay,
  type CommitTimingHeatmapData,
  type ContributionDay,
  type IssueFlowHealthPoint,
  type PullRequestHealthPoint,
} from "@/lib/github";
import { cn } from "@/lib/utils";

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl border border-[var(--border)] bg-[linear-gradient(110deg,var(--card-muted)_20%,var(--accent-soft)_45%,var(--card-muted)_70%)] bg-[length:220%_100%]",
        "motion-safe:animate-[pulse_1.5s_ease-in-out_infinite]",
        className,
      )}
      aria-hidden
    />
  );
}

// Intentionally kept module-local until another route/module needs it.
// Avoid exporting helpers that currently have a single-file call site.
function computeActivityStats(days: ContributionDay[]) {
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const activeDays = days.filter((day) => day.count > 0).length;
  const bestDay =
    days.length > 0
      ? days.reduce((best, day) => (day.count > best.count ? day : best))
      : null;
  const weeklyTotals = buildWeeklyTotals(days);

  return {
    total,
    activeDays,
    bestDay,
    weeklyTotals,
    currentStreakDays: currentStreak(days),
    longestStreakDays: longestStreak(days),
    averagePerDay: total / DAYS,
  };
}

export function ActivityHeroSection({ days }: { days: ContributionDay[] }) {
  const { total, activeDays, currentStreakDays, longestStreakDays } =
    computeActivityStats(days);

  return (
    <SectionShell className="overflow-hidden p-0">
      <div className="border-b border-[var(--border)] bg-[var(--hero)] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs tracking-[0.35em] text-emerald-500/80 uppercase">
              Build
            </p>
            <AnimatedHeadline
              text="Shipping signal, not vanity metrics."
              variant="line"
              className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl"
            />
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
              A plain-language view of the last {DAYS} days: how often work
              shipped, how steady the pace was, and where momentum built.
            </p>
          </div>
        </div>
      </div>

      <ScrollReveal y={12} delay={0.14}>
        <div className="grid gap-3 px-4 py-4 sm:px-6 sm:py-6 md:grid-cols-4 lg:px-8">
          {[
            { label: "Total contributions", value: total },
            { label: "Active days", value: `${activeDays}/${DAYS}` },
            { label: "Current streak", value: `${currentStreakDays} days` },
            { label: "Best streak", value: `${longestStreakDays} days` },
          ].map((card) => (
            <Card
              key={card.label}
              className="rounded-2xl bg-[var(--card-muted)] p-4 shadow-none transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--accent-soft)] hover:shadow-[0_14px_30px_rgba(15,23,42,0.1)] motion-reduce:hover:translate-y-0 sm:p-5"
            >
              <CardDescription>{card.label}</CardDescription>
              <div className="mt-2 text-3xl font-semibold tracking-tight">
                {card.value}
              </div>
            </Card>
          ))}
        </div>
      </ScrollReveal>
    </SectionShell>
  );
}

export function ActivityHeatmapSection({ days }: { days: ContributionDay[] }) {
  const { activeDays, bestDay, weeklyTotals, averagePerDay } =
    computeActivityStats(days);

  return (
    <SectionShell>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            30-day heatmap
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Daily contribution intensity across the last 30 days.
          </p>
        </div>
        <div className="shrink-0">
          <HeatmapLegend />
        </div>
      </div>

      <ScrollReveal y={10} delay={0.08}>
        <div className="mt-4 sm:mt-5">
          <ContributionHeatmap days={days} />
        </div>
      </ScrollReveal>

      <div className="mt-4 flex flex-wrap gap-2.5 text-sm text-[var(--muted-foreground)] sm:mt-5">
        <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--background)] px-3 py-1.5 shadow-sm">
          Best day:{" "}
          <span className="font-medium text-[var(--foreground)]">
            {bestDay ? prettyDay(bestDay.date) : "N/A"}
          </span>{" "}
          · {bestDay?.count ?? 0}
        </div>
        <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--background)] px-3 py-1.5 shadow-sm">
          Average/day:{" "}
          <span className="font-medium text-[var(--foreground)]">
            {averagePerDay.toFixed(1)}
          </span>
        </div>
        <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--background)] px-3 py-1.5 shadow-sm">
          Activity rate:{" "}
          <span className="font-medium text-[var(--foreground)]">
            {Math.round((activeDays / DAYS) * 100)}%
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-5">
        {weeklyTotals.map((week) => (
          <Card
            key={week.label}
            className="rounded-2xl bg-[var(--card-muted)] p-4 shadow-none transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--accent-soft)] hover:shadow-[0_14px_30px_rgba(15,23,42,0.1)] motion-reduce:hover:translate-y-0"
          >
            <p className="text-xs tracking-[0.18em] text-[var(--muted-foreground)] uppercase">
              {week.label}
            </p>
            <p className="mt-2 text-2xl font-semibold">{week.total}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {week.range}
            </p>
          </Card>
        ))}
      </div>
    </SectionShell>
  );
}

export function ActivityFlowHealthSection({
  prHealthData,
  issueFlowData,
}: {
  prHealthData: PullRequestHealthPoint[];
  issueFlowData: IssueFlowHealthPoint[];
}) {
  return (
    <SectionShell>
      <h2 className="text-xl font-semibold">Flow health</h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Weekly pull request and issue quality signals for the current 30-day
        window.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight">
            PR cycle time
          </h3>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Median open-to-merge time by week (hours).
          </p>
          <div className="mt-3">
            <PrCycleTimeChart data={prHealthData} />
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight">
            PR flow health
          </h3>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Weekly merge and reopen rates for authored pull requests.
          </p>
          <div className="mt-3">
            <PrFlowHealthChart data={prHealthData} />
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight">
            Issue flow health
          </h3>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Weekly opened vs closed issues and net backlog delta.
          </p>
          <div className="mt-3">
            <IssueFlowHealthChart data={issueFlowData} />
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-[var(--muted-foreground)]">
        Rates are calculated from pull requests closed in each weekly window.
      </p>
    </SectionShell>
  );
}

export function ActivityCommitTimingSection({
  commitTimingHeatmap,
}: {
  commitTimingHeatmap: CommitTimingHeatmapData;
}) {
  const countsChecksum = commitTimingHeatmap.cells.reduce((hash, cell) => {
    return (hash * 31 + cell.count) >>> 0;
  }, 0);
  const heatmapIdentityKey = `${commitTimingHeatmap.timezone}:${commitTimingHeatmap.totalCommits}:${commitTimingHeatmap.maxCellCount}:${commitTimingHeatmap.cells.length}:${countsChecksum.toString(36)}`;

  return (
    <SectionShell>
      <h2 className="text-xl font-semibold">Commit timing heatmap</h2>
      {/* Intentionally use a key so localized client state re-initializes when
          server-provided heatmap payload changes, without set-state-in-effect. */}
      <CommitTimingHeatmapLocalized
        key={heatmapIdentityKey}
        initialData={commitTimingHeatmap}
      />
    </SectionShell>
  );
}

export function ActivityTrendBreakdownSection({
  days,
  prHealthData,
}: {
  days: ContributionDay[];
  prHealthData: PullRequestHealthPoint[];
}) {
  const trendData = days.map((day) => ({
    date: prettyDay(day.date),
    count: day.count,
  }));
  const prThroughputData = prHealthData.map((point) => ({
    label: point.label,
    range: point.range,
    opened: point.opened,
    merged: point.merged,
    closed: point.closed,
  }));

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <SectionShell className="min-w-0">
        <CardHeader>
          <CardTitle>Activity trend</CardTitle>
          <CardDescription>
            Daily contributions over the last 30 days.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-5 p-0">
          <ContributionTrendChart data={trendData} />
        </CardContent>

        <div className="mt-5 text-sm leading-7 text-[var(--muted-foreground)]">
          Weekly totals show whether output is steady or spiky.
        </div>

        <div className="mt-6">
          <h3 className="text-base font-semibold tracking-tight">
            PR throughput
          </h3>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Weekly pull requests opened, merged, and closed.
          </p>
          <div className="mt-3">
            <PrThroughputChart data={prThroughputData} />
          </div>
        </div>
      </SectionShell>

      <SectionShell className="min-w-0">
        <h2 className="text-xl font-semibold">Daily breakdown</h2>
        <div className="mt-5 max-h-[44rem] max-w-full overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--card-muted)]">
          <table className="w-full min-w-full divide-y divide-[var(--border)] text-left text-sm">
            <thead className="sticky top-0 z-30 bg-[var(--background)] text-[var(--muted-foreground)]">
              <tr>
                <th className="border-b border-[var(--border)] bg-[var(--background)] px-4 py-3 font-medium">
                  Date
                </th>
                <th className="border-b border-[var(--border)] bg-[var(--background)] px-4 py-3 font-medium">
                  Contributions
                </th>
                <th className="border-b border-[var(--border)] bg-[var(--background)] px-4 py-3 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {days
                .slice()
                .reverse()
                .map((day, index) => (
                  <tr
                    key={`${day.date}-${index}`}
                    className="transition hover:bg-[var(--accent-soft)]"
                  >
                    <td className="px-4 py-3">{prettyLongDay(day.date)}</td>
                    <td className="px-4 py-3 font-medium">{day.count}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">
                      {day.count === 0
                        ? "Quiet"
                        : day.count < 4
                          ? "Active"
                          : "Heavy"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </SectionShell>
    </section>
  );
}

export function ActivityHeroSkeleton() {
  return (
    <SectionShell className="overflow-hidden p-0">
      <div className="border-b border-[var(--border)] bg-[var(--hero)] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <SkeletonBlock className="h-3 w-14" />
        <SkeletonBlock className="mt-4 h-10 w-80 max-w-full" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-2xl" />
      </div>
      <div className="grid gap-3 px-4 py-4 sm:px-6 sm:py-6 md:grid-cols-4 lg:px-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-24" />
        ))}
      </div>
    </SectionShell>
  );
}

export function ActivitySectionSkeleton({
  titleWidth = "w-44",
  lineWidth = "w-72",
  bodyHeight = "h-56",
}: {
  titleWidth?: string;
  lineWidth?: string;
  bodyHeight?: string;
}) {
  return (
    <SectionShell>
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <SkeletonBlock className={`h-6 ${titleWidth}`} />
          <SkeletonBlock className={`h-4 ${lineWidth}`} />
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500/60" />
          <SkeletonBlock className="h-3 w-18 rounded-full" />
        </div>
      </div>
      <SkeletonBlock className={`mt-5 ${bodyHeight} w-full`} />
      <div className="mt-3 grid grid-cols-3 gap-2">
        <SkeletonBlock className="h-2.5 w-full rounded-full" />
        <SkeletonBlock className="h-2.5 w-full rounded-full" />
        <SkeletonBlock className="h-2.5 w-full rounded-full" />
      </div>
    </SectionShell>
  );
}

export function ActivityTrendBreakdownSkeleton() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <SectionShell className="min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <SkeletonBlock className="h-6 w-40" />
            <SkeletonBlock className="h-4 w-72" />
          </div>
          <SkeletonBlock className="hidden h-7 w-24 rounded-full sm:block" />
        </div>
        <SkeletonBlock className="mt-5 h-56 w-full" />
        <SkeletonBlock className="mt-6 h-4 w-64" />
        <SkeletonBlock className="mt-4 h-48 w-full" />
      </SectionShell>
      <SectionShell className="min-w-0">
        <SkeletonBlock className="h-6 w-40" />
        <SkeletonBlock className="mt-5 h-96 w-full" />
      </SectionShell>
    </section>
  );
}

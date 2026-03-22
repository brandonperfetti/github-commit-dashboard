import ContributionHeatmap, { HeatmapLegend } from '@/app/components/ContributionHeatmap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { SectionShell } from '@/app/components/section-shell';
import {
  buildSparklinePoints,
  buildWeeklyTotals,
  currentStreak,
  DAYS,
  longestStreak,
  prettyDay,
  type ContributionDay,
} from '@/lib/github';

export function ActivityOverview({ days, compact = false }: { days: ContributionDay[]; compact?: boolean }) {
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const activeDays = days.filter((day) => day.count > 0).length;
  const bestDay = days.reduce((best, day) => (day.count > best.count ? day : best), days[0]);
  const weeklyTotals = buildWeeklyTotals(days);
  const sparklinePoints = buildSparklinePoints(days);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <SectionShell className="overflow-hidden p-0">
        <div className="border-b border-[var(--border)] bg-[var(--hero)] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-500/80">Build</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">Shipping signal, not vanity metrics.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
                Public GitHub contribution activity for the last {DAYS} days, packaged as a clean daily operating view.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 px-4 py-4 sm:px-6 sm:py-6 md:grid-cols-4 lg:px-8">
          {[
            { label: 'Total contributions', value: total },
            { label: 'Active days', value: `${activeDays}/${DAYS}` },
            { label: 'Current streak', value: `${currentStreak(days)} days` },
            { label: 'Best streak', value: `${longestStreak(days)} days` },
          ].map((card) => (
            <Card key={card.label} className="rounded-2xl bg-[var(--card-muted)] p-4 sm:p-5 shadow-none">
              <CardDescription>{card.label}</CardDescription>
              <div className="mt-2 text-3xl font-semibold tracking-tight">{card.value}</div>
            </Card>
          ))}
        </div>
      </SectionShell>

      <SectionShell>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">30-day heatmap</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Contribution activity over the last 30 days.</p>
          </div>
          <HeatmapLegend />
        </div>

        <ContributionHeatmap days={days} />

        <div className="mt-6 flex flex-wrap gap-3 text-sm text-[var(--muted-foreground)]">
          <div className="rounded-full border border-[var(--border)] bg-[var(--card-muted)] px-3 py-1.5">
            Best day: <span className="font-medium text-[var(--foreground)]">{prettyDay(bestDay.date)}</span> · {bestDay.count}
          </div>
          <div className="rounded-full border border-[var(--border)] bg-[var(--card-muted)] px-3 py-1.5">
            Average/day: <span className="font-medium text-[var(--foreground)]">{(total / DAYS).toFixed(1)}</span>
          </div>
          <div className="rounded-full border border-[var(--border)] bg-[var(--card-muted)] px-3 py-1.5">
            Activity rate: <span className="font-medium text-[var(--foreground)]">{Math.round((activeDays / DAYS) * 100)}%</span>
          </div>
        </div>

        {!compact ? (
          <div className="mt-8 grid gap-3 md:grid-cols-5">
            {weeklyTotals.map((week) => (
              <Card key={week.label} className="rounded-2xl bg-[var(--card-muted)] p-4 shadow-none">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{week.label}</p>
                <p className="mt-2 text-2xl font-semibold">{week.total}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{week.range}</p>
              </Card>
            ))}
          </div>
        ) : null}
      </SectionShell>

      {!compact ? (
        <section className="grid gap-4 md:grid-cols-[1.6fr_1fr]">
          <SectionShell>
            <h2 className="text-xl font-semibold">Daily breakdown</h2>
            <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card-muted)]">
              <table className="min-w-[520px] divide-y divide-[var(--border)] text-left text-sm sm:min-w-full">
                <thead className="bg-[var(--accent-soft)] text-[var(--muted-foreground)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Contributions</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {days
                    .slice()
                    .reverse()
                    .map((day) => (
                      <tr key={day.date} className="transition hover:bg-[var(--accent-soft)]">
                        <td className="px-4 py-3">{day.date}</td>
                        <td className="px-4 py-3 font-medium">{day.count}</td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          {day.count === 0 ? 'Quiet' : day.count < 4 ? 'Active' : 'Heavy'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </SectionShell>

          <SectionShell>
            <CardHeader>
              <CardTitle>Activity trend</CardTitle>
              <CardDescription>Daily contribution totals over the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-4">
              <svg viewBox="0 0 260 72" className="h-[72px] w-full overflow-visible">
                <polyline
                  fill="none"
                  stroke="rgba(16, 185, 129, 0.95)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={sparklinePoints}
                />
              </svg>
            </CardContent>

            <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--muted-foreground)]">
              <p>Weekly totals show whether output is steady or spiky.</p>
              <p>The sparkline gives you an at-a-glance read of stronger push days versus quiet stretches.</p>
            </div>
          </SectionShell>
        </section>
      ) : null}
    </div>
  );
}

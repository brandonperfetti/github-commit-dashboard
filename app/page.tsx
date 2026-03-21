export const dynamic = "force-dynamic";

type ContributionDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

const USERNAME = "brandonperfetti";
const DAYS = 30;
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function levelForCount(count: number): ContributionDay["level"] {
  if (count === 0) return 0;
  if (count < 2) return 1;
  if (count < 4) return 2;
  if (count < 7) return 3;
  return 4;
}

function buildLast30Days() {
  const today = new Date();
  const dates: string[] = [];

  for (let i = DAYS - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(formatDate(d));
  }

  return dates;
}

async function getContributionDays(username: string): Promise<ContributionDay[]> {
  const dates = buildLast30Days();
  const from = dates[0];
  const to = dates[dates.length - 1];

  const response = await fetch(
    `https://github.com/users/${username}/contributions?from=${from}&to=${to}`,
    {
      headers: {
        "User-Agent": "OpenClaw GitHub Dashboard",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status}`);
  }

  const html = await response.text();
  const matches = html.matchAll(
    /<td[^>]*data-date="([^"]+)"[^>]*><\/td>\s*<tool-tip[^>]*>([^<]+)<\/tool-tip>/g,
  );

  const counts = new Map<string, number>();

  for (const match of matches) {
    const date = match[1];
    const label = match[2];
    const countMatch = label.match(/(\d+) contribution/);
    const count = countMatch ? Number(countMatch[1]) : 0;
    counts.set(date, count);
  }

  return dates.map((date) => {
    const count = counts.get(date) ?? 0;
    return {
      date,
      count,
      level: levelForCount(count),
    };
  });
}

function longestStreak(days: ContributionDay[]) {
  let best = 0;
  let current = 0;

  for (const day of days) {
    if (day.count > 0) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return best;
}

function currentStreak(days: ContributionDay[]) {
  let streak = 0;

  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (days[i].count > 0) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function prettyDay(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function buildCalendarCells(days: ContributionDay[]) {
  const firstDayIndex = new Date(`${days[0].date}T00:00:00`).getDay();
  const lastDayIndex = new Date(`${days[days.length - 1].date}T00:00:00`).getDay();

  const leading = Array.from({ length: firstDayIndex }, () => null as ContributionDay | null);
  const trailing = Array.from({ length: 6 - lastDayIndex }, () => null as ContributionDay | null);

  return [...leading, ...days, ...trailing];
}

function chunkWeeks(cells: Array<ContributionDay | null>) {
  const weeks: Array<Array<ContributionDay | null>> = [];

  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

function buildSparklinePoints(days: ContributionDay[]) {
  const width = 260;
  const height = 72;
  const padding = 6;
  const max = Math.max(...days.map((day) => day.count), 1);

  return days
    .map((day, index) => {
      const x = padding + (index / Math.max(days.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - (day.count / max) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

const levelClasses = [
  "bg-white/[0.06] border-white/5",
  "bg-emerald-900/80 border-emerald-700/30",
  "bg-emerald-700/85 border-emerald-500/40",
  "bg-emerald-500/90 border-emerald-300/40",
  "bg-emerald-300 border-emerald-100/40",
];

export default async function Home() {
  const days = await getContributionDays(USERNAME);
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const activeDays = days.filter((day) => day.count > 0).length;
  const bestDay = days.reduce((best, day) => (day.count > best.count ? day : best), days[0]);
  const calendarCells = buildCalendarCells(days);
  const weeks = chunkWeeks(calendarCells);
  const weeklyTotals = weeks.map((week, index) => ({
    label: `Week ${index + 1}`,
    total: week.reduce((sum, day) => sum + (day?.count ?? 0), 0),
    range: `${prettyDay(week.find((day) => day)?.date ?? days[0].date)} – ${prettyDay(
      [...week].reverse().find((day) => day)?.date ?? days[days.length - 1].date,
    )}`,
  }));
  const sparklinePoints = buildSparklinePoints(days);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(180deg,#07110f_0%,#0a0f1a_45%,#050816_100%)] px-6 py-10 text-zinc-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="border-b border-white/10 bg-gradient-to-r from-emerald-400/12 via-cyan-400/10 to-transparent px-8 py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">GitHub activity</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">{USERNAME}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-300/80 md:text-base">
                  Last {DAYS} days of public contribution activity, styled like a proper heatmap instead of a pile of chunky boxes.
                </p>
              </div>
              <a
                className="inline-flex items-center rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-200/50 hover:bg-emerald-400/20"
                href={`https://github.com/${USERNAME}`}
                target="_blank"
                rel="noreferrer"
              >
                View GitHub profile
              </a>
            </div>
          </div>

          <div className="grid gap-4 px-8 py-6 md:grid-cols-4">
            {[
              { label: "Total contributions", value: total },
              { label: "Active days", value: `${activeDays}/${DAYS}` },
              { label: "Current streak", value: `${currentStreak(days)} days` },
              { label: "Best streak", value: `${longestStreak(days)} days` },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-white/10 bg-black/20 p-5 shadow-inner shadow-white/[0.02]">
                <p className="text-sm text-zinc-400">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{card.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">30-day heatmap</h2>
              <p className="mt-1 text-sm text-zinc-400">Seven-row tiled layout, closer to GitHub’s contribution calendar.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>Less</span>
              {levelClasses.map((levelClass) => (
                <span key={levelClass} className={`h-3.5 w-3.5 rounded-[4px] border ${levelClass}`} />
              ))}
              <span>More</span>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="flex min-w-[720px] gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:min-w-0">
              <div className="grid grid-rows-7 gap-2 pt-1 text-[11px] text-zinc-500">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="flex min-h-5 items-center pr-2">
                    {label}
                  </div>
                ))}
              </div>

              <div
                className="grid flex-1 gap-2"
                style={{
                  gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
                }}
              >
                {weeks.map((week, weekIndex) => (
                  <div key={`week-${weekIndex}`} className="grid gap-2" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}>
                    {week.map((day, dayIndex) => {
                      if (!day) {
                        return <div key={`empty-${weekIndex}-${dayIndex}`} className="aspect-square w-full rounded-[6px] bg-transparent" />;
                      }

                      return (
                        <div
                          key={day.date}
                          className={`aspect-square w-full rounded-[6px] border transition-transform hover:scale-[1.04] ${levelClasses[day.level]}`}
                          title={`${day.count} contributions on ${day.date}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-zinc-400">
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              Best day: <span className="font-medium text-zinc-100">{prettyDay(bestDay.date)}</span> · {bestDay.count}
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              Average/day: <span className="font-medium text-zinc-100">{(total / DAYS).toFixed(1)}</span>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              Activity rate: <span className="font-medium text-zinc-100">{Math.round((activeDays / DAYS) * 100)}%</span>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-5">
            {weeklyTotals.map((week) => (
              <div key={week.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{week.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{week.total}</p>
                <p className="mt-1 text-xs text-zinc-400">{week.range}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-[1.6fr_1fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
            <h2 className="text-xl font-semibold">Daily breakdown</h2>
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-white/[0.04] text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Contributions</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {days
                    .slice()
                    .reverse()
                    .map((day) => (
                      <tr key={day.date} className="bg-black/10 transition hover:bg-white/[0.03]">
                        <td className="px-4 py-3">{day.date}</td>
                        <td className="px-4 py-3 font-medium text-zinc-100">{day.count}</td>
                        <td className="px-4 py-3 text-zinc-400">
                          {day.count === 0 ? "Quiet" : day.count < 4 ? "Active" : "Heavy"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
            <h2 className="text-xl font-semibold">Trend</h2>
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <svg viewBox="0 0 260 72" className="h-[72px] w-full overflow-visible">
                <defs>
                  <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(52, 211, 153, 0.35)" />
                    <stop offset="100%" stopColor="rgba(52, 211, 153, 0)" />
                  </linearGradient>
                </defs>
                <polyline
                  fill="none"
                  stroke="rgba(167, 243, 208, 0.95)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={sparklinePoints}
                />
              </svg>
              <p className="mt-3 text-xs text-zinc-400">Daily contribution trend across the last 30 days.</p>
            </div>

            <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-300">
              <p>
                The profile looks bursty: a few heavy days, then quiet gaps. That usually means focused shipping windows rather than constant low-grade churn.
              </p>
              <p>
                Weekly totals make that pattern easier to read fast; the sparkline shows whether activity is clustering or tapering without making the page busier.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

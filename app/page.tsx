export const dynamic = "force-dynamic";

type ContributionDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

const USERNAME = "brandonperfetti";
const DAYS = 30;

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
  const matches = [
    ...html.matchAll(/<(?:td|rect)[^>]*data-date="([^"]+)"[^>]*data-count="(\d+)"[^>]*>/g),
    ...html.matchAll(/<(?:td|rect)[^>]*data-count="(\d+)"[^>]*data-date="([^"]+)"[^>]*>/g),
  ];

  const counts = new Map<string, number>();

  for (const match of matches) {
    const date = match[1]?.includes("-") ? match[1] : match[2];
    const count = Number(match[1]?.includes("-") ? match[2] : match[1]);

    if (date) {
      counts.set(date, count);
    }
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

const levelClasses = [
  "bg-zinc-200",
  "bg-emerald-200",
  "bg-emerald-400",
  "bg-emerald-500",
  "bg-emerald-700",
];

export default async function Home() {
  const days = await getContributionDays(USERNAME);
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const activeDays = days.filter((day) => day.count > 0).length;
  const bestDay = days.reduce((best, day) => (day.count > best.count ? day : best), days[0]);

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">GitHub activity</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">{USERNAME}</h1>
              <p className="mt-3 max-w-2xl text-sm text-zinc-400 md:text-base">
                Public commit contribution activity for the last {DAYS} days. Data is pulled live from GitHub.
              </p>
            </div>
            <a
              className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-300/60 hover:bg-emerald-400/20"
              href={`https://github.com/${USERNAME}`}
              target="_blank"
              rel="noreferrer"
            >
              View GitHub profile
            </a>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total contributions", value: total },
            { label: "Active days", value: `${activeDays}/${DAYS}` },
            { label: "Current streak", value: `${currentStreak(days)} days` },
            { label: "Best streak", value: `${longestStreak(days)} days` },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-zinc-400">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">30-day heatmap</h2>
              <p className="mt-1 text-sm text-zinc-400">Each square is one day. Darker means more contributions.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>Less</span>
              {levelClasses.map((levelClass) => (
                <span key={levelClass} className={`h-3 w-3 rounded-sm ${levelClass}`} />
              ))}
              <span>More</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
            {days.map((day) => (
              <div key={day.date} className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-black/20 p-3">
                <div
                  className={`h-16 rounded-xl ${levelClasses[day.level]}`}
                  title={`${day.count} contributions on ${day.date}`}
                />
                <div>
                  <p className="text-sm font-medium">{day.count}</p>
                  <p className="text-xs text-zinc-500">{prettyDay(day.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h2 className="text-xl font-semibold">Daily breakdown</h2>
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-white/5 text-zinc-400">
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
                      <tr key={day.date} className="bg-black/10">
                        <td className="px-4 py-3">{day.date}</td>
                        <td className="px-4 py-3">{day.count}</td>
                        <td className="px-4 py-3 text-zinc-400">
                          {day.count === 0 ? "Quiet" : day.count < 4 ? "Active" : "Heavy"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h2 className="text-xl font-semibold">Highlights</h2>
            <dl className="mt-5 space-y-5 text-sm">
              <div>
                <dt className="text-zinc-400">Best day</dt>
                <dd className="mt-1 text-lg font-semibold">
                  {prettyDay(bestDay.date)} <span className="text-zinc-400">· {bestDay.count} contributions</span>
                </dd>
              </div>
              <div>
                <dt className="text-zinc-400">Average per day</dt>
                <dd className="mt-1 text-lg font-semibold">{(total / DAYS).toFixed(1)}</dd>
              </div>
              <div>
                <dt className="text-zinc-400">Activity rate</dt>
                <dd className="mt-1 text-lg font-semibold">{Math.round((activeDays / DAYS) * 100)}%</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </main>
  );
}

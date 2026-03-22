export const USERNAME = "brandonperfetti";
export const DAYS = 30;

export type ContributionDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

export type Repo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  archived: boolean;
  pushed_at: string;
  updated_at: string;
  topics?: string[];
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function levelForCount(count: number): ContributionDay["level"] {
  if (count === 0) return 0;
  if (count < 2) return 1;
  if (count < 4) return 2;
  if (count < 7) return 3;
  return 4;
}

export function buildLast30Days() {
  const today = new Date();
  const dates: string[] = [];

  for (let i = DAYS - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(formatDate(d));
  }

  return dates;
}

export async function getContributionDays(
  username: string = USERNAME,
): Promise<ContributionDay[]> {
  const dates = buildLast30Days();
  const from = dates[0];
  const to = dates[dates.length - 1];

  const response = await fetch(
    `https://github.com/users/${username}/contributions?from=${from}&to=${to}`,
    {
      headers: {
        "User-Agent": "Build Dashboard",
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

export async function getRepos(username: string = USERNAME): Promise<Repo[]> {
  const response = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Build Dashboard",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status}`);
  }

  const repos = (await response.json()) as Repo[];
  return repos.filter((repo) => !repo.archived);
}

export function longestStreak(days: ContributionDay[]) {
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

export function currentStreak(days: ContributionDay[]) {
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

export function prettyDay(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function buildCalendarCells(days: ContributionDay[]) {
  const firstDayIndex = new Date(`${days[0].date}T00:00:00`).getDay();
  const lastDayIndex = new Date(
    `${days[days.length - 1].date}T00:00:00`,
  ).getDay();

  const leading = Array.from(
    { length: firstDayIndex },
    () => null as ContributionDay | null,
  );
  const trailing = Array.from(
    { length: 6 - lastDayIndex },
    () => null as ContributionDay | null,
  );

  return [...leading, ...days, ...trailing];
}

export function chunkWeeks(cells: Array<ContributionDay | null>) {
  const weeks: Array<Array<ContributionDay | null>> = [];

  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

export function buildSparklinePoints(days: ContributionDay[]) {
  const width = 260;
  const height = 72;
  const padding = 6;
  const max = Math.max(...days.map((day) => day.count), 1);

  return days
    .map((day, index) => {
      const x =
        padding +
        (index / Math.max(days.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - (day.count / max) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

export function buildWeeklyTotals(days: ContributionDay[]) {
  const calendarCells = buildCalendarCells(days);
  const weeks = chunkWeeks(calendarCells);

  return weeks.map((week, index) => ({
    label: `Week ${index + 1}`,
    total: week.reduce((sum, day) => sum + (day?.count ?? 0), 0),
    range: `${prettyDay(week.find((day) => day)?.date ?? days[0].date)} – ${prettyDay(
      [...week].reverse().find((day) => day)?.date ??
        days[days.length - 1].date,
    )}`,
  }));
}

export function formatRepoDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

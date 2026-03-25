export const USERNAME = "brandonperfetti";
export const DAYS = 30;
export const GITHUB_REVALIDATE_SECONDS = 300;

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
  private?: boolean;
  owner?: {
    login?: string;
  };
  pushed_at: string;
  updated_at: string;
  topics?: string[];
};

type WeeklyWindow = {
  start: string;
  end: string;
  label: string;
  range: string;
};

export type PullRequestThroughputPoint = {
  label: string;
  range: string;
  opened: number;
  merged: number;
  closed: number;
};

export type PullRequestHealthPoint = PullRequestThroughputPoint & {
  reopened: number;
  mergeRate: number;
  reopenRate: number;
  medianCycleHours: number;
  cycleSampleSize: number;
};

export type ReleaseCadencePoint = {
  label: string;
  monthKey: string;
  releases: number;
};

export type IssueFlowHealthPoint = {
  label: string;
  range: string;
  opened: number;
  closed: number;
  backlogDelta: number;
};

export type RepoRiskBucket = {
  label: string;
  count: number;
};

export type RepoRiskSnapshot = {
  totalRepos: number;
  archivedRepos: number;
  privateRepos: number;
  atRiskRepos: number;
  buckets: RepoRiskBucket[];
};

export type CommitTimingHeatmapCell = {
  dayIndex: number;
  dayLabel: string;
  hour: number;
  hourLabel: string;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
};

export type CommitTimingHeatmapData = {
  timezone: string;
  totalCommits: number;
  maxCellCount: number;
  cells: CommitTimingHeatmapCell[];
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function githubHeaders() {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "Build Dashboard",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function hasGithubToken() {
  return Boolean(process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN);
}

export function isGithubAuthConfigured() {
  return hasGithubToken();
}

function buildMonthWindows(months: number) {
  const now = new Date();
  const windows: Array<{
    label: string;
    monthKey: string;
    start: Date;
    end: Date;
  }> = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0);
    const monthKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    const label = start.toLocaleDateString("en-US", { month: "short" });
    windows.push({ label, monthKey, start, end });
  }

  return windows;
}

function buildWeeklyWindows() {
  const dates = buildLast30Days();
  const windows: WeeklyWindow[] = [];

  for (let index = 0; index < dates.length; index += 7) {
    const start = dates[index];
    const end = dates[Math.min(index + 6, dates.length - 1)];
    windows.push({
      start,
      end,
      label: prettyDay(start),
      range: `${prettyDay(start)} – ${prettyDay(end)}`,
    });
  }

  return windows;
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
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
      next: { revalidate: GITHUB_REVALIDATE_SECONDS },
    },
  );

  if (!response.ok) {
    if (response.status === 403) {
      return dates.map((date) => ({
        date,
        count: 0,
        level: 0,
      }));
    }
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

export async function getRepos(
  username: string = USERNAME,
  options?: { includeArchived?: boolean },
): Promise<Repo[]> {
  const includeArchived = options?.includeArchived ?? false;
  const fetchRepos = async (url: string) => {
    const response = await fetch(url, {
      headers: githubHeaders(),
      next: { revalidate: GITHUB_REVALIDATE_SECONDS, tags: ["github:repos"] },
    });

    return response;
  };

  const publicReposUrl = `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`;

  if (!hasGithubToken()) {
    const response = await fetchRepos(publicReposUrl);
    if (!response.ok) {
      if (response.status === 403) {
        return [];
      }
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const repos = (await response.json()) as Repo[];
    return repos.filter((repo) => includeArchived || !repo.archived);
  }

  const authResponse = await fetchRepos(
    "https://api.github.com/user/repos?per_page=100&sort=updated&visibility=all&affiliation=owner,collaborator,organization_member",
  );

  if (authResponse.ok) {
    const repos = (await authResponse.json()) as Repo[];
    return repos.filter((repo) => {
      if (!includeArchived && repo.archived) return false;
      const ownerLogin = repo.owner?.login;
      return ownerLogin
        ? ownerLogin === username
        : repo.full_name.startsWith(`${username}/`);
    });
  }

  // If an authenticated call fails (expired token/rate issue), fall back to public repos.
  const fallbackResponse = await fetchRepos(publicReposUrl);
  if (!fallbackResponse.ok) {
    if (fallbackResponse.status === 403 || authResponse.status === 403) {
      return [];
    }
    throw new Error(`GitHub API returned ${fallbackResponse.status}`);
  }

  const fallbackRepos = (await fallbackResponse.json()) as Repo[];
  return fallbackRepos.filter((repo) => includeArchived || !repo.archived);
}

export async function getPinnedRepos(
  username: string = USERNAME,
): Promise<Repo[]> {
  const query = `
    query PinnedRepos($login: String!) {
      user(login: $login) {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              id
              name
              nameWithOwner
              description
              url
              homepageUrl
              primaryLanguage { name }
              stargazerCount
              forkCount
              isArchived
              isPrivate
              pushedAt
              updatedAt
              repositoryTopics(first: 12) {
                nodes {
                  topic {
                    name
                  }
                }
              }
              owner {
                login
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      ...githubHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { login: username },
    }),
    next: {
      revalidate: GITHUB_REVALIDATE_SECONDS,
      tags: ["github:repos", "github:pinned"],
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return [];
    }
    throw new Error(`GitHub API returned ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: {
      user?: {
        pinnedItems?: {
          nodes?: Array<{
            id: string;
            name: string;
            nameWithOwner: string;
            description: string | null;
            url: string;
            homepageUrl: string | null;
            primaryLanguage: { name: string } | null;
            stargazerCount: number;
            forkCount: number;
            isArchived: boolean;
            isPrivate: boolean;
            pushedAt: string;
            updatedAt: string;
            repositoryTopics?: {
              nodes?: Array<{ topic?: { name?: string } }>;
            };
            owner?: {
              login?: string;
            };
          }>;
        };
      };
    };
    errors?: Array<{ message?: string }>;
  };

  if (payload.errors?.length) {
    return [];
  }

  const nodes = payload.data?.user?.pinnedItems?.nodes ?? [];
  return nodes
    .filter((node) => node && !node.isArchived)
    .map((node, index) => ({
      id: Number.parseInt(node.id.replace(/\D/g, ""), 10) || -(index + 1),
      name: node.name,
      full_name: node.nameWithOwner,
      description: node.description,
      html_url: node.url,
      homepage: node.homepageUrl,
      language: node.primaryLanguage?.name ?? null,
      stargazers_count: node.stargazerCount,
      forks_count: node.forkCount,
      archived: node.isArchived,
      private: node.isPrivate,
      owner: {
        login: node.owner?.login,
      },
      pushed_at: node.pushedAt,
      updated_at: node.updatedAt,
      topics:
        node.repositoryTopics?.nodes
          ?.map((topicNode) => topicNode.topic?.name)
          .filter((topicName): topicName is string => Boolean(topicName)) ?? [],
    }))
    .filter((repo) => !repo.archived);
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

export function prettyLongDay(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function daysSince(isoDate: string) {
  const fromMs = new Date(isoDate).getTime();
  if (!Number.isFinite(fromMs)) return 0;
  return Math.max(0, Math.floor((Date.now() - fromMs) / 86_400_000));
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

export function buildRepoPushCadence(repos: Repo[]) {
  const windows = buildWeeklyWindows();

  return windows.map(({ start, end, label, range }, index) => {
    const startMs = new Date(`${start}T00:00:00.000Z`).getTime();
    const endMs = new Date(`${end}T23:59:59.999Z`).getTime();
    const value = repos.filter((repo) => {
      const pushedMs = new Date(repo.pushed_at).getTime();
      return pushedMs >= startMs && pushedMs <= endMs;
    }).length;

    return {
      label,
      value,
      range,
      index: index + 1,
    };
  });
}

export async function buildRepoCommitCadence(
  repos: Repo[],
  topRepoLimit: number = 8,
) {
  const summary = await buildRepoCommitActivitySummary(repos, topRepoLimit);
  return summary.weekly;
}

export async function buildRepoCommitActivitySummary(
  repos: Repo[],
  topRepoLimit: number = 8,
) {
  const topRepos = [...repos]
    .sort(
      (a, b) =>
        +new Date(b.pushed_at) - +new Date(a.pushed_at) ||
        b.stargazers_count - a.stargazers_count,
    )
    .slice(0, topRepoLimit);
  const windows = buildWeeklyWindows();
  const buckets = windows.map((window) => ({ ...window, value: 0 }));
  const start = windows[0]?.start;

  if (!start || topRepos.length === 0) {
    return {
      weekly: buckets.map((bucket, index) => ({
        label: bucket.label,
        range: bucket.range,
        value: bucket.value,
        index: index + 1,
      })),
      perRepo: [] as Array<{
        name: string;
        fullName: string;
        commits: number;
        pushedAt: string;
      }>,
    };
  }

  const commitResponses = await Promise.all(
    topRepos.map(async (repo) => {
      const response = await fetch(
        `https://api.github.com/repos/${repo.full_name}/commits?since=${start}T00:00:00Z&per_page=100`,
        {
          headers: githubHeaders(),
          next: { revalidate: GITHUB_REVALIDATE_SECONDS },
        },
      );

      if (!response.ok) {
        return {
          repo,
          commits: [] as Array<{ commit?: { author?: { date?: string } } }>,
        };
      }

      const commits = (await response.json()) as Array<{
        commit?: { author?: { date?: string } };
      }>;

      return { repo, commits };
    }),
  );

  const perRepo = commitResponses
    .map(({ repo, commits }) => ({
      name: repo.name.length > 14 ? `${repo.name.slice(0, 14)}…` : repo.name,
      fullName: repo.full_name,
      commits: commits.length,
      pushedAt: repo.pushed_at,
    }))
    .sort((a, b) => b.commits - a.commits);

  for (const { commits } of commitResponses) {
    for (const commit of commits) {
      const isoDate = commit.commit?.author?.date;
      if (!isoDate) {
        continue;
      }

      const commitMs = new Date(isoDate).getTime();
      const weekIndex = windows.findIndex((window) => {
        const startMs = new Date(`${window.start}T00:00:00.000Z`).getTime();
        const endMs = new Date(`${window.end}T23:59:59.999Z`).getTime();
        return commitMs >= startMs && commitMs <= endMs;
      });

      if (weekIndex !== -1) {
        buckets[weekIndex].value += 1;
      }
    }
  }

  return {
    weekly: buckets.map((bucket, index) => ({
      label: bucket.label,
      range: bucket.range,
      value: bucket.value,
      index: index + 1,
    })),
    perRepo,
  };
}

export async function getCommitTimingHeatmap(
  username: string = USERNAME,
  timezone?: string,
): Promise<CommitTimingHeatmapData> {
  const dates = buildLast30Days();
  const start = dates[0];
  const fallbackTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const resolvedTimezone = (() => {
    if (!timezone) {
      return fallbackTimezone;
    }

    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone });
      return timezone;
    } catch {
      return fallbackTimezone;
    }
  })();

  const repos = await getRepos(username);
  const topRepos = [...repos]
    .sort(
      (a, b) =>
        +new Date(b.pushed_at) - +new Date(a.pushed_at) ||
        b.stargazers_count - a.stargazers_count,
    )
    .slice(0, 10);

  const hourBuckets = Array.from({ length: 7 }, () => Array(24).fill(0));
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const zonedDateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: resolvedTimezone,
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  });

  const commitResponses = await Promise.all(
    topRepos.map(async (repo) => {
      const response = await fetch(
        `https://api.github.com/repos/${repo.full_name}/commits?since=${start}T00:00:00Z&per_page=100`,
        {
          headers: githubHeaders(),
          next: { revalidate: GITHUB_REVALIDATE_SECONDS },
        },
      );

      if (!response.ok) {
        return [] as Array<{ commit?: { author?: { date?: string } } }>;
      }

      return (await response.json()) as Array<{
        commit?: { author?: { date?: string } };
      }>;
    }),
  );

  for (const commits of commitResponses) {
    for (const commit of commits) {
      const isoDate = commit.commit?.author?.date;
      if (!isoDate) continue;

      const parsed = new Date(isoDate);
      const timestamp = parsed.getTime();
      if (!Number.isFinite(timestamp)) continue;

      const zonedParts = zonedDateFormatter.formatToParts(parsed);
      const weekday = zonedParts.find((part) => part.type === "weekday")?.value;
      const hour = Number.parseInt(
        zonedParts.find((part) => part.type === "hour")?.value ?? "",
        10,
      );
      const dayIndex = weekday ? dayLabels.indexOf(weekday) : -1;
      if (dayIndex === -1 || Number.isNaN(hour)) {
        continue;
      }

      hourBuckets[dayIndex][hour] += 1;
    }
  }

  const flatCounts = hourBuckets.flat();
  const maxCellCount = Math.max(...flatCounts, 0);
  const totalCommits = flatCounts.reduce((sum, value) => sum + value, 0);

  const toIntensity = (count: number): CommitTimingHeatmapCell["intensity"] => {
    if (count === 0 || maxCellCount === 0) return 0;
    const ratio = count / maxCellCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  const cells: CommitTimingHeatmapCell[] = [];
  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    for (let hour = 0; hour < 24; hour += 1) {
      const count = hourBuckets[dayIndex][hour];
      cells.push({
        dayIndex,
        dayLabel: dayLabels[dayIndex],
        hour,
        hourLabel: `${hour.toString().padStart(2, "0")}:00`,
        count,
        intensity: toIntensity(count),
      });
    }
  }

  return {
    timezone: resolvedTimezone,
    totalCommits,
    maxCellCount,
    cells,
  };
}

export async function getPullRequestThroughput(
  username: string = USERNAME,
): Promise<PullRequestThroughputPoint[]> {
  const weeklyHealth = await getPullRequestHealth(username);
  return weeklyHealth.map(({ label, range, opened, merged, closed }) => ({
    label,
    range,
    opened,
    merged,
    closed,
  }));
}

export async function getPullRequestHealth(
  username: string = USERNAME,
): Promise<PullRequestHealthPoint[]> {
  const windows = buildWeeklyWindows();
  const windowStartMs = new Date(
    `${windows[0]?.start}T00:00:00.000Z`,
  ).getTime();
  const windowEndMs = new Date(
    `${windows[windows.length - 1]?.end}T23:59:59.999Z`,
  ).getTime();

  const cycleDurationsByWeek = windows.map(() => [] as number[]);

  const weeklyCounts = await Promise.all(
    windows.map(async (window) => {
      const buildQuery = (
        qualifier: "created" | "merged" | "closed" | "reopened",
      ) =>
        encodeURIComponent(
          `is:pr author:${username} ${qualifier}:${window.start}..${window.end}`,
        );

      const fetchCount = async (query: string) => {
        const response = await fetch(
          `https://api.github.com/search/issues?q=${query}&per_page=1`,
          {
            headers: githubHeaders(),
            next: { revalidate: GITHUB_REVALIDATE_SECONDS },
          },
        );

        if (!response.ok) {
          return 0;
        }

        const payload = (await response.json()) as { total_count?: number };
        return payload.total_count ?? 0;
      };

      const [opened, merged, closed, reopened] = await Promise.all([
        fetchCount(buildQuery("created")),
        fetchCount(buildQuery("merged")),
        fetchCount(buildQuery("closed")),
        fetchCount(buildQuery("reopened")),
      ]);

      return {
        label: window.label,
        range: window.range,
        opened,
        merged,
        closed,
        reopened,
      };
    }),
  );

  const repos = await getRepos(username);
  const topRepos = [...repos]
    .sort(
      (a, b) =>
        +new Date(b.pushed_at) - +new Date(a.pushed_at) ||
        b.stargazers_count - a.stargazers_count,
    )
    .slice(0, 8);

  const prResponses = await Promise.all(
    topRepos.map(async (repo) => {
      const response = await fetch(
        `https://api.github.com/repos/${repo.full_name}/pulls?state=closed&sort=updated&direction=desc&per_page=100`,
        {
          headers: githubHeaders(),
          next: { revalidate: GITHUB_REVALIDATE_SECONDS },
        },
      );

      if (!response.ok) {
        return [] as Array<{ created_at?: string; merged_at?: string | null }>;
      }

      const pulls = (await response.json()) as Array<{
        created_at?: string;
        merged_at?: string | null;
      }>;

      return pulls;
    }),
  );

  for (const pulls of prResponses) {
    for (const pr of pulls) {
      if (!pr.created_at || !pr.merged_at) {
        continue;
      }

      const mergedAtMs = new Date(pr.merged_at).getTime();
      if (
        !Number.isFinite(mergedAtMs) ||
        mergedAtMs < windowStartMs ||
        mergedAtMs > windowEndMs
      ) {
        continue;
      }

      const createdAtMs = new Date(pr.created_at).getTime();
      if (!Number.isFinite(createdAtMs)) {
        continue;
      }

      const durationHours = (mergedAtMs - createdAtMs) / 3_600_000;
      if (durationHours < 0) {
        continue;
      }

      const weekIndex = windows.findIndex((window) => {
        const startMs = new Date(`${window.start}T00:00:00.000Z`).getTime();
        const endMs = new Date(`${window.end}T23:59:59.999Z`).getTime();
        return mergedAtMs >= startMs && mergedAtMs <= endMs;
      });

      if (weekIndex !== -1) {
        cycleDurationsByWeek[weekIndex].push(durationHours);
      }
    }
  }

  return weeklyCounts.map((week, index) => {
    const cycleDurations = cycleDurationsByWeek[index];
    const medianCycleHours = median(cycleDurations);
    const mergeRate =
      week.closed > 0
        ? roundToOneDecimal((week.merged / week.closed) * 100)
        : 0;
    const reopenRate =
      week.closed > 0
        ? roundToOneDecimal((week.reopened / week.closed) * 100)
        : 0;

    return {
      ...week,
      mergeRate,
      reopenRate,
      medianCycleHours: roundToOneDecimal(medianCycleHours),
      cycleSampleSize: cycleDurations.length,
    };
  });
}

export async function getIssueFlowHealth(
  username: string = USERNAME,
): Promise<IssueFlowHealthPoint[]> {
  const windows = buildWeeklyWindows();

  const windowCounts = await Promise.all(
    windows.map(async (window) => {
      const buildQuery = (qualifier: "created" | "closed") =>
        encodeURIComponent(
          `is:issue user:${username} ${qualifier}:${window.start}..${window.end}`,
        );

      const fetchCount = async (query: string) => {
        const response = await fetch(
          `https://api.github.com/search/issues?q=${query}&per_page=1`,
          {
            headers: githubHeaders(),
            next: { revalidate: GITHUB_REVALIDATE_SECONDS },
          },
        );

        if (!response.ok) {
          return 0;
        }

        const payload = (await response.json()) as { total_count?: number };
        return payload.total_count ?? 0;
      };

      const [opened, closed] = await Promise.all([
        fetchCount(buildQuery("created")),
        fetchCount(buildQuery("closed")),
      ]);

      return {
        label: window.label,
        range: window.range,
        opened,
        closed,
      };
    }),
  );

  let runningBacklogDelta = 0;
  const weeklyCounts = windowCounts.map((window) => {
    runningBacklogDelta += window.opened - window.closed;
    return {
      ...window,
      backlogDelta: runningBacklogDelta,
    };
  });

  return weeklyCounts;
}

export async function getReleaseCadence(
  username: string = USERNAME,
  months: number = 6,
): Promise<ReleaseCadencePoint[]> {
  const windows = buildMonthWindows(months);
  const counters = new Map(windows.map((window) => [window.monthKey, 0]));
  const earliestStartIso = windows[0]?.start.toISOString();
  if (!earliestStartIso) {
    return [];
  }

  const repos = await getRepos(username);
  const topRepos = [...repos]
    .sort(
      (a, b) =>
        b.stargazers_count - a.stargazers_count ||
        +new Date(b.pushed_at) - +new Date(a.pushed_at),
    )
    .slice(0, 12);

  const releaseResponses = await Promise.all(
    topRepos.map(async (repo) => {
      const response = await fetch(
        `https://api.github.com/repos/${repo.full_name}/releases?per_page=30`,
        {
          headers: githubHeaders(),
          next: { revalidate: GITHUB_REVALIDATE_SECONDS },
        },
      );

      if (!response.ok) {
        return [] as Array<{ published_at?: string | null }>;
      }

      return (await response.json()) as Array<{ published_at?: string | null }>;
    }),
  );

  for (const releases of releaseResponses) {
    for (const release of releases) {
      if (!release.published_at) {
        continue;
      }

      if (release.published_at < earliestStartIso) {
        continue;
      }

      const publishedDate = new Date(release.published_at);
      const monthKey = `${publishedDate.getFullYear()}-${String(
        publishedDate.getMonth() + 1,
      ).padStart(2, "0")}`;

      if (counters.has(monthKey)) {
        counters.set(monthKey, (counters.get(monthKey) ?? 0) + 1);
      }
    }
  }

  return windows.map((window) => ({
    label: window.label,
    monthKey: window.monthKey,
    releases: counters.get(window.monthKey) ?? 0,
  }));
}

export async function getRepoRiskSnapshot(
  username: string = USERNAME,
): Promise<RepoRiskSnapshot> {
  // UI-facing repo counts intentionally exclude archived repos so summary badges
  // and risk totals stay aligned with "active" inventory across the dashboard.
  const repos = await getRepos(username, { includeArchived: true });
  const activeRepos = repos.filter((repo) => !repo.archived);

  const archivedRepos = repos.filter((repo) => repo.archived).length;
  const privateRepos = activeRepos.filter((repo) => repo.private).length;

  const hot = activeRepos.filter(
    (repo) => daysSince(repo.pushed_at) <= 7,
  ).length;
  const active = activeRepos.filter((repo) => {
    const age = daysSince(repo.pushed_at);
    return age >= 8 && age <= 30;
  }).length;
  const stale = activeRepos.filter((repo) => {
    const age = daysSince(repo.pushed_at);
    return age >= 31 && age <= 90;
  }).length;
  const dormant = activeRepos.filter(
    (repo) => daysSince(repo.pushed_at) > 90,
  ).length;

  const buckets: RepoRiskBucket[] = [
    { label: "Hot (0-7d)", count: hot },
    { label: "Active (8-30d)", count: active },
    { label: "Stale (31-90d)", count: stale },
    { label: "Dormant (90d+)", count: dormant },
  ];

  return {
    totalRepos: activeRepos.length,
    archivedRepos,
    privateRepos,
    atRiskRepos: stale + dormant,
    buckets,
  };
}

export function formatRepoDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

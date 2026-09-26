import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildRepoCommitActivitySummary,
  getCommitTimingHeatmap,
  getContributionDays,
  getIssueFlowHealth,
  getPinnedRepos,
  getPullRequestHealth,
  getReleaseCadence,
  getRepoRiskSnapshot,
  getRepos,
} from "@/lib/github";
import {
  contributionsHtml,
  extraRoutes,
  FROZEN_NOW,
  installFetchRouter,
  jsonResponse,
  makeRepo,
  route,
  settle,
  textResponse,
} from "../helpers/github-fixtures";

// The clock is frozen at 2026-09-25 so the weekly windows are
// Aug 27-Sep 2, Sep 3-9, Sep 10-16, Sep 17-23 and Sep 24-25.
// Only Date and setTimeout are faked: the search rate limiter sleeps with
// setTimeout, and nothing else in the module depends on timers.
beforeEach(() => {
  vi.useFakeTimers({
    now: FROZEN_NOW,
    toFake: ["Date", "setTimeout", "clearTimeout"],
  });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getContributionDays", () => {
  it("scrapes the contribution calendar into a zero-filled 30-day series", async () => {
    const { calls } = installFetchRouter([
      route.contributions(
        "octo",
        contributionsHtml({
          "2026-08-27": 8,
          "2026-09-01": 1,
          "2026-09-24": 0,
          "2026-09-25": 3,
        }),
      ),
    ]);

    const days = await getContributionDays("octo");

    expect(calls[0].searchParams.get("from")).toBe("2026-08-27");
    expect(calls[0].searchParams.get("to")).toBe("2026-09-25");
    expect(days).toHaveLength(30);
    expect(days[0]).toEqual({ date: "2026-08-27", count: 8, level: 4 });
    expect(days.at(-1)).toEqual({ date: "2026-09-25", count: 3, level: 2 });
    expect(days.find((day) => day.date === "2026-09-01")).toEqual({
      date: "2026-09-01",
      count: 1,
      level: 1,
    });
    // Days GitHub did not list, and days labelled "No contributions", are 0.
    expect(days.find((day) => day.date === "2026-09-10")?.count).toBe(0);
    expect(days.find((day) => day.date === "2026-09-24")?.count).toBe(0);
  });

  it("degrades to an all-zero series when GitHub rate-limits the page", async () => {
    installFetchRouter([
      {
        match: (url) => url.pathname.endsWith("/contributions"),
        respond: () => textResponse("", 403),
      },
    ]);

    const days = await getContributionDays("octo");

    expect(days).toHaveLength(30);
    expect(days.every((day) => day.count === 0 && day.level === 0)).toBe(true);
  });

  it("throws on any other upstream failure", async () => {
    installFetchRouter([
      {
        match: (url) => url.pathname.endsWith("/contributions"),
        respond: () => textResponse("", 500),
      },
    ]);

    await expect(getContributionDays("octo")).rejects.toThrow(/500/);
  });
});

describe("getRepos", () => {
  it("uses the authenticated endpoint and keeps only the user's active repos", async () => {
    const { calls } = installFetchRouter([
      route.authedRepos([
        makeRepo({ name: "mine" }),
        makeRepo({ name: "mine-archived", archived: true }),
        makeRepo({ name: "theirs", owner: { login: "someone-else" } }),
        {
          ...makeRepo({ name: "legacy-shape" }),
          owner: undefined,
          full_name: "octo/legacy-shape",
        },
      ]),
    ]);

    const repos = await getRepos("octo");

    expect(calls[0].pathname).toBe("/user/repos");
    expect(calls[0].searchParams.get("visibility")).toBe("all");
    expect(repos.map((repo) => repo.name)).toEqual(["mine", "legacy-shape"]);
  });

  it("follows Link rel=next pagination", async () => {
    installFetchRouter([
      {
        match: (url) => url.pathname === "/user/repos",
        respond: (url) =>
          url.searchParams.get("page") === "2"
            ? jsonResponse([makeRepo({ name: "page-two" })])
            : jsonResponse([makeRepo({ name: "page-one" })], {
                headers: {
                  link: '<https://api.github.com/user/repos?per_page=100&page=2>; rel="next", <https://api.github.com/user/repos?per_page=100&page=2>; rel="last"',
                },
              }),
      },
    ]);

    const repos = await getRepos("octo");

    expect(repos.map((repo) => repo.name)).toEqual(["page-one", "page-two"]);
  });

  it("falls back to the public listing when the token is rejected", async () => {
    const { calls } = installFetchRouter([
      {
        match: (url) => url.pathname === "/user/repos",
        respond: () =>
          jsonResponse({ message: "Bad credentials" }, { status: 401 }),
      },
      route.publicRepos("octo", [
        makeRepo({ name: "public" }),
        makeRepo({ name: "public-archived", archived: true }),
      ]),
    ]);

    const repos = await getRepos("octo");

    expect(calls.map((url) => url.pathname)).toEqual([
      "/user/repos",
      "/users/octo/repos",
    ]);
    expect(repos.map((repo) => repo.name)).toEqual(["public"]);
  });

  it("returns an empty list when both endpoints are rate-limited", async () => {
    installFetchRouter([
      {
        match: (url) => url.pathname.endsWith("/repos"),
        respond: () =>
          jsonResponse({ message: "rate limited" }, { status: 403 }),
      },
    ]);

    await expect(getRepos("octo")).resolves.toEqual([]);
  });

  it("goes straight to the public listing without a token", async () => {
    vi.stubEnv("GITHUB_TOKEN", "");
    const { calls } = installFetchRouter([
      route.publicRepos("octo", [makeRepo({ name: "public" })]),
    ]);

    const repos = await getRepos("octo");

    expect(calls.map((url) => url.pathname)).toEqual(["/users/octo/repos"]);
    expect(repos.map((repo) => repo.name)).toEqual(["public"]);
  });
});

describe("getPinnedRepos", () => {
  const pinnedNode = {
    id: "R_1",
    databaseId: 11,
    name: "alpha",
    nameWithOwner: "octo/alpha",
    description: "First project",
    url: "https://github.com/octo/alpha",
    homepageUrl: "https://alpha.example.com",
    primaryLanguage: { name: "TypeScript" },
    stargazerCount: 5,
    forkCount: 1,
    isArchived: false,
    isPrivate: false,
    pushedAt: "2026-09-20T10:00:00Z",
    updatedAt: "2026-09-21T10:00:00Z",
    repositoryTopics: { nodes: [{ topic: { name: "nextjs" } }, { topic: {} }] },
    owner: { login: "octo" },
  };

  it("maps GraphQL pinned items onto the REST repo shape", async () => {
    installFetchRouter([
      route.pinned([
        pinnedNode,
        { ...pinnedNode, databaseId: 12, name: "old", isArchived: true },
        { ...pinnedNode, databaseId: null, name: "no-id" },
      ]),
    ]);

    const repos = await getPinnedRepos("octo");

    expect(repos).toHaveLength(1);
    expect(repos[0]).toMatchObject({
      id: 11,
      name: "alpha",
      full_name: "octo/alpha",
      html_url: "https://github.com/octo/alpha",
      homepage: "https://alpha.example.com",
      language: "TypeScript",
      stargazers_count: 5,
      forks_count: 1,
      archived: false,
      private: false,
      pushed_at: "2026-09-20T10:00:00Z",
      updated_at: "2026-09-21T10:00:00Z",
      topics: ["nextjs"],
    });
  });

  it("throws when GraphQL reports errors", async () => {
    installFetchRouter([
      {
        match: (url) => url.pathname === "/graphql",
        respond: () => jsonResponse({ errors: [{ message: "nope" }] }),
      },
    ]);

    await expect(getPinnedRepos("octo")).rejects.toThrow(/GraphQL/);
  });

  it("refuses to run without a token instead of returning nothing", async () => {
    vi.stubEnv("GITHUB_TOKEN", "");
    installFetchRouter([]);

    await expect(getPinnedRepos("octo")).rejects.toThrow(/authentication/i);
  });
});

describe("buildRepoCommitActivitySummary", () => {
  it("fetches commits only for the top repos, buckets them by week and ranks repos", async () => {
    const hot = makeRepo({
      name: "a-very-long-repository-name",
      pushed_at: "2026-09-24T10:00:00Z",
    });
    const warm = makeRepo({ name: "warm", pushed_at: "2026-09-10T10:00:00Z" });
    const cold = makeRepo({ name: "cold", pushed_at: "2026-08-01T10:00:00Z" });
    const pinnedOld = makeRepo({
      name: "pinned-old",
      pushed_at: "2026-07-01T10:00:00Z",
    });
    const { calls } = installFetchRouter([
      route.commits({
        [hot.full_name]: [
          "2026-09-24T09:00:00Z",
          "2026-09-04T09:00:00Z",
          "2026-08-01T00:00:00Z",
        ],
        [pinnedOld.full_name]: ["2026-09-25T01:00:00Z"],
      }),
    ]);

    const summary = await buildRepoCommitActivitySummary(
      [cold, warm, hot, pinnedOld],
      2,
      { forceIncludeFullNames: [pinnedOld.full_name] },
    );

    expect(
      calls.map((url) => url.pathname.replace(/^\/repos\//, "")).sort(),
    ).toEqual([`${hot.full_name}/commits`, `${pinnedOld.full_name}/commits`]);
    expect(calls[0].searchParams.get("since")).toBe("2026-08-27T00:00:00Z");
    expect(summary.weekly.map((week) => week.value)).toEqual([0, 1, 0, 0, 2]);
    expect(summary.weekly.map((week) => week.index)).toEqual([1, 2, 3, 4, 5]);
    expect(summary.perRepo).toEqual([
      {
        name: "a-very-long-re…",
        fullName: hot.full_name,
        commits: 2,
        pushedAt: hot.pushed_at,
      },
      {
        name: "pinned-old",
        fullName: pinnedOld.full_name,
        commits: 1,
        pushedAt: pinnedOld.pushed_at,
      },
    ]);
  });

  it("returns empty weekly buckets without calling GitHub when there are no repos", async () => {
    const { fetchMock } = installFetchRouter([]);

    const summary = await buildRepoCommitActivitySummary([], 8);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(summary.weekly.map((week) => week.value)).toEqual([0, 0, 0, 0, 0]);
    expect(summary.perRepo).toEqual([]);
  });
});

describe("getCommitTimingHeatmap", () => {
  it("buckets commits by weekday and hour in the requested timezone", async () => {
    installFetchRouter([
      route.authedRepos([
        makeRepo({ name: "heat", owner: { login: "octo-heat" } }),
      ]),
      route.commits(
        {
          "octo-heat/heat": [
            "2026-09-21T03:30:00Z", // Mon 03:30 UTC = Sun 20:30 in Los Angeles
            "2026-09-21T03:45:00Z",
            "2026-09-22T15:00:00Z", // Tue 15:00 UTC = Tue 08:00 in Los Angeles
            "not-a-date",
          ],
        },
        { requireAuthor: "octo-heat" },
      ),
    ]);

    const heatmap = await getCommitTimingHeatmap(
      "America/Los_Angeles",
      "octo-heat",
    );

    expect(heatmap.timezone).toBe("America/Los_Angeles");
    expect(heatmap.totalCommits).toBe(3);
    expect(heatmap.maxCellCount).toBe(2);
    expect(heatmap.cells).toHaveLength(7 * 24);
    const sundayEvening = heatmap.cells.find(
      (cell) => cell.dayIndex === 0 && cell.hour === 20,
    );
    expect(sundayEvening).toMatchObject({
      dayLabel: "Sun",
      hourLabel: "20:00",
      count: 2,
      intensity: 4,
    });
    expect(
      heatmap.cells.find((cell) => cell.dayIndex === 2 && cell.hour === 8),
    ).toMatchObject({ dayLabel: "Tue", count: 1, intensity: 2 });
    expect(heatmap.cells.filter((cell) => cell.count > 0)).toHaveLength(2);
  });

  it("falls back to UTC for an unknown timezone", async () => {
    installFetchRouter([
      route.authedRepos([
        makeRepo({ name: "heat", owner: { login: "octo-heat-2" } }),
      ]),
      route.commits(
        { "octo-heat-2/heat": ["2026-09-21T03:30:00Z"] },
        { requireAuthor: "octo-heat-2" },
      ),
    ]);

    const heatmap = await getCommitTimingHeatmap("Not/AZone", "octo-heat-2");

    expect(heatmap.timezone).toBe("UTC");
    expect(
      heatmap.cells.find((cell) => cell.dayIndex === 1 && cell.hour === 3),
    ).toMatchObject({ dayLabel: "Mon", count: 1, intensity: 4 });
  });
});

describe("getRepoRiskSnapshot", () => {
  it("assigns active repos to freshness buckets and excludes archived ones", async () => {
    const owner = { login: "octo-risk" };
    installFetchRouter([
      route.authedRepos([
        makeRepo({ name: "hot", owner, pushed_at: "2026-09-22T10:00:00Z" }),
        makeRepo({
          name: "hot-private",
          owner,
          private: true,
          pushed_at: "2026-09-25T10:00:00Z",
        }),
        makeRepo({ name: "active", owner, pushed_at: "2026-09-10T10:00:00Z" }),
        makeRepo({ name: "stale", owner, pushed_at: "2026-08-01T10:00:00Z" }),
        makeRepo({ name: "dormant", owner, pushed_at: "2026-01-01T10:00:00Z" }),
        makeRepo({
          name: "archived",
          owner,
          archived: true,
          pushed_at: "2026-09-24T10:00:00Z",
        }),
      ]),
    ]);

    const snapshot = await getRepoRiskSnapshot("octo-risk");

    expect(snapshot).toEqual({
      totalRepos: 5,
      archivedRepos: 1,
      privateRepos: 1,
      atRiskRepos: 2,
      buckets: [
        { label: "Hot (0-7d)", count: 2 },
        { label: "Active (8-30d)", count: 1 },
        { label: "Stale (31-89d)", count: 1 },
        { label: "Dormant (90d+)", count: 1 },
      ],
    });
  });
});

describe("getReleaseCadence", () => {
  it("counts published releases per calendar month across the window", async () => {
    installFetchRouter([
      route.authedRepos([
        makeRepo({ name: "lib", owner: { login: "octo-rel" } }),
      ]),
      extraRoutes.releases({
        "octo-rel/lib": [
          { published_at: "2026-09-20T00:00:00Z" },
          { published_at: "2026-09-02T00:00:00Z" },
          { published_at: "2026-07-15T00:00:00Z" },
          { published_at: null }, // draft
          { published_at: "2025-12-01T00:00:00Z" }, // before the window
        ],
      }),
    ]);

    const cadence = await getReleaseCadence("octo-rel", 6);

    expect(cadence.map((point) => point.label)).toEqual([
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
    ]);
    expect(cadence.map((point) => point.monthKey)).toEqual([
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
    ]);
    expect(cadence.map((point) => point.releases)).toEqual([0, 0, 0, 1, 0, 2]);
  });
});

describe("getPullRequestHealth", () => {
  it("derives weekly merge rate and median cycle time from the user's merged PRs", async () => {
    installFetchRouter([
      route.searchCount((query) => {
        if (query.includes("merged:")) return 3;
        return 4; // created and closed
      }),
      route.authedRepos([
        makeRepo({ name: "repo-x", owner: { login: "octo-pr" } }),
      ]),
      extraRoutes.pulls({
        "octo-pr/repo-x": [
          {
            created_at: "2026-09-10T00:00:00Z",
            updated_at: "2026-09-11T00:00:00Z",
            merged_at: "2026-09-11T00:00:00Z", // 24h, third week
            user: { login: "Octo-PR" }, // login case must not matter
          },
          {
            created_at: "2026-09-12T00:00:00Z",
            updated_at: "2026-09-12T06:00:00Z",
            merged_at: "2026-09-12T06:00:00Z", // 6h, third week
            user: { login: "octo-pr" },
          },
          {
            created_at: "2026-09-12T00:00:00Z",
            updated_at: "2026-09-12T01:00:00Z",
            merged_at: "2026-09-12T01:00:00Z",
            user: { login: "someone-else" }, // not the author we measure
          },
          {
            created_at: "2026-09-13T00:00:00Z",
            updated_at: "2026-09-13T00:00:00Z",
            merged_at: null, // closed without merging
            user: { login: "octo-pr" },
          },
          {
            created_at: "2026-06-30T00:00:00Z",
            updated_at: "2026-07-01T00:00:00Z",
            merged_at: "2026-07-01T00:00:00Z", // before the window
            user: { login: "octo-pr" },
          },
        ],
      }),
    ]);

    const weeks = await settle(getPullRequestHealth("octo-pr"));

    expect(weeks).toHaveLength(5);
    expect(weeks[2]).toEqual({
      label: "Sep 10",
      range: "Sep 10 – Sep 16",
      opened: 4,
      merged: 3,
      closed: 4,
      reopened: 0,
      mergeRate: 75,
      reopenRate: 0,
      medianCycleHours: 15,
      cycleSampleSize: 2,
    });
    for (const index of [0, 1, 3, 4]) {
      expect(weeks[index]).toMatchObject({
        medianCycleHours: 0,
        cycleSampleSize: 0,
        mergeRate: 75,
      });
    }
  });
});

describe("getIssueFlowHealth", () => {
  it("accumulates the net backlog delta week over week", async () => {
    installFetchRouter([
      route.searchCount((query) => (query.includes("closed:") ? 1 : 3)),
    ]);

    const weeks = await settle(getIssueFlowHealth("octo-issues"));

    expect(weeks.map((week) => week.label)).toEqual([
      "Aug 27",
      "Sep 3",
      "Sep 10",
      "Sep 17",
      "Sep 24",
    ]);
    expect(weeks.map((week) => [week.opened, week.closed])).toEqual(
      Array(5).fill([3, 1]),
    );
    expect(weeks.map((week) => week.backlogDelta)).toEqual([2, 4, 6, 8, 10]);
  });
});

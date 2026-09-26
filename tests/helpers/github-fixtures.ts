import { vi } from "vitest";
import type { ContributionDay, Repo } from "@/lib/github";

export const FROZEN_NOW = new Date("2026-09-25T12:00:00.000Z");

let nextRepoId = 1;

export function makeRepo(overrides: Partial<Repo> = {}): Repo {
  const id = overrides.id ?? nextRepoId++;
  const name = overrides.name ?? `repo-${id}`;
  const owner = overrides.owner?.login ?? "octo";
  return {
    id,
    name,
    full_name: `${owner}/${name}`,
    description: null,
    html_url: `https://github.com/${owner}/${name}`,
    homepage: null,
    language: "TypeScript",
    stargazers_count: 0,
    forks_count: 0,
    archived: false,
    private: false,
    owner: { login: owner },
    pushed_at: "2026-09-20T10:00:00Z",
    updated_at: "2026-09-20T10:00:00Z",
    topics: [],
    ...overrides,
  };
}

export function makeDays(
  counts: number[],
  startDate = "2026-09-01",
): ContributionDay[] {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  return counts.map((count, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return {
      date: date.toISOString().slice(0, 10),
      count,
      level:
        count === 0 ? 0 : count < 2 ? 1 : count < 4 ? 2 : count < 7 ? 3 : 4,
    };
  });
}

/**
 * Builds the fragment of GitHub's contributions HTML that getContributionDays
 * scrapes: a `<td data-date>` cell followed by a `<tool-tip>` label.
 */
export function contributionsHtml(cells: Record<string, number>) {
  const rows = Object.entries(cells).map(([date, count]) => {
    const label =
      count === 0
        ? `No contributions on ${date}`
        : `${count} contribution${count === 1 ? "" : "s"} on ${date}`;
    return `<td tabindex="0" data-date="${date}" id="c-${date}" class="ContributionCalendar-day"></td>\n<tool-tip for="c-${date}">${label}</tool-tip>`;
  });
  return `<table><tbody><tr>${rows.join("\n")}</tr></tbody></table>`;
}

export function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json", ...init.headers },
  });
}

export function textResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html" },
  });
}

export type FetchRoute = {
  match: (url: URL) => boolean;
  respond: (url: URL, init?: RequestInit) => Response | Promise<Response>;
};

/**
 * Replaces global fetch with a URL router. Any request that no route matches
 * throws, so a test cannot quietly reach the real GitHub API or fall through to
 * a fallback branch it did not mean to exercise.
 */
export function installFetchRouter(routes: FetchRoute[]) {
  const calls: URL[] = [];
  const fetchMock = vi.fn(
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url,
      );
      calls.push(url);
      const route = routes.find((candidate) => candidate.match(url));
      if (!route) {
        throw new Error(`Unrouted fetch in test: ${url.href}`);
      }
      return route.respond(url, init);
    },
  );
  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock };
}

export const route = {
  contributions: (username: string, html: string): FetchRoute => ({
    match: (url) =>
      url.hostname === "github.com" &&
      url.pathname === `/users/${username}/contributions`,
    respond: () => textResponse(html),
  }),
  authedRepos: (repos: Repo[]): FetchRoute => ({
    match: (url) =>
      url.hostname === "api.github.com" && url.pathname === "/user/repos",
    respond: () => jsonResponse(repos),
  }),
  publicRepos: (username: string, repos: Repo[]): FetchRoute => ({
    match: (url) =>
      url.hostname === "api.github.com" &&
      url.pathname === `/users/${username}/repos`,
    respond: () => jsonResponse(repos),
  }),
  pinned: (nodes: unknown[]): FetchRoute => ({
    match: (url) => url.pathname === "/graphql",
    respond: () => jsonResponse({ data: { user: { pinnedItems: { nodes } } } }),
  }),
  commits: (
    byFullName: Record<string, string[]>,
    options: { requireAuthor?: string } = {},
  ): FetchRoute => ({
    match: (url) => /^\/repos\/[^/]+\/[^/]+\/commits$/.test(url.pathname),
    respond: (url) => {
      if (
        options.requireAuthor &&
        url.searchParams.get("author") !== options.requireAuthor
      ) {
        return jsonResponse([]);
      }
      const fullName = url.pathname
        .replace(/^\/repos\//, "")
        .replace(/\/commits$/, "");
      // The real endpoint only returns commits at or after `since`.
      const since = url.searchParams.get("since");
      const dates = (byFullName[fullName] ?? []).filter(
        (date) => !since || date >= since,
      );
      return jsonResponse(
        dates.map((date) => ({ commit: { author: { date } } })),
      );
    },
  }),
  searchCount: (countFor: (query: string) => number): FetchRoute => ({
    match: (url) => url.pathname === "/search/issues",
    respond: (url) =>
      jsonResponse({ total_count: countFor(url.searchParams.get("q") ?? "") }),
  }),
};

export const extraRoutes = {
  pulls: (
    byFullName: Record<
      string,
      Array<{
        created_at: string;
        updated_at: string;
        merged_at: string | null;
        user: { login: string };
      }>
    >,
  ): FetchRoute => ({
    match: (url) => /^\/repos\/[^/]+\/[^/]+\/pulls$/.test(url.pathname),
    respond: (url) => {
      const fullName = url.pathname
        .replace(/^\/repos\//, "")
        .replace(/\/pulls$/, "");
      return jsonResponse(byFullName[fullName] ?? []);
    },
  }),
  releases: (
    byFullName: Record<string, Array<{ published_at: string | null }>>,
  ): FetchRoute => ({
    match: (url) => /^\/repos\/[^/]+\/[^/]+\/releases$/.test(url.pathname),
    respond: (url) => {
      const fullName = url.pathname
        .replace(/^\/repos\//, "")
        .replace(/\/releases$/, "");
      return jsonResponse(byFullName[fullName] ?? []);
    },
  }),
};

/**
 * Drives a promise to completion under fake timers by advancing the clock in
 * steps. lib/github.ts spaces GitHub Search calls out with setTimeout, so a
 * test that awaited the promise directly would hang.
 */
export async function settle<T>(
  promise: Promise<T>,
  stepMs = 500,
  maxSteps = 400,
): Promise<T> {
  type Outcome = { ok: true; value: T } | { ok: false; error: unknown };
  // Held in an object because the assignment happens inside a callback,
  // which TypeScript's control-flow narrowing cannot see.
  const box: { outcome: Outcome | null } = { outcome: null };
  const tracked = promise.then(
    (value) => {
      box.outcome = { ok: true, value };
    },
    (error: unknown) => {
      box.outcome = { ok: false, error };
    },
  );
  for (let step = 0; step < maxSteps && box.outcome === null; step += 1) {
    await vi.advanceTimersByTimeAsync(stepMs);
  }
  await tracked;
  if (box.outcome === null) {
    throw new Error(`Promise did not settle within ${maxSteps * stepMs}ms`);
  }
  if (box.outcome.ok) {
    return box.outcome.value;
  }
  throw box.outcome.error;
}

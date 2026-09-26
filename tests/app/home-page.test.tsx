import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/app/components/providers";
import { USERNAME } from "@/lib/github";
import {
  contributionsHtml,
  FROZEN_NOW,
  installFetchRouter,
  jsonResponse,
  makeRepo,
  route,
} from "../helpers/github-fixtures";

// The home route is an async server component. Awaiting it yields the element
// tree it would hand to React, and rendering that tree to static markup is the
// same path the production server takes, minus streaming. The theme provider
// wraps it because the charts read the theme context.
async function renderHome() {
  const { default: Home } = await import("@/app/page");
  const tree = await Home();
  return renderToStaticMarkup(<Providers>{tree}</Providers>);
}

beforeEach(() => {
  vi.useFakeTimers({ now: FROZEN_NOW, toFake: ["Date"] });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("home page", () => {
  it("renders the dashboard from stubbed GitHub responses", async () => {
    const alpha = makeRepo({
      name: "alpha",
      owner: { login: USERNAME },
      description: "Pinned project",
      language: "TypeScript",
      stargazers_count: 10,
      pushed_at: "2026-09-24T10:00:00Z",
    });
    const beta = makeRepo({
      name: "beta",
      owner: { login: USERNAME },
      language: "TypeScript",
      stargazers_count: 2,
      pushed_at: "2026-09-10T10:00:00Z",
    });
    const gamma = makeRepo({
      name: "gamma",
      owner: { login: USERNAME },
      language: "Go",
      pushed_at: "2026-08-30T10:00:00Z",
    });
    const { calls } = installFetchRouter([
      route.contributions(
        USERNAME,
        contributionsHtml({
          "2026-09-20": 3,
          "2026-09-24": 4,
          "2026-09-25": 5,
        }),
      ),
      route.authedRepos([
        alpha,
        beta,
        gamma,
        makeRepo({ name: "old", owner: { login: USERNAME }, archived: true }),
      ]),
      route.pinned([
        {
          databaseId: alpha.id,
          name: alpha.name,
          nameWithOwner: alpha.full_name,
          description: alpha.description,
          url: alpha.html_url,
          homepageUrl: null,
          primaryLanguage: { name: "TypeScript" },
          stargazerCount: alpha.stargazers_count,
          forkCount: 0,
          isArchived: false,
          isPrivate: false,
          pushedAt: alpha.pushed_at,
          updatedAt: alpha.updated_at,
          owner: { login: USERNAME },
        },
      ]),
      route.commits({
        [alpha.full_name]: ["2026-09-24T09:00:00Z", "2026-09-20T09:00:00Z"],
      }),
    ]);

    const html = await renderHome();

    // Quick snapshot card
    expect(html).toContain("12 contributions in 30 days");
    expect(html).toContain("Repos tracked");
    expect(html).toMatch(/Repos tracked<\/div><div[^>]*>3</);
    expect(html).toMatch(/Languages<\/div><div[^>]*>2</);
    // Signal preview
    expect(html).toContain("Strongest day (Sep 25)");
    expect(html).toContain("3/30");
    // Featured work: pinned repo first with its badge, star-ranked fill after
    expect(html).toContain(`href="${alpha.html_url}"`);
    expect(html).toContain("Pinned");
    expect(html.indexOf(">alpha<")).toBeLessThan(html.indexOf(">beta<"));
    expect(html.indexOf(">beta<")).toBeLessThan(html.indexOf(">gamma<"));
    expect(html).not.toContain(">old<");
    // Recent shipping: 30-day commit totals per repo
    expect(html).toContain("2 commits");
    expect(html).toContain("Updated Sep 24, 2026");
    // Commit totals were requested only for the repos on the page
    expect(
      calls.filter((url) => url.pathname.endsWith("/commits")).length,
    ).toBe(3);
  });

  it("still renders when every GitHub request fails", async () => {
    installFetchRouter([
      {
        match: () => true,
        respond: () => jsonResponse({ message: "boom" }, { status: 500 }),
      },
    ]);

    const html = await renderHome();

    expect(html).toContain("0 contributions in 30 days");
    expect(html).toContain("Strongest day: No contributions yet");
    expect(html).toContain("No contribution data available.");
    expect(html).toMatch(/Repos tracked<\/div><div[^>]*>0</);
  });
});

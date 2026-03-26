import { Badge } from "@/app/components/ui/badge";
import { ButtonLink } from "@/app/components/ui/button";
import type { Metadata } from "next";
import { FeaturedScoreBreakdownChart } from "@/app/components/charts/featured-score-breakdown-chart";
import { ReleaseCadenceChart } from "@/app/components/charts/release-cadence-chart";
import { AnimatedHeadline } from "@/app/components/motion/animated-headline";
import { ScrollReveal } from "@/app/components/motion/scroll-reveal";
import { Card } from "@/app/components/ui/card";
import { SectionShell } from "@/app/components/section-shell";
import {
  buildLast30Days,
  buildRepoCommitActivitySummary,
  formatRepoDate,
  getContributionDays,
  getPinnedRepos,
  getRepos,
  getReleaseCadence,
  type ContributionDay,
  type ReleaseCadencePoint,
  type Repo,
} from "@/lib/github";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");
const featuredPath = "/featured";
const featuredUrl = `${siteUrl}${featuredPath}`;
const featuredDescription =
  "Pinned priorities and standout repositories ranked by relevance, with release cadence and shipping context.";

export const metadata: Metadata = {
  title: "Featured",
  description: featuredDescription,
  alternates: {
    canonical: featuredPath,
  },
  openGraph: {
    title: "Featured · Build",
    description: featuredDescription,
    url: featuredUrl,
    type: "website",
    images: [
      {
        url: `${siteUrl}/globe.svg`,
        alt: "Build featured project overview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Featured · Build",
    description: featuredDescription,
    images: [`${siteUrl}/globe.svg`],
  },
};

export const revalidate = 300;

export default async function FeaturedPage() {
  const reportRejected = (label: string, reason: unknown) => {
    console.error(`[featured/page] Failed to load ${label}:`, reason);
  };

  const [daysResult, reposResult, pinnedReposResult, releaseCadenceResult] =
    await Promise.allSettled([
      getContributionDays(),
      getRepos(),
      getPinnedRepos(),
      getReleaseCadence(),
    ]);

  const days: ContributionDay[] =
    daysResult.status === "fulfilled" ? daysResult.value : [];
  if (daysResult.status === "rejected") {
    reportRejected("contribution days", daysResult.reason);
  }

  const repos: Repo[] =
    reposResult.status === "fulfilled" ? reposResult.value : [];
  if (reposResult.status === "rejected") {
    reportRejected("repositories", reposResult.reason);
  }

  const pinnedRepos: Repo[] =
    pinnedReposResult.status === "fulfilled" ? pinnedReposResult.value : [];
  if (pinnedReposResult.status === "rejected") {
    reportRejected("pinned repositories", pinnedReposResult.reason);
  }

  const releaseCadence: ReleaseCadencePoint[] =
    releaseCadenceResult.status === "fulfilled"
      ? releaseCadenceResult.value
      : [];
  if (releaseCadenceResult.status === "rejected") {
    reportRejected("release cadence", releaseCadenceResult.reason);
  }

  const starredRepos = [...repos].sort(
    (a, b) =>
      b.stargazers_count - a.stargazers_count ||
      +new Date(b.pushed_at) - +new Date(a.pushed_at),
  );
  const pinnedIds = new Set(pinnedRepos.map((repo) => repo.id));
  const featured = [
    ...pinnedRepos,
    ...starredRepos.filter((repo) => !pinnedIds.has(repo.id)),
  ].slice(0, 6);
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const activeDays = days.filter((day) => day.count > 0).length;
  const pushedAtTimes = featured
    .flatMap((repo) => [
      new Date(repo.pushed_at).getTime(),
      new Date(repo.updated_at).getTime(),
    ])
    .filter(Number.isFinite);
  const latestWindowDay = buildLast30Days().at(-1);
  const todayReferenceTime = latestWindowDay
    ? new Date(`${latestWindowDay}T00:00:00`).getTime()
    : 0;
  const fallbackReferenceTime =
    pushedAtTimes.length > 0 ? Math.max(...pushedAtTimes) : todayReferenceTime;
  const referenceTime = days.length
    ? new Date(`${days[days.length - 1].date}T00:00:00`).getTime()
    : fallbackReferenceTime;
  const commitSummary = await (async () => {
    try {
      return await buildRepoCommitActivitySummary(featured, featured.length);
    } catch (error) {
      reportRejected("repo commit activity summary", error);
      return {
        weekly: [],
        perRepo: [],
      };
    }
  })();
  const commitsByRepo = new Map(
    commitSummary.perRepo.map((repo) => [repo.fullName, repo.commits]),
  );
  const maxStars = Math.max(
    1,
    ...featured.map((repo) => repo.stargazers_count),
  );
  const maxCommits = Math.max(
    1,
    ...commitSummary.perRepo.map((repo) => repo.commits),
  );
  const featuredScoreData = featured.map((repo) => {
    const isPinned = pinnedIds.has(repo.id);
    const commits30d = commitsByRepo.get(repo.full_name) ?? 0;
    const daysSincePush = Math.max(
      0,
      Math.round(
        (referenceTime - new Date(repo.pushed_at).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
    const starsScore = Math.round((repo.stargazers_count / maxStars) * 35);
    const recencyScore = Math.round(Math.max(0, (1 - daysSincePush / 60) * 35));
    const commitScore = Math.round((commits30d / maxCommits) * 20);
    const pinnedBoost = isPinned ? 10 : 0;
    const relevanceScore = Math.max(
      0,
      Math.min(100, pinnedBoost + starsScore + recencyScore + commitScore),
    );

    return {
      name: repo.name.length > 14 ? `${repo.name.slice(0, 14)}…` : repo.name,
      fullName: repo.full_name,
      stars: repo.stargazers_count,
      commits30d,
      daysSincePush,
      pinned: isPinned,
      sourceLabel: isPinned ? ("Pinned" as const) : ("Star-ranked" as const),
      pinnedBoost,
      starsScore,
      recencyScore,
      commitScore,
      relevanceScore,
    };
  });
  const relevanceByRepo = new Map(
    featuredScoreData.map((point) => [point.fullName, point.relevanceScore]),
  );

  return (
    <div className="flex flex-col gap-6">
      <SectionShell>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] text-emerald-500/80 uppercase">
              Featured
            </p>
            <AnimatedHeadline
              text="Projects to lead with"
              variant="line"
              className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
            />
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
              Priority projects come first, with standout repos layered in by
              recent momentum and long-term signal.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{total} contributions (30d)</Badge>
            <Badge>{activeDays} active days (30d)</Badge>
          </div>
        </div>
      </SectionShell>

      <SectionShell>
        <ScrollReveal y={12}>
          <h2 className="text-xl font-semibold">Featured relevance</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Composite score from pinned priority, stars, recency, and 30-day
            commit activity.
          </p>
          <div className="mt-5">
            <FeaturedScoreBreakdownChart data={featuredScoreData} />
          </div>
        </ScrollReveal>
      </SectionShell>

      <SectionShell>
        <ScrollReveal y={12}>
          <h2 className="text-xl font-semibold">Release cadence</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Monthly release rhythm across top featured repositories.
          </p>
          <div className="mt-5">
            <ReleaseCadenceChart data={releaseCadence} />
          </div>
        </ScrollReveal>
      </SectionShell>

      <SectionShell>
        <ScrollReveal y={12}>
          <h2 className="text-xl font-semibold">Featured cards</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Pinned-first lineup with relevance score and direct project links.
          </p>
          <div className="mt-5">
            <section className="grid gap-4 lg:grid-cols-3">
              {featured.map((repo, index) => (
                <Card
                  className="p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)] motion-reduce:hover:translate-y-0 sm:p-5"
                  key={repo.id}
                  data-featured-card
                >
                  <div className="flex items-center justify-between gap-4">
                    <Badge>#{index + 1}</Badge>
                    <div className="flex items-center gap-2">
                      <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Score {relevanceByRepo.get(repo.full_name) ?? 0}
                      </Badge>
                      {pinnedIds.has(repo.id) ? (
                        <Badge>Pinned</Badge>
                      ) : (
                        <Badge className="bg-transparent">Star-ranked</Badge>
                      )}
                      <Badge className="bg-transparent text-[var(--muted-foreground)]">
                        {repo.stargazers_count}★
                      </Badge>
                    </div>
                  </div>
                  <h2 className="mt-5 text-xl font-semibold tracking-tight">
                    {repo.name}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                    {repo.description ?? "No description yet."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2 text-sm text-[var(--muted-foreground)]">
                    <span>{repo.language ?? "Unknown"}</span>
                    <span>•</span>
                    <span>Updated {formatRepoDate(repo.pushed_at)}</span>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <ButtonLink
                      href={repo.html_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View source
                    </ButtonLink>
                    {repo.homepage ? (
                      <ButtonLink
                        href={repo.homepage}
                        target="_blank"
                        rel="noreferrer"
                        variant="secondary"
                      >
                        Open live site
                      </ButtonLink>
                    ) : null}
                  </div>
                </Card>
              ))}
            </section>
          </div>
        </ScrollReveal>
      </SectionShell>
    </div>
  );
}

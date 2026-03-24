import { Badge } from "@/app/components/ui/badge";
import { ButtonLink } from "@/app/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { ContributionTrendChart } from "@/app/components/charts/contribution-trend-chart";
import { LanguageShareChart } from "@/app/components/charts/language-share-chart";
import { AnimatedHeadline } from "@/app/components/motion/animated-headline";
import { ScrollReveal } from "@/app/components/motion/scroll-reveal";
import { SectionShell } from "@/app/components/section-shell";
import {
  buildRepoCommitActivitySummary,
  formatRepoDate,
  getContributionDays,
  getPinnedRepos,
  getRepos,
  prettyDay,
  USERNAME,
} from "@/lib/github";

export const revalidate = 300;
const HOME_SUMMARY_ITEM_COUNT = 4;

export default async function Home() {
  const [days, repos, pinnedRepos] = await Promise.all([
    getContributionDays(),
    getRepos(),
    getPinnedRepos(),
  ]);
  const totalContributions = days.reduce((sum, day) => sum + day.count, 0);
  const topLanguages = [
    ...new Set(repos.map((repo) => repo.language).filter(Boolean)),
  ].slice(0, 4);
  const fallbackFeaturedRepos = [...repos]
    .sort(
      (a, b) =>
        b.stargazers_count - a.stargazers_count ||
        +new Date(b.pushed_at) - +new Date(a.pushed_at),
    )
    .slice(0, HOME_SUMMARY_ITEM_COUNT);
  const featuredRepos = (() => {
    if (pinnedRepos.length === 0) {
      return fallbackFeaturedRepos;
    }

    const pinnedSlice = pinnedRepos.slice(0, HOME_SUMMARY_ITEM_COUNT);
    if (pinnedSlice.length >= HOME_SUMMARY_ITEM_COUNT) {
      return pinnedSlice;
    }

    const pinnedFullNames = new Set(pinnedSlice.map((repo) => repo.full_name));
    const fallbackFill = fallbackFeaturedRepos.filter(
      (repo) => !pinnedFullNames.has(repo.full_name),
    );

    return [...pinnedSlice, ...fallbackFill].slice(0, HOME_SUMMARY_ITEM_COUNT);
  })();
  const featuredUsesPinned = pinnedRepos.length > 0;
  const activeDays = days.filter((day) => day.count > 0).length;
  const averagePerDay = totalContributions / Math.max(days.length, 1);
  const strongestDay = days.reduce(
    (best, day) => (day.count > best.count ? day : best),
    days[0] ?? { date: "", count: 0, level: 0 as const },
  );
  const trendData = days.map((day) => ({
    date: prettyDay(day.date),
    count: day.count,
  }));
  const homeCommitSummary = await buildRepoCommitActivitySummary(repos, 8);
  const recentShipping = [...homeCommitSummary.perRepo]
    .sort((a, b) => +new Date(b.pushedAt) - +new Date(a.pushedAt))
    .slice(0, HOME_SUMMARY_ITEM_COUNT);
  const languageCounts = repos.reduce<Record<string, number>>((acc, repo) => {
    if (!repo.language) {
      return acc;
    }

    acc[repo.language] = (acc[repo.language] ?? 0) + 1;
    return acc;
  }, {});
  const languageShareData = Object.entries(languageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <SectionShell className="overflow-hidden p-0">
        <div className="grid gap-6 px-4 py-5 sm:px-6 sm:py-7 lg:grid-cols-[1.25fr_0.95fr] lg:items-end lg:px-8 lg:py-8">
          <div>
            <div className="mt-4 inline-flex items-center gap-2">
              <Badge>Overview</Badge>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-colors duration-300 motion-safe:hover:border-emerald-500/45 motion-safe:hover:bg-emerald-500/15 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)] motion-safe:animate-pulse" />
                <span className="text-[11px] whitespace-nowrap sm:text-xs">
                  {`Live signal · @${USERNAME}`}
                </span>
              </div>
            </div>
            <AnimatedHeadline
              text="Build turns GitHub activity into a cleaner operating dashboard."
              variant="typewriter"
              className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-6xl"
            />
            <ScrollReveal
              delay={0.24}
              y={12}
              targets="[data-hero-item]"
              stagger={0.1}
            >
              <p
                data-hero-item
                className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)] sm:text-[17px]"
              >
                A clear view of how {USERNAME} ships: contribution trends,
                repository momentum, and featured projects in one place, without
                the usual GitHub noise.
              </p>
              <div data-hero-item className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/activity">View activity</ButtonLink>
                <ButtonLink href="/repos" variant="secondary">
                  Explore repos
                </ButtonLink>
                <ButtonLink
                  href={`https://github.com/${USERNAME}`}
                  target="_blank"
                  rel="noreferrer"
                  variant="ghost"
                >
                  View GitHub
                </ButtonLink>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={0.2} y={16}>
            <Card className="relative overflow-hidden p-4 sm:p-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(16,185,129,0.14),transparent)]" />
              <CardHeader className="relative">
                <CardDescription>Quick snapshot</CardDescription>
                <CardTitle className="text-3xl text-balance">
                  {totalContributions} contributions in 30 days
                </CardTitle>
              </CardHeader>
              <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-4">
                  <div className="text-xs tracking-[0.18em] text-[var(--muted-foreground)] uppercase">
                    Repos tracked
                  </div>
                  <div className="mt-2 text-2xl font-semibold">
                    {repos.length}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-4">
                  <div className="text-xs tracking-[0.18em] text-[var(--muted-foreground)] uppercase">
                    Languages
                  </div>
                  <div className="mt-2 text-2xl font-semibold">
                    {topLanguages.length}
                  </div>
                </div>
              </div>
              <div className="relative mt-5 flex flex-wrap gap-2">
                {topLanguages.map((language) => (
                  <Badge key={language}>{language}</Badge>
                ))}
              </div>
            </Card>
          </ScrollReveal>
        </div>
      </SectionShell>

      <section className="grid items-stretch gap-4 lg:grid-cols-2">
        <ScrollReveal y={12} className="h-full">
          <SectionShell className="flex h-full flex-col">
            <h2 className="text-xl font-semibold">Signal preview</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              30-day signal for consistency, pace, and peak output.
            </p>
            <div className="mt-5 flex min-h-0 flex-1 flex-col">
              <ContributionTrendChart data={trendData} compact />
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2">
                  <div className="text-xs text-[var(--muted-foreground)]">
                    Active days
                  </div>
                  <div className="mt-1 font-semibold text-[var(--foreground)]">
                    {activeDays}/{days.length}
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2">
                  <div className="text-xs text-[var(--muted-foreground)]">
                    Average/day
                  </div>
                  <div className="mt-1 font-semibold text-[var(--foreground)]">
                    {averagePerDay.toFixed(1)}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-[var(--muted-foreground)]">
                Strongest day ({prettyDay(strongestDay.date)}):{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {strongestDay.count}
                </span>{" "}
                contributions
              </div>
            </div>
          </SectionShell>
        </ScrollReveal>
        <ScrollReveal y={12} delay={0.06} className="h-full">
          <SectionShell className="flex h-full flex-col">
            <h2 className="text-xl font-semibold">Language share</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Languages used most across active repositories.
            </p>
            <div className="mt-5 flex min-h-0 flex-1">
              <LanguageShareChart data={languageShareData} frameless />
            </div>
          </SectionShell>
        </ScrollReveal>
      </section>

      <ScrollReveal y={12}>
        <SectionShell className="h-full">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Featured work</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Pinned priorities first, plus a fast read on what is shipping
                now.
              </p>
            </div>
            <div className="flex gap-2">
              <ButtonLink href="/featured" variant="secondary">
                View featured
              </ButtonLink>
              <ButtonLink href="/repos" variant="secondary">
                Explore repos
              </ButtonLink>
            </div>
          </div>

          <div className="mt-5 grid items-start gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="px-1">
                <h3 className="text-base font-semibold tracking-tight">
                  Pinned focus
                </h3>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Curated projects that represent current priorities.
                </p>
              </div>
              {featuredRepos.map((repo) => (
                <a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] px-4 py-3 transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--accent-soft)] hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)] motion-reduce:hover:translate-y-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium">{repo.name}</div>
                        {featuredUsesPinned ? (
                          <Badge className="px-2.5 py-0.5 leading-none">
                            Pinned
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                        {repo.description ?? "No description yet."}
                      </p>
                    </div>
                    <Badge className="self-start leading-none">
                      {repo.stargazers_count}★
                    </Badge>
                  </div>
                </a>
              ))}
            </div>

            <div className="space-y-3">
              <div className="px-1">
                <h3 className="text-base font-semibold tracking-tight">
                  Recent shipping
                </h3>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Most recently updated repositories, with 30-day commit totals
                  for context.
                </p>
              </div>
              {recentShipping.map((repo) => (
                <a
                  key={repo.fullName}
                  href={`https://github.com/${repo.fullName}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] px-4 py-3 transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--accent-soft)] hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)] motion-reduce:hover:translate-y-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium break-words">
                        {repo.fullName.split("/")[1] ?? repo.name}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                        Updated {formatRepoDate(repo.pushedAt)}
                      </p>
                    </div>
                    <Badge className="self-start leading-none">
                      {repo.commits} commits
                    </Badge>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </SectionShell>
      </ScrollReveal>
    </div>
  );
}

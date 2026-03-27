import { Badge } from "@/app/components/ui/badge";
import type { Metadata } from "next";
import { RepoPushCadenceChart } from "@/app/components/charts/repo-push-cadence-chart";
import { RepoRiskChart } from "@/app/components/charts/repo-risk-chart";
import { ReposMomentumChart } from "@/app/components/charts/repos-momentum-chart";
import { ReposCardList } from "@/app/components/repos-card-list";
import { AnimatedHeadline } from "@/app/components/motion/animated-headline";
import { ScrollReveal } from "@/app/components/motion/scroll-reveal";
import { SectionShell } from "@/app/components/section-shell";
import {
  buildRepoCommitActivitySummary,
  daysSince,
  getPinnedRepos,
  getRepoRiskSnapshot,
  getRepos,
  type RepoRiskSnapshot,
} from "@/lib/github";
import { getPublicSiteUrl } from "@/lib/site-config";

const siteUrl = getPublicSiteUrl();
const reposPath = "/repos";
const reposUrl = `${siteUrl}${reposPath}`;
const reposDescription =
  "Repository health at a glance: pinned momentum, commit cadence, risk distribution, and a browsable inventory of active projects.";

export const metadata: Metadata = {
  title: "Repos",
  description: reposDescription,
  alternates: {
    canonical: reposPath,
  },
  openGraph: {
    title: "Repos · Build",
    description: reposDescription,
    url: reposUrl,
    type: "website",
    images: [
      {
        url: `${siteUrl}/globe.svg`,
        alt: "Build repository surface area overview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Repos · Build",
    description: reposDescription,
    images: [`${siteUrl}/globe.svg`],
  },
};

export const revalidate = 300;

const FALLBACK_REPO_RISK_SNAPSHOT: RepoRiskSnapshot = {
  totalRepos: 0,
  archivedRepos: 0,
  privateRepos: 0,
  atRiskRepos: 0,
  buckets: [
    { label: "Hot (0-7d)", count: 0 },
    { label: "Active (8-30d)", count: 0 },
    { label: "Stale (31-90d)", count: 0 },
    { label: "Dormant (90d+)", count: 0 },
  ],
};

export default async function ReposPage() {
  const reportRejected = (label: string, reason: unknown) => {
    console.error(`[repos/page] Failed to load ${label}:`, reason);
  };

  const reposPromise = getRepos();
  const pinnedReposPromise = getPinnedRepos();
  const repoRiskSnapshotPromise = getRepoRiskSnapshot();

  const [reposResult, pinnedReposResult, repoRiskSnapshotResult] =
    await Promise.allSettled([
      reposPromise,
      pinnedReposPromise,
      repoRiskSnapshotPromise,
    ]);
  const repos = reposResult.status === "fulfilled" ? reposResult.value : [];
  if (reposResult.status === "rejected") {
    reportRejected("repositories", reposResult.reason);
  }
  const pinnedRepos =
    pinnedReposResult.status === "fulfilled" ? pinnedReposResult.value : [];
  if (pinnedReposResult.status === "rejected") {
    reportRejected("pinned repositories", pinnedReposResult.reason);
  }
  const repoRiskSnapshot =
    repoRiskSnapshotResult.status === "fulfilled"
      ? repoRiskSnapshotResult.value
      : FALLBACK_REPO_RISK_SNAPSHOT;
  if (repoRiskSnapshotResult.status === "rejected") {
    reportRejected("repo risk snapshot", repoRiskSnapshotResult.reason);
  }
  let commitSummary: Awaited<
    ReturnType<typeof buildRepoCommitActivitySummary>
  > = { weekly: [], perRepo: [] };
  try {
    commitSummary = await buildRepoCommitActivitySummary(repos);
  } catch (error) {
    reportRejected("repo commit activity summary", error);
  }
  const pinnedRepoNames = new Set(pinnedRepos.map((repo) => repo.full_name));
  const reposByFullName = new Map(repos.map((repo) => [repo.full_name, repo]));
  const cadenceData = commitSummary.weekly;
  const commitCountsByFullName = new Map(
    commitSummary.perRepo.map((repo) => [repo.fullName, repo.commits]),
  );
  const pinnedMomentum = pinnedRepos.map((repo) => {
    const commits = commitCountsByFullName.get(repo.full_name) ?? 0;
    return {
      name: repo.name.length > 12 ? `${repo.name.slice(0, 12)}…` : repo.name,
      fullName: repo.full_name,
      commits30d: commits,
      daysSincePush: daysSince(repo.pushed_at),
      sourceLabel: "Pinned" as const,
      pinned: true,
    };
  });
  const nonPinnedMomentum = commitSummary.perRepo
    .filter((repo) => !pinnedRepoNames.has(repo.fullName))
    .slice(0, Math.max(0, 8 - pinnedMomentum.length))
    .map((repo) => {
      const baseRepo = reposByFullName.get(repo.fullName);
      return {
        name: repo.name.length > 12 ? `${repo.name.slice(0, 12)}…` : repo.name,
        fullName: repo.fullName,
        commits30d: repo.commits,
        daysSincePush: daysSince(baseRepo?.pushed_at ?? repo.pushedAt),
        sourceLabel: "Non-pinned" as const,
        pinned: false,
      };
    });
  const scatterData = [...pinnedMomentum, ...nonPinnedMomentum].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return b.commits30d - a.commits30d;
  });
  return (
    <div className="flex flex-col gap-6">
      <SectionShell>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] text-emerald-500/80 uppercase">
              Repos
            </p>
            <AnimatedHeadline
              text="Repository surface area"
              variant="line"
              className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
            />
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
              A readable map of current repository health: what is active now,
              what is slowing down, and where attention is needed next.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{repos.length} active repos</Badge>
            <Badge>{pinnedRepos.length} pinned repos</Badge>
            <Badge>{repoRiskSnapshot.atRiskRepos} needs attention</Badge>
          </div>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="grid gap-4 lg:grid-cols-2">
          <ScrollReveal y={12}>
            <h2 className="text-xl font-semibold">
              Pinned vs non-pinned momentum
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              30-day commits across top active repositories, with pinned
              projects highlighted.
            </p>
            <div className="mt-5">
              <ReposMomentumChart data={scatterData} />
            </div>
          </ScrollReveal>

          <ScrollReveal y={12} delay={0.06}>
            <h2 className="text-xl font-semibold">Commit cadence</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Weekly commit totals across top active repositories in the current
              30-day window.
            </p>
            <div className="mt-5">
              <RepoPushCadenceChart data={cadenceData} />
            </div>
          </ScrollReveal>
        </div>
      </SectionShell>

      <SectionShell>
        <ScrollReveal y={12}>
          <h2 className="text-xl font-semibold">Repo risk panel</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Freshness distribution across active states: hot, active, stale, and
            dormant.
          </p>
          <div className="mt-5">
            <RepoRiskChart snapshot={repoRiskSnapshot} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
            <Badge>Total {repoRiskSnapshot.totalRepos}</Badge>
            <Badge>Needs attention {repoRiskSnapshot.atRiskRepos}</Badge>
            <Badge>Private {repoRiskSnapshot.privateRepos}</Badge>
          </div>
        </ScrollReveal>
      </SectionShell>

      <SectionShell>
        <ScrollReveal y={14} start="top 90%">
          <h2 className="text-xl font-semibold">Repository inventory</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Browse repositories with quick context and direct source and
            deployment links.
          </p>
          <ReposCardList repos={repos} className="mt-5" />
        </ScrollReveal>
      </SectionShell>
    </div>
  );
}

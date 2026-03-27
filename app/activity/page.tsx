import { Suspense } from "react";
import { DelayedFallback } from "@/app/activity/delayed-fallback";
import {
  ActivityCommitTimingSection,
  ActivityHeroSection,
  ActivityHeroSkeleton,
  ActivitySectionSkeleton,
  ActivityTrendBreakdownSection,
  ActivityTrendBreakdownSkeleton,
  ActivityFlowHealthSection,
  ActivityHeatmapSection,
} from "@/app/activity/sections";
import { cacheLife, cacheTag } from "next/cache";
import {
  type CommitTimingHeatmapData,
  type ContributionDay,
  type IssueFlowHealthPoint,
  type PullRequestHealthPoint,
  getCommitTimingHeatmap,
  getContributionDays,
  getIssueFlowHealth,
  getPullRequestHealth,
} from "@/lib/github";
import { getConfiguredActivityTimezone } from "@/lib/timezone";

export const metadata = {
  title: "Activity",
};

const ACTIVITY_FETCH_TIMEOUT_MS = 12_000;
const ACTIVITY_CACHE_REVALIDATE_SECONDS = 300;
const ACTIVITY_DEFAULT_TIMEZONE = getConfiguredActivityTimezone();
const FALLBACK_COMMIT_TIMING_HEATMAP: CommitTimingHeatmapData = {
  timezone: ACTIVITY_DEFAULT_TIMEZONE,
  totalCommits: 0,
  maxCellCount: 0,
  cells: [],
};

class ActivityFetchTimeoutError extends Error {
  constructor(label: string, timeoutMs: number) {
    super(`${label} timed out after ${timeoutMs}ms`);
    this.name = "ActivityFetchTimeoutError";
  }
}

async function withActivityTimeout<T>(
  label: string,
  taskFactory: () => Promise<T>,
  timeoutMs: number = ACTIVITY_FETCH_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new ActivityFetchTimeoutError(label, timeoutMs));
    }, timeoutMs);
  });

  try {
    return await Promise.race([taskFactory(), timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function withActivityTiming<T>(
  label: string,
  taskFactory: () => Promise<T>,
  timeoutMs: number = ACTIVITY_FETCH_TIMEOUT_MS,
): Promise<T> {
  console.info(`[activity/page] start ${label}`);

  try {
    const result = await withActivityTimeout(label, taskFactory, timeoutMs);
    console.info(`[activity/page] success ${label}`);
    return result;
  } catch (error) {
    console.warn(`[activity/page] failed ${label}`, error);
    throw error;
  }
}

async function getCachedContributionDays() {
  "use cache";
  cacheLife({ revalidate: ACTIVITY_CACHE_REVALIDATE_SECONDS });
  cacheTag("route:activity");
  cacheTag("github:activity");
  cacheTag("github:contributions");
  return getContributionDays();
}

async function getCachedPullRequestHealth() {
  "use cache";
  cacheLife({ revalidate: ACTIVITY_CACHE_REVALIDATE_SECONDS });
  cacheTag("route:activity");
  cacheTag("github:activity");
  cacheTag("github:pull-request-health");
  return getPullRequestHealth();
}

async function getCachedIssueFlowHealth() {
  "use cache";
  cacheLife({ revalidate: ACTIVITY_CACHE_REVALIDATE_SECONDS });
  cacheTag("route:activity");
  cacheTag("github:activity");
  cacheTag("github:issue-flow-health");
  return getIssueFlowHealth();
}

async function getCachedCommitTimingHeatmap() {
  "use cache";
  cacheLife({ revalidate: ACTIVITY_CACHE_REVALIDATE_SECONDS });
  cacheTag("route:activity");
  cacheTag("github:activity");
  cacheTag("github:commit-timing");
  return getCommitTimingHeatmap(ACTIVITY_DEFAULT_TIMEZONE);
}

async function resolveWithFallback<T>(
  label: string,
  promise: Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.warn(`[activity/page] fallback ${label}`, error);
    return fallback;
  }
}

async function HeroSectionSlot({
  daysPromise,
}: {
  daysPromise: Promise<ContributionDay[]>;
}) {
  const days = await resolveWithFallback("hero", daysPromise, []);
  return <ActivityHeroSection days={days} />;
}

async function HeatmapSectionSlot({
  daysPromise,
}: {
  daysPromise: Promise<ContributionDay[]>;
}) {
  const days = await resolveWithFallback("heatmap", daysPromise, []);
  return <ActivityHeatmapSection days={days} />;
}

async function FlowHealthSectionSlot({
  prHealthPromise,
  issueFlowPromise,
}: {
  prHealthPromise: Promise<PullRequestHealthPoint[]>;
  issueFlowPromise: Promise<IssueFlowHealthPoint[]>;
}) {
  const [prHealthData, issueFlowData] = await Promise.all([
    resolveWithFallback("PR flow health section", prHealthPromise, []),
    resolveWithFallback("issue flow section", issueFlowPromise, []),
  ]);

  return (
    <ActivityFlowHealthSection
      prHealthData={prHealthData}
      issueFlowData={issueFlowData}
    />
  );
}

async function CommitTimingSectionSlot({
  commitTimingPromise,
}: {
  commitTimingPromise: Promise<CommitTimingHeatmapData>;
}) {
  const commitTimingHeatmap = await resolveWithFallback(
    "commit timing section",
    commitTimingPromise,
    FALLBACK_COMMIT_TIMING_HEATMAP,
  );

  return <ActivityCommitTimingSection commitTimingHeatmap={commitTimingHeatmap} />;
}

async function TrendBreakdownSectionSlot({
  daysPromise,
  prHealthPromise,
}: {
  daysPromise: Promise<ContributionDay[]>;
  prHealthPromise: Promise<PullRequestHealthPoint[]>;
}) {
  const [days, prHealthData] = await Promise.all([
    resolveWithFallback("trend section days", daysPromise, []),
    resolveWithFallback("trend section PR health", prHealthPromise, []),
  ]);

  return <ActivityTrendBreakdownSection days={days} prHealthData={prHealthData} />;
}

export default async function ActivityPage() {
  const daysPromise = withActivityTiming(
    "contribution days",
    getCachedContributionDays,
  );
  const prHealthPromise = withActivityTiming(
    "PR flow health",
    getCachedPullRequestHealth,
  );
  const issueFlowPromise = withActivityTiming(
    "issue flow health",
    getCachedIssueFlowHealth,
  );
  const commitTimingPromise = withActivityTiming(
    "commit timing heatmap",
    getCachedCommitTimingHeatmap,
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Suspense
        fallback={
          <DelayedFallback delayMs={150}>
            <ActivityHeroSkeleton />
          </DelayedFallback>
        }
      >
        <HeroSectionSlot daysPromise={daysPromise} />
      </Suspense>

      <Suspense
        fallback={
          <DelayedFallback delayMs={250}>
            <ActivitySectionSkeleton
              titleWidth="w-40"
              lineWidth="w-72"
              bodyHeight="h-64"
            />
          </DelayedFallback>
        }
      >
        <HeatmapSectionSlot daysPromise={daysPromise} />
      </Suspense>

      <Suspense
        fallback={
          <DelayedFallback delayMs={300}>
            <ActivitySectionSkeleton
              titleWidth="w-32"
              lineWidth="w-80"
              bodyHeight="h-72"
            />
          </DelayedFallback>
        }
      >
        <FlowHealthSectionSlot
          prHealthPromise={prHealthPromise}
          issueFlowPromise={issueFlowPromise}
        />
      </Suspense>

      <Suspense
        fallback={
          <DelayedFallback delayMs={350}>
            <ActivitySectionSkeleton
              titleWidth="w-52"
              lineWidth="w-96 max-w-full"
              bodyHeight="h-72"
            />
          </DelayedFallback>
        }
      >
        <CommitTimingSectionSlot commitTimingPromise={commitTimingPromise} />
      </Suspense>

      <Suspense
        fallback={
          <DelayedFallback delayMs={400}>
            <ActivityTrendBreakdownSkeleton />
          </DelayedFallback>
        }
      >
        <TrendBreakdownSectionSlot
          daysPromise={daysPromise}
          prHealthPromise={prHealthPromise}
        />
      </Suspense>
    </div>
  );
}

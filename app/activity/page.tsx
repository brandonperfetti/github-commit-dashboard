import { ActivityOverview } from "@/app/components/activity-overview";
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

export const metadata = {
  title: "Activity",
};

export const revalidate = 300;

const ACTIVITY_FETCH_TIMEOUT_MS = 12_000;

class ActivityFetchTimeoutError extends Error {
  constructor(label: string, timeoutMs: number) {
    super(`${label} timed out after ${timeoutMs}ms`);
    this.name = "ActivityFetchTimeoutError";
  }
}

async function withActivityTimeout<T>(
  label: string,
  task: Promise<T>,
  timeoutMs: number = ACTIVITY_FETCH_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new ActivityFetchTimeoutError(label, timeoutMs));
    }, timeoutMs);
  });

  try {
    return await Promise.race([task, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function withActivityTiming<T>(
  label: string,
  task: Promise<T>,
  timeoutMs: number = ACTIVITY_FETCH_TIMEOUT_MS,
): Promise<T> {
  const startedAt = Date.now();
  console.info(`[activity/page] start ${label}`);

  try {
    const result = await withActivityTimeout(label, task, timeoutMs);
    const durationMs = Date.now() - startedAt;
    console.info(`[activity/page] success ${label} (${durationMs}ms)`);
    return result;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    console.warn(`[activity/page] failed ${label} (${durationMs}ms)`, error);
    throw error;
  }
}

export default async function ActivityPage() {
  const fallbackCommitTimingHeatmap: CommitTimingHeatmapData = {
    timezone: "UTC",
    totalCommits: 0,
    maxCellCount: 0,
    cells: [],
  };

  const [daysResult, prHealthResult, issueFlowResult, commitTimingResult] =
    await Promise.allSettled([
      withActivityTiming("contribution days", getContributionDays()),
      withActivityTiming("PR flow health", getPullRequestHealth()),
      withActivityTiming("issue flow health", getIssueFlowHealth()),
      // Keep this page static so `revalidate` remains effective; timezone-aware
      // refinement can happen client-side without forcing dynamic rendering.
      withActivityTiming("commit timing heatmap", getCommitTimingHeatmap()),
    ]);

  const days: ContributionDay[] =
    daysResult.status === "fulfilled" ? daysResult.value : [];

  const prHealthData: PullRequestHealthPoint[] =
    prHealthResult.status === "fulfilled" ? prHealthResult.value : [];

  const issueFlowData: IssueFlowHealthPoint[] =
    issueFlowResult.status === "fulfilled" ? issueFlowResult.value : [];

  const commitTimingHeatmap: CommitTimingHeatmapData =
    commitTimingResult.status === "fulfilled"
      ? commitTimingResult.value
      : fallbackCommitTimingHeatmap;

  return (
    <ActivityOverview
      days={days}
      prHealthData={prHealthData}
      issueFlowData={issueFlowData}
      commitTimingHeatmap={commitTimingHeatmap}
    />
  );
}

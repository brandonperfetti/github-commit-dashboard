import { ActivityOverview } from "@/app/components/activity-overview";
import { headers } from "next/headers";
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

export default async function ActivityPage() {
  const fallbackCommitTimingHeatmap: CommitTimingHeatmapData = {
    timezone: "UTC",
    totalCommits: 0,
    maxCellCount: 0,
    cells: [],
  };

  const reportRejected = (label: string, reason: unknown) => {
    console.error(`[activity/page] Failed to load ${label}:`, reason);
  };

  const requestHeaders = await headers();
  const requestTimezone =
    requestHeaders.get("x-time-zone") ??
    requestHeaders.get("x-vercel-ip-timezone") ??
    undefined;

  const [daysResult, prHealthResult, issueFlowResult, commitTimingResult] =
    await Promise.allSettled([
      getContributionDays(),
      getPullRequestHealth(),
      getIssueFlowHealth(),
      getCommitTimingHeatmap(undefined, requestTimezone),
    ]);

  const days: ContributionDay[] =
    daysResult.status === "fulfilled" ? daysResult.value : [];
  if (daysResult.status === "rejected") {
    reportRejected("contribution days", daysResult.reason);
  }

  const prHealthData: PullRequestHealthPoint[] =
    prHealthResult.status === "fulfilled" ? prHealthResult.value : [];
  if (prHealthResult.status === "rejected") {
    reportRejected("PR flow health", prHealthResult.reason);
  }

  const issueFlowData: IssueFlowHealthPoint[] =
    issueFlowResult.status === "fulfilled" ? issueFlowResult.value : [];
  if (issueFlowResult.status === "rejected") {
    reportRejected("issue flow health", issueFlowResult.reason);
  }

  const commitTimingHeatmap: CommitTimingHeatmapData =
    commitTimingResult.status === "fulfilled"
      ? commitTimingResult.value
      : fallbackCommitTimingHeatmap;
  if (commitTimingResult.status === "rejected") {
    reportRejected("commit timing heatmap", commitTimingResult.reason);
  }

  return (
    <ActivityOverview
      days={days}
      prHealthData={prHealthData}
      issueFlowData={issueFlowData}
      commitTimingHeatmap={commitTimingHeatmap}
    />
  );
}

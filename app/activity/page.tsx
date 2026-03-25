import { ActivityOverview } from "@/app/components/activity-overview";
import { headers } from "next/headers";
import {
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
  const requestHeaders = await headers();
  const requestTimezone =
    requestHeaders.get("x-time-zone") ??
    requestHeaders.get("x-vercel-ip-timezone") ??
    undefined;

  const [days, prHealthData, issueFlowData, commitTimingHeatmap] =
    await Promise.all([
      getContributionDays(),
      getPullRequestHealth(),
      getIssueFlowHealth(),
      getCommitTimingHeatmap(undefined, requestTimezone),
    ]);

  return (
    <ActivityOverview
      days={days}
      prHealthData={prHealthData}
      issueFlowData={issueFlowData}
      commitTimingHeatmap={commitTimingHeatmap}
    />
  );
}
